"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type {
  Deliverable,
  LineItem,
  Proposal,
  TimelinePhase,
} from "@/lib/types";
import { computeProposalTotal } from "@/lib/validation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ProposalEditorProps {
  initialProposal: Proposal;
  appUrl: string;
}

export function ProposalEditor({
  initialProposal,
  appUrl,
}: ProposalEditorProps) {
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal>(initialProposal);
  const [title, setTitle] = useState(initialProposal.title);
  const [clientName, setClientName] = useState(initialProposal.client_name);
  const [currency, setCurrency] = useState(initialProposal.currency || "USD");
  const [validUntil, setValidUntil] = useState(
    initialProposal.valid_until || ""
  );
  const [executiveSummary, setExecutiveSummary] = useState(
    initialProposal.executive_summary || ""
  );
  const [scope, setScope] = useState(initialProposal.scope || "");
  const [deliverables, setDeliverables] = useState<Deliverable[]>(
    initialProposal.deliverables || []
  );
  const [timeline, setTimeline] = useState<TimelinePhase[]>(
    initialProposal.timeline || []
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialProposal.line_items || []
  );
  const [terms, setTerms] = useState(initialProposal.terms || "");

  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isAccepted = proposal.status === "accepted";
  const isLive = proposal.status !== "draft";
  const liveTotal = computeProposalTotal(lineItems);
  const publicUrl = `${appUrl}/p/${proposal.slug}`;

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function buildPayload(nextStatus?: "draft" | "published") {
    return {
      title,
      client_name: clientName,
      currency: currency.toUpperCase() || "USD",
      valid_until: validUntil.trim() ? validUntil.trim() : null,
      executive_summary: executiveSummary,
      scope,
      deliverables,
      timeline,
      line_items: lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      })),
      terms,
      ...(nextStatus ? { status: nextStatus } : {}),
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isAccepted) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save proposal.");
        return;
      }

      setProposal(data.proposal);
      showToast("Proposal saved");
      router.refresh();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (isAccepted) return;
    setTogglingStatus(true);
    setError(null);

    const nextStatus = proposal.status === "published" ? "draft" : "published";

    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(nextStatus)),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status.");
        return;
      }

      setProposal(data.proposal);
      showToast(
        nextStatus === "published"
          ? "Proposal published! Client link is live."
          : "Proposal unpublished (saved as Draft)."
      );
      router.refresh();
    } catch {
      setError("Network error while updating status.");
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <StatusBadge status={proposal.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isLive && (
            <>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied link
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy client link
                  </>
                )}
              </button>
              <Link
                href={`/p/${proposal.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                Preview
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </>
          )}

          {!isAccepted && (
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={togglingStatus}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-2xs transition-colors disabled:opacity-60 ${
                proposal.status === "published"
                  ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Globe className="h-4 w-4" />
              {togglingStatus
                ? "Updating..."
                : proposal.status === "published"
                  ? "Unpublish"
                  : proposal.status === "changes_requested"
                    ? "Republish"
                    : "Publish"}
            </button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {proposal.status === "changes_requested" &&
        proposal.change_request_note && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h2 className="text-sm font-semibold">
                  Client requested changes
                </h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">
                  {proposal.change_request_note}
                </p>
              </div>
            </div>
          </div>
        )}

      {isAccepted && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                Proposal accepted &amp; locked
                <Lock className="h-3.5 w-3.5 text-emerald-700" />
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Signed by <strong>{proposal.signed_name}</strong> on{" "}
                {formatDate(proposal.signed_at)} (IP:{" "}
                {proposal.signed_ip || "recorded"}). Accepted proposals are
                immutable.
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <fieldset disabled={isAccepted} className="space-y-6 disabled:opacity-80">
          {/* Basic Details */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h2 className="text-base font-semibold text-slate-900">
              Overview
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700"
                >
                  Proposal title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="client_name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Client name
                </label>
                <input
                  id="client_name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Currency
                  </label>
                  <input
                    id="currency"
                    type="text"
                    maxLength={3}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="valid_until"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Valid until
                  </label>
                  <input
                    id="valid_until"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="executive_summary"
                  className="block text-sm font-medium text-slate-700"
                >
                  Executive summary
                </label>
                <textarea
                  id="executive_summary"
                  rows={3}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="scope"
                  className="block text-sm font-medium text-slate-700"
                >
                  Scope of work (Markdown supported)
                </label>
                <textarea
                  id="scope"
                  rows={6}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </section>

          {/* Deliverables */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Deliverables
              </h2>
              {!isAccepted && (
                <button
                  type="button"
                  onClick={() =>
                    setDeliverables([
                      ...deliverables,
                      { title: "", description: "" },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add deliverable
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {deliverables.length === 0 && (
                <p className="text-sm text-slate-500">No deliverables added.</p>
              )}
              {deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-[1fr_2fr_auto]"
                >
                  <input
                    type="text"
                    placeholder="Deliverable title"
                    aria-label={`Deliverable ${idx + 1} title`}
                    value={item.title}
                    onChange={(e) => {
                      const next = [...deliverables];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setDeliverables(next);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    aria-label={`Deliverable ${idx + 1} description`}
                    value={item.description}
                    onChange={(e) => {
                      const next = [...deliverables];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setDeliverables(next);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                  {!isAccepted && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeliverables(deliverables.filter((_, i) => i !== idx))
                      }
                      aria-label={`Remove deliverable ${idx + 1}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Timeline
              </h2>
              {!isAccepted && (
                <button
                  type="button"
                  onClick={() =>
                    setTimeline([
                      ...timeline,
                      { phase: "", duration: "", description: "" },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add phase
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {timeline.length === 0 && (
                <p className="text-sm text-slate-500">No timeline phases added.</p>
              )}
              {timeline.map((item, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-[1fr_140px_2fr_auto]"
                >
                  <input
                    type="text"
                    placeholder="Phase name"
                    aria-label={`Phase ${idx + 1} name`}
                    value={item.phase}
                    onChange={(e) => {
                      const next = [...timeline];
                      next[idx] = { ...next[idx], phase: e.target.value };
                      setTimeline(next);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="e.g. Week 1"
                    aria-label={`Phase ${idx + 1} duration`}
                    value={item.duration}
                    onChange={(e) => {
                      const next = [...timeline];
                      next[idx] = { ...next[idx], duration: e.target.value };
                      setTimeline(next);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Phase description"
                    aria-label={`Phase ${idx + 1} description`}
                    value={item.description}
                    onChange={(e) => {
                      const next = [...timeline];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setTimeline(next);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  />
                  {!isAccepted && (
                    <button
                      type="button"
                      onClick={() =>
                        setTimeline(timeline.filter((_, i) => i !== idx))
                      }
                      aria-label={`Remove phase ${idx + 1}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Line Items */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Pricing &amp; Line Items
              </h2>
              {!isAccepted && (
                <button
                  type="button"
                  onClick={() =>
                    setLineItems([
                      ...lineItems,
                      { description: "", quantity: 1, unit_price: 0 },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add line item
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {lineItems.length === 0 && (
                <p className="text-sm text-slate-500">No line items added.</p>
              )}
              {lineItems.map((item, idx) => {
                const rowTotal =
                  (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                return (
                  <div
                    key={idx}
                    className="grid items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-[1fr_100px_140px_120px_auto]"
                  >
                    <input
                      type="text"
                      placeholder="Item description"
                      aria-label={`Line item ${idx + 1} description`}
                      value={item.description}
                      onChange={(e) => {
                        const next = [...lineItems];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setLineItems(next);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="Qty"
                      aria-label={`Line item ${idx + 1} quantity`}
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...lineItems];
                        next[idx] = {
                          ...next[idx],
                          quantity: Number(e.target.value),
                        };
                        setLineItems(next);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm tabular-nums"
                    />
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="Unit price"
                      aria-label={`Line item ${idx + 1} unit price`}
                      value={item.unit_price}
                      onChange={(e) => {
                        const next = [...lineItems];
                        next[idx] = {
                          ...next[idx],
                          unit_price: Number(e.target.value),
                        };
                        setLineItems(next);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm tabular-nums"
                    />
                    <div className="text-right text-sm font-medium text-slate-900 tabular-nums">
                      {formatCurrency(rowTotal, currency)}
                    </div>
                    {!isAccepted && (
                      <button
                        type="button"
                        onClick={() =>
                          setLineItems(lineItems.filter((_, i) => i !== idx))
                        }
                        aria-label={`Remove line item ${idx + 1}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-end border-t border-slate-200 pt-4">
              <div className="text-right">
                <span className="text-sm text-slate-500">Total</span>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(liveTotal, currency)}
                </p>
              </div>
            </div>
          </section>

          {/* Terms */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <label
              htmlFor="terms"
              className="block text-base font-semibold text-slate-900"
            >
              Terms &amp; Payment Schedule
            </label>
            <textarea
              id="terms"
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </section>
        </fieldset>

        {!isAccepted && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
