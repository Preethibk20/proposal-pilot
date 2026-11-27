import crypto from "crypto";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "./supabase/server";
import type { Agency } from "./types";

export async function getAuthenticatedAgency(): Promise<Agency | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", user.id)
    .single();

  if (agency) return agency as Agency;

  // Fallback: create agency profile if auth trigger didn't run
  const fallbackName =
    (user.user_metadata?.agency_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "My Agency";

  const { data: created, error } = await supabase
    .from("agencies")
    .insert({
      id: user.id,
      name: fallbackName,
      email: user.email || "",
      mcp_token: crypto.randomBytes(24).toString("hex"),
    })
    .select("*")
    .single();

  if (error || !created) return null;
  return created as Agency;
}

export async function requireAgency(): Promise<Agency> {
  const agency = await getAuthenticatedAgency();
  if (!agency) {
    redirect("/login");
  }
  return agency;
}
