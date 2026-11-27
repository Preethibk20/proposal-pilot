export default function PublicProposalLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-2/3 rounded bg-slate-200" />
          <div className="mt-8 space-y-4">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
            <div className="h-4 w-4/6 rounded bg-slate-100" />
          </div>
          <div className="mt-8 h-48 rounded-xl bg-slate-100" />
        </div>
      </main>
    </div>
  );
}
