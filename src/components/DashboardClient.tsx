"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Eye,
  ExternalLink,
  FilePlus2,
  Plug,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { Proposal } from "@/lib/types";
import { computeProposalTotal } from "@/lib/validation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardClientProps {
  proposals: Proposal[];
  appUrl: string;
}

export function DashboardClient({ proposals, appUrl }: DashboardClientProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCopyLink(proposal: Proposal) {
    const url = `${appUrl}/p/${proposal.slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(proposal.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCreateBlank() {
    setCreating(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "New Client",
          title: "Untitled Proposal",
          executive_summary: "",
          scope: "",
          deliverables: [],
          timeline: [],
          line_items: [{ description: "Project fee", quantity: 1, unit_price: 1000 }],
          currency: "USD",
          terms: "50% upfront upon acceptance, 50% upon final delivery.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/proposals/${data.proposal.id}/edit`);
      }
    } finally {
      setCreating(false);
    }
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Plug className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          No proposals yet — connect Claude and ask it to create one
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Copy your private MCP URL from Settings, add it to Claude as a custom
          connector, and paste your discovery call notes.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-2xs hover:bg-indigo-700"
          >
            <Plug className="h-4 w-4" />
            Connect Claude (MCP)
          </Link>
          <button
            type="button"
            onClick={handleCreateBlank}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-60"
          >
            <FilePlus2 className="h-4 w-4" />
            {creating ? "Creating..." : "Create blank proposal"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Proposals
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Drafted by Claude via MCP or created manually. Publish when ready to share.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateBlank}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-60"
        >
          <FilePlus2 className="h-4 w-4" />
          {creating ? "Creating..." : "New proposal"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Proposal</th>
                <th className="px-5 py-3.5">Client</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Views</th>
                <th className="px-5 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {proposals.map((proposal) => {
                const total = computeProposalTotal(proposal.line_items || []);
                const isLive = proposal.status !== "draft";
                const isCopied = copiedId === proposal.id;

                return (
                  <tr
                    key={proposal.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <Link
                        href={`/proposals/${proposal.id}/edit`}
                        prefetch={false}
                        className="hover:text-indigo-600"
                      >
                        {proposal.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {proposal.client_name}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={proposal.status} />
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900 tabular-nums">
                      {formatCurrency(total, proposal.currency)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        {proposal.view_count}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(proposal.updated_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {isLive && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(proposal)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            title="Copy public client link"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy link
                              </>
                            )}
                          </button>
                        )}
                        <Link
                          href={`/proposals/${proposal.id}/edit`}
                          prefetch={false}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
