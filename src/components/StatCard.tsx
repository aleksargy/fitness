// src/components/StatCard.tsx

type StatCardProps = {
  label: string;
  value: number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 shadow-sm shadow-slate-950/40">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {hint && (
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
          {hint}
        </p>
      )}
    </div>
  );
}
