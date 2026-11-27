import { headers } from "next/headers";
import { requireAgency } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { DashboardClient } from "@/components/DashboardClient";
import type { Proposal } from "@/lib/types";
import { getAppUrl } from "@/lib/utils";

export default async function DashboardPage() {
  const agency = await requireAgency();
  const supabase = await createServerSupabaseClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select("*")
    .eq("agency_id", agency.id)
    .order("updated_at", { ascending: false });

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : undefined;
  const appUrl = getAppUrl(origin);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar agencyName={agency.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <DashboardClient
          proposals={(proposals as Proposal[]) || []}
          appUrl={appUrl}
        />
      </main>
    </div>
  );
}
