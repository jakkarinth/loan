import { cx } from "@/lib/format";

const statusTone: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_department_review: "bg-amber-100 text-amber-800",
  pending_university_finance_review: "bg-amber-100 text-amber-800",
  pending_department_approval: "bg-amber-100 text-amber-800",
  budget_reviewed: "bg-cyan-100 text-cyan-800",
  finance_reviewed: "bg-cyan-100 text-cyan-800",
  approved: "bg-emerald-100 text-emerald-800",
  paid: "bg-blue-100 text-blue-800",
  partially_repaid: "bg-orange-100 text-orange-800",
  fully_repaid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  extension_requested: "bg-violet-100 text-violet-800",
  extension_approved: "bg-emerald-100 text-emerald-800",
  extension_rejected: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-600"
};

export function StatusBadge({
  code,
  label
}: {
  code: string;
  label: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-medium",
        statusTone[code] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {label}
    </span>
  );
}
