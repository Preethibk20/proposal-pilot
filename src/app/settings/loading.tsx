export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 rounded-lg bg-slate-200" />
          <div className="h-36 rounded-xl border border-slate-200 bg-white p-6" />
          <div className="h-56 rounded-xl border border-slate-200 bg-white p-6" />
        </div>
      </main>
    </div>
  );
}
