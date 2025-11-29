// src/components/StatSubCard.tsx

type StatSubCardProps = {
  label: string;
  value: number;
  hint?: string;
};

export function StatSubCard({ label, value, hint }: StatSubCardProps) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-base font-semibold">{value}</p>
      {hint && (
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
          {hint}
        </p>
      )}
    </div>
  );
}
