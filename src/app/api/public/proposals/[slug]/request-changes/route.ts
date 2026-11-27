import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/utils";
import { requestChangesSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getClientIp(request);

  const rate = checkRateLimit(`changes:${ip}:${slug}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestChangesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ||
          "Please describe the changes you would like.",
      },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("slug", slug)
    .single();

  if (fetchError || !proposal || proposal.status === "draft") {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status === "accepted") {
    return NextResponse.json(
      { error: "This proposal has already been accepted and cannot be changed." },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("proposals")
    .update({
      status: "changes_requested",
      change_request_note: parsed.data.note,
    })
    .eq("id", proposal.id)
    .neq("status", "accepted")
    .select("status, change_request_note")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Failed to submit change request. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: updated.status,
    change_request_note: updated.change_request_note,
  });
}
