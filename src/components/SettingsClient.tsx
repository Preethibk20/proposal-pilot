"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Plug,
  RefreshCw,
} from "lucide-react";

interface SettingsClientProps {
  agencyName: string;
  agencyEmail: string;
  initialToken: string;
  appUrl: string;
}

const SAMPLE_PROMPT =
  'Turn these call notes into a proposal for Acme Corp: logo + brand kit for $3,500, 3 weeks. Notes: They need a primary logo, color palette, typography system, and brand guidelines PDF. 50% upfront, 50% on final delivery.';

export function SettingsClient({
  agencyName,
  agencyEmail,
  initialToken,
  appUrl,
}: SettingsClientProps) {
  const [token, setToken] = useState(initialToken);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mcpUrl = `${appUrl}/api/mcp/${token}`;

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(mcpUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(SAMPLE_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  async function handleRegenerate() {
    const confirmed = window.confirm(
      "Regenerate your MCP token? Your previous MCP URL will immediately stop working in Claude until you update it."
    );
    if (!confirmed) return;

    setRegenerating(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings/regenerate-token", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to regenerate token.");
        return;
      }
      setToken(data.mcp_token);
      setStatusMessage("New MCP token generated. Update your Claude connector URL.");
    } catch {
      setError("Network error while regenerating token.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          MCP Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Connect your own Claude account to {agencyName} ({agencyEmail}).
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <Check className="h-4 w-4 shrink-0" />
          {statusMessage}
        </div>
      )}

      {/* MCP URL Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Your Private MCP Server URL
              </h2>
              <p className="text-xs text-slate-500">
                Treat this URL like a password—anyone with it can draft proposals in your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            readOnly
            aria-label="MCP Server URL"
            value={mcpUrl}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-2xs hover:bg-indigo-700"
          >
            {copiedUrl ? (
              <>
                <Check className="h-4 w-4" />
                Copied URL
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy MCP URL
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
            />
            {regenerating ? "Regenerating..." : "Regenerate token"}
          </button>
        </div>
      </section>

      {/* Connect to Claude Instructions */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Plug className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            How to connect to Claude
          </h2>
        </div>

        <ol className="mt-4 list-inside list-decimal space-y-2.5 text-sm text-slate-700">
          <li>
            Open <strong>Claude</strong> (web or desktop) and go to{" "}
            <strong>Settings → Connectors</strong>.
          </li>
          <li>
            Click <strong>Add custom connector</strong>.
          </li>
          <li>
            Name it <strong>ProposalPilot</strong> and paste your MCP URL from above.
          </li>
          <li>
            Save and start a new chat with the connector enabled.
          </li>
        </ol>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Try this sample prompt in Claude
            </span>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy prompt
                </>
              )}
            </button>
          </div>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-800">
            {SAMPLE_PROMPT}
          </p>
        </div>
      </section>
    </div>
  );
}
