export default function EditProposalLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-28 rounded-lg bg-slate-200" />
            <div className="flex gap-2">
              <div className="h-9 w-28 rounded-lg bg-slate-200" />
              <div className="h-9 w-24 rounded-lg bg-slate-200" />
            </div>
          </div>
          <div className="h-64 rounded-xl border border-slate-200 bg-white p-6" />
          <div className="h-44 rounded-xl border border-slate-200 bg-white p-6" />
          <div className="h-44 rounded-xl border border-slate-200 bg-white p-6" />
        </div>
      </main>
    </div>
  );
}
