"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquare,
  PenTool,
  Printer,
  X,
} from "lucide-react";
import type { Proposal } from "@/lib/types";
import { computeProposalTotal } from "@/lib/validation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PublicProposalViewProps {
  proposal: Proposal;
  agencyName: string;
}

export function PublicProposalView({
  proposal: initialProposal,
  agencyName,
}: PublicProposalViewProps) {
  const [proposal, setProposal] = useState<Proposal>(initialProposal);
  const [mode, setMode] = useState<"none" | "accept" | "changes">("none");
  const [signedName, setSignedName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAccepted, setJustAccepted] = useState(false);
  const [justRequestedChanges, setJustRequestedChanges] = useState(false);

  const total = computeProposalTotal(proposal.line_items || []);
  const isAccepted = proposal.status === "accepted";

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/public/proposals/${proposal.slug}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signed_name: signedName.trim(),
            agreed_to_terms: agreedToTerms,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not accept proposal.");
        setSubmitting(false);
        return;
      }

      setProposal({
        ...proposal,
        status: "accepted",
        signed_name: data.signed_name,
        signed_at: data.signed_at,
      });
      setMode("none");
      setJustAccepted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestChanges(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/public/proposals/${proposal.slug}/request-changes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: changeNote.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit change request.");
        setSubmitting(false);
        return;
      }

      setProposal({
        ...proposal,
        status: "changes_requested",
        change_request_note: data.change_request_note,
      });
      setMode("none");
      setJustRequestedChanges(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top utility bar */}
      <div className="border-b border-slate-200 bg-white no-print">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
              <FileText className="h-3.5 w-3.5" />
            </span>
            {agencyName}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Save as PDF
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Accepted Banner */}
        {isAccepted && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div className="text-sm">
                <span className="font-semibold">
                  Accepted by {proposal.signed_name}
                </span>{" "}
                on {formatDate(proposal.signed_at)}.
                {justAccepted && " Thank you! A confirmation has been recorded."}
              </div>
            </div>
          </div>
        )}

        {/* Changes Requested Banner */}
        {proposal.status === "changes_requested" && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-semibold">
                  {justRequestedChanges
                    ? "Change request sent!"
                    : "Changes requested"}
                </p>
                {proposal.change_request_note && (
                  <p className="mt-1 whitespace-pre-wrap text-amber-800">
                    {proposal.change_request_note}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Card */}
        <article className="print-container rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {/* Header */}
          <header className="border-b border-slate-200 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Proposal from {agencyName}
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {proposal.title}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Prepared for{" "}
                  <span className="font-semibold text-slate-900">
                    {proposal.client_name}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Total Investment
                </p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(total, proposal.currency)}
                </p>
                {proposal.valid_until && (
                  <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Valid until {formatDate(proposal.valid_until)}
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* Executive Summary */}
          {proposal.executive_summary && (
            <section className="mt-8 print-break-avoid">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Executive Summary
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base">
                {proposal.executive_summary}
              </p>
            </section>
          )}

          {/* Scope of Work */}
          {proposal.scope && (
            <section className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Scope of Work
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-slate-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {proposal.scope}
                </ReactMarkdown>
              </div>
            </section>
          )}

          {/* Deliverables */}
          {proposal.deliverables && proposal.deliverables.length > 0 && (
            <section className="mt-8 border-t border-slate-100 pt-8 print-break-avoid">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Deliverables
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {proposal.deliverables.map((d, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      {d.title}
                    </h3>
                    {d.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {d.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          {proposal.timeline && proposal.timeline.length > 0 && (
            <section className="mt-8 border-t border-slate-100 pt-8 print-break-avoid">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Project Timeline
              </h2>
              <div className="mt-4 space-y-3">
                {proposal.timeline.map((phase, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {phase.phase}
                      </h3>
                      {phase.description && (
                        <p className="mt-1 text-sm text-slate-600">
                          {phase.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {phase.duration}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pricing Table */}
          <section className="mt-8 border-t border-slate-100 pt-8 print-break-avoid">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Pricing Breakdown
            </h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(proposal.line_items || []).map((item, idx) => {
                    const rowAmount =
                      (Number(item.quantity) || 0) *
                      (Number(item.unit_price) || 0);
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                          {formatCurrency(item.unit_price, proposal.currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {formatCurrency(rowAmount, proposal.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900"
                    >
                      Total ({proposal.currency})
                    </td>
                    <td className="px-4 py-3.5 text-right text-base font-bold text-slate-900 tabular-nums">
                      {formatCurrency(total, proposal.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Terms */}
          {proposal.terms && (
            <section className="mt-8 border-t border-slate-100 pt-8 print-break-avoid">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Terms &amp; Conditions
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {proposal.terms}
              </p>
            </section>
          )}
        </article>
      </main>

      {/* Sticky Action Bar (hidden if accepted or printing) */}
      {!isAccepted && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm no-print">
          <div className="mx-auto max-w-4xl px-4 py-3.5 sm:px-6">
            {mode === "none" && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Total:{" "}
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatCurrency(total, proposal.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode("changes");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode("accept");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <PenTool className="h-4 w-4" />
                    Accept &amp; Sign
                  </button>
                </div>
              </div>
            )}

            {mode === "accept" && (
              <form onSubmit={handleAccept} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Accept &amp; Sign Proposal
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMode("none")}
                    aria-label="Close"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {error && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    required
                    aria-label="Your full name"
                    placeholder="Type your full name to sign"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    I agree to the terms
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm &amp; Sign
                  </button>
                </div>
              </form>
            )}

            {mode === "changes" && (
              <form onSubmit={handleRequestChanges} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Request Changes
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMode("none")}
                    aria-label="Close"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {error && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <textarea
                    rows={2}
                    required
                    aria-label="Requested changes note"
                    placeholder="Describe what you'd like adjusted (e.g., timeline, scope, or pricing)..."
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send Note
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
