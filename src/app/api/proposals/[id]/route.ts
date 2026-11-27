import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAgency } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateProposalSchema } from "@/lib/validation";

const patchBodySchema = updateProposalSchema.extend({
  status: z.enum(["draft", "published"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const agency = await getAuthenticatedAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("agency_id", agency.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const agency = await getAuthenticatedAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("id", id)
    .eq("agency_id", agency.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (existing.status === "accepted") {
    return NextResponse.json(
      { error: "Accepted proposals are immutable and cannot be edited." },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("proposals")
    .update(parsed.data)
    .eq("id", id)
    .eq("agency_id", agency.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message || "Failed to update proposal" },
      { status: 500 }
    );
  }

  return NextResponse.json({ proposal: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const agency = await getAuthenticatedAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("id", id)
    .eq("agency_id", agency.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (existing.status === "accepted") {
    return NextResponse.json(
      { error: "Accepted proposals cannot be deleted." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", id)
    .eq("agency_id", agency.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
