export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-36 rounded-lg bg-slate-200" />
            <div className="h-9 w-32 rounded-lg bg-slate-200" />
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-4">
              <div className="h-5 w-full rounded bg-slate-100" />
              <div className="h-12 w-full rounded bg-slate-100" />
              <div className="h-12 w-full rounded bg-slate-100" />
              <div className="h-12 w-full rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
