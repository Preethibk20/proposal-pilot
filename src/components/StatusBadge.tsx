import type { ProposalStatus } from "@/lib/types";

const STATUS_STYLES: Record<
  ProposalStatus,
  { label: string; classes: string }
> = {
  draft: {
    label: "Draft",
    classes: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  published: {
    label: "Published",
    classes: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  accepted: {
    label: "Accepted",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  changes_requested: {
    label: "Changes requested",
    classes: "bg-amber-50 text-amber-800 ring-amber-200",
  },
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
