export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-ms-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-ms-muted">
        {label}
      </div>
      <div className="text-2xl font-bold text-ms-text sm:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-ms-muted">{hint}</div>}
    </div>
  );
}
