import { notFound } from "next/navigation";
import { getAuthenticatedAgency } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PublicProposalView } from "@/components/PublicProposalView";
import type { Proposal } from "@/lib/types";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*, agencies(name)")
    .eq("slug", slug)
    .single();

  if (error || !proposal || proposal.status === "draft") {
    notFound();
  }

  // Increment view_count only if visitor is NOT the logged-in owner
  const currentAgency = await getAuthenticatedAgency();
  const isOwner = currentAgency?.id === proposal.agency_id;

  if (!isOwner) {
    await supabase
      .from("proposals")
      .update({ view_count: (proposal.view_count || 0) + 1 })
      .eq("id", proposal.id);
  }

  const agencyRecord = proposal.agencies as unknown as { name?: string } | null;
  const agencyName = agencyRecord?.name || "Agency";

  return (
    <PublicProposalView
      proposal={proposal as Proposal}
      agencyName={agencyName}
    />
  );
}
