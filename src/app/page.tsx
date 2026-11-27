import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, FileText, Plug, Sparkles } from "lucide-react";
import { getAuthenticatedAgency } from "@/lib/auth";

export default async function HomePage() {
  const agency = await getAuthenticatedAgency();
  if (agency) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FileText className="h-4 w-4" />
            </span>
            ProposalPilot
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-2xs hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
            <Plug className="h-3.5 w-3.5" />
            Powered by your own Claude via MCP — zero AI markup
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Turn messy call notes in Claude into signed client proposals.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Connect ProposalPilot to Claude in 30 seconds. Paste discovery call notes into
            Claude, edit pricing and scope in your dashboard, and send a live link where
            clients review and sign off.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Create free agency account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              1. Draft with your Claude
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Paste raw call notes or emails into Claude. Claude structures scope,
              timeline, deliverables, and line items straight into your workspace.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              2. Review &amp; refine
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Tweak pricing, adjust deliverables, or update terms in a clean editor.
              Nothing goes live until you click Publish.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              3. Client accepts &amp; signs
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Share a live proposal link—no client login required. Clients can accept
              and sign or request changes in one click.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
