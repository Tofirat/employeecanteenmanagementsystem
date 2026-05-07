const palette = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  preparing: "bg-violet-100 text-violet-700",
  ready: "bg-emerald-100 text-emerald-700",
  served: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-rose-100 text-rose-700",
  paid: "bg-emerald-100 text-emerald-700",
  refunded: "bg-sky-100 text-sky-700",
  processing: "bg-violet-100 text-violet-700",
  failed: "bg-rose-100 text-rose-700",
  unpaid: "bg-amber-100 text-amber-700",
  overdue: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${palette[status] || "bg-stone-500/20 text-stone-200"}`}>
      {status}
    </span>
  );
}
