import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedAgency } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const agency = await getAuthenticatedAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newToken = crypto.randomBytes(24).toString("hex");
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("agencies")
    .update({ mcp_token: newToken })
    .eq("id", agency.id)
    .select("mcp_token")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to regenerate MCP token." },
      { status: 500 }
    );
  }

  return NextResponse.json({ mcp_token: data.mcp_token });
}
