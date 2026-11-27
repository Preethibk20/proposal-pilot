import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAgency } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProposalEditor } from "@/components/ProposalEditor";
import type { Proposal } from "@/lib/types";
import { getAppUrl } from "@/lib/utils";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agency = await requireAgency();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("agency_id", agency.id)
    .single();

  if (!proposal) {
    notFound();
  }

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : undefined;
  const appUrl = getAppUrl(origin);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar agencyName={agency.name} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ProposalEditor
          initialProposal={proposal as Proposal}
          appUrl={appUrl}
        />
      </main>
    </div>
  );
}
