export default function StatCard({ title, value, accent, helper }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 transition hover:border-slate-300">
      <p className={`text-xs font-bold uppercase tracking-wider ${accent}`}>{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
