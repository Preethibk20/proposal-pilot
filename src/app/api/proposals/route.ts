import { NextResponse } from "next/server";
import { getAuthenticatedAgency } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createProposalSchema, generateSlug } from "@/lib/validation";

export async function GET() {
  const agency = await getAuthenticatedAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("agency_id", agency.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ proposals: data });
}

export async function POST(request: Request) {
  const agency = await getAuthenticatedAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const slug = generateSlug(input.client_name, input.title);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("proposals")
    .insert({
      agency_id: agency.id,
      slug,
      client_name: input.client_name,
      title: input.title,
      executive_summary: input.executive_summary,
      scope: input.scope,
      deliverables: input.deliverables,
      timeline: input.timeline,
      line_items: input.line_items,
      currency: input.currency,
      terms: input.terms,
      valid_until: input.valid_until ?? null,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ proposal: data }, { status: 201 });
}
