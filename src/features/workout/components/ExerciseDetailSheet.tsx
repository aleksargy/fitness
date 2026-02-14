import React, { useEffect, useMemo, useState } from "react";
import type { Session } from "../../../app/types";
import { Card } from "../../../shared/ui/Card";

function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type View = "dual" | "kg" | "reps" | "score";

type HistoryRow = {
  date: string;
  sessionId: string;
  bestKg: number;    // best +kg in that session for this exercise
  bestReps: number;  // best reps in that session for this exercise
  score: number;     // bestKg * bestReps (simple overload proxy)
  bestLabel: string; // human readable summary
};

type Point = { xLabel: string; value: number };

export function ExerciseDetailSheet({
  open,
  movementId,
  title,
  sessions,
  onClose,
}: {
  open: boolean;
  movementId: string | null;
  title: string | null;
  sessions: Session[];
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<View>("dual");

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  const history = useMemo<HistoryRow[]>(() => {
    if (!movementId) return [];

    const rows: HistoryRow[] = [];

    for (const s of sessions) {
      let bestKg = 0;
      let bestReps = 0;

      for (const ex of (s.exercises ?? []) as any[]) {
        const id = ex.movementId || ex.name;
        if (id !== movementId) continue;

        for (const set of (ex.sets ?? []) as any[]) {
          const kg = Number(set.addKg ?? 0) || 0;
          const reps = Number(set.reps ?? 0) || 0;
          if (kg > bestKg) bestKg = kg;
          if (reps > bestReps) bestReps = reps;
        }
      }

      if (bestKg > 0 || bestReps > 0) {
        const bestLabel =
          bestKg > 0
            ? `${bestReps || "—"} reps @ +${bestKg}kg`
            : `${bestReps} reps (BW)`;

        rows.push({
          date: s.date,
          sessionId: s.id,
          bestKg,
          bestReps,
          score: bestKg * bestReps,
          bestLabel,
        });
      }
    }

    rows.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
    return rows;
  }, [movementId, sessions]);

  // default view: dual (but if never weighted, dual still ok)
  useEffect(() => {
    if (!open || !movementId) return;
    setView("dual");
  }, [open, movementId]);

  const seriesDual = useMemo(() => {
    // chart: last 14 sessions, oldest -> newest
    const slice = history.slice(0, 14).slice().reverse();
    const kg: Point[] = slice.map((h) => ({ xLabel: h.date, value: h.bestKg }));
    const reps: Point[] = slice.map((h) => ({ xLabel: h.date, value: h.bestReps }));
    const score: Point[] = slice.map((h) => ({ xLabel: h.date, value: h.score }));
    return { kg, reps, score };
  }, [history]);

  const summary = useMemo(() => {
    if (!history.length)
      return {
        sessions: 0,
        lastLabel: "-",
        bestKg: 0,
        bestReps: 0,
        bestScore: 0,
        lastScore: 0,
      };

    const bestKg = Math.max(...history.map((h) => h.bestKg));
    const bestReps = Math.max(...history.map((h) => h.bestReps));
    const bestScore = Math.max(...history.map((h) => h.score));
    const lastLabel = history[0].bestLabel;
    const lastScore = history[0].score;

    return { sessions: history.length, lastLabel, bestKg, bestReps, bestScore, lastScore };
  }, [history]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div
            className={cn(
              "will-change-transform transition-transform duration-200 ease-out",
              visible ? "translate-y-0" : "translate-y-[40px]"
            )}
          >
            <Card className="h-[82vh] overflow-hidden">
              <div className="px-4 pt-3 pb-3">
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      {title ?? "Exercise"}
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      {summary.sessions} session{summary.sessions === 1 ? "" : "s"} • last:{" "}
                      <span className="text-white/75">{summary.lastLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Pill active={view === "dual"} onClick={() => setView("dual")}>Dual</Pill>
                    <Pill active={view === "kg"} onClick={() => setView("kg")}>+kg</Pill>
                    <Pill active={view === "reps"} onClick={() => setView("reps")}>Reps</Pill>
                    <Pill active={view === "score"} onClick={() => setView("score")}>Score</Pill>
                  </div>
                </div>

                <div className="mt-3">
                  {view === "dual" ? (
                    <DualSparkline
                      kg={seriesDual.kg}
                      reps={seriesDual.reps}
                      emptyLabel="Not enough data yet"
                    />
                  ) : view === "kg" ? (
                    <SingleSparkline
                      points={seriesDual.kg}
                      emptyLabel="Not enough data yet"
                      label="+kg"
                      valueFmt={(v) => (v > 0 ? `+${v}kg` : "BW")}
                    />
                  ) : view === "reps" ? (
                    <SingleSparkline
                      points={seriesDual.reps}
                      emptyLabel="Not enough data yet"
                      label="reps"
                      valueFmt={(v) => String(v)}
                    />
                  ) : (
                    <SingleSparkline
                      points={seriesDual.score}
                      emptyLabel="Not enough data yet"
                      label="score (kg×reps)"
                      valueFmt={(v) => String(v)}
                    />
                  )}
                </div>

                {/* metrics */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Card className="p-3">
                    <div className="text-xs text-white/55">Best +kg</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {summary.bestKg > 0 ? `+${summary.bestKg}kg` : "BW"}
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="text-xs text-white/55">Best reps</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {summary.bestReps || "—"}
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="text-xs text-white/55">Best score</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {summary.bestScore || "—"}
                    </div>
                  </Card>

                  <Card className="p-3">
                    <div className="text-xs text-white/55">Last score</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {summary.lastScore || "—"}
                    </div>
                  </Card>
                </div>
              </div>

              {/* history list */}
              <div className="h-[calc(82vh-260px)] overflow-y-auto px-2 pb-3">
                <div className="px-2 pb-2 text-xs text-white/45">Recent sessions</div>

                {history.length === 0 ? (
                  <div className="px-3 py-10 text-center text-white/55">
                    No history yet for this exercise.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 30).map((h) => (
                      <div
                        key={h.sessionId}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold tabular-nums">{h.date}</div>
                          <div className="text-sm text-white/70 tabular-nums">
                            {h.bestKg > 0 ? `+${h.bestKg}kg` : "BW"} • {h.bestReps || "—"} reps • {h.score || 0}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-white/55">{h.bestLabel}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.99]",
        active
          ? "border-white/25 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function DualSparkline({
  kg,
  reps,
  emptyLabel,
}: {
  kg: Point[];
  reps: Point[];
  emptyLabel: string;
}) {
  if (kg.length < 2 || reps.length < 2) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
        {emptyLabel}
      </div>
    );
  }

  const w = 320;
  const h = 96;
  const pad = 10;

  // normalize each series to 0..1 so both lines can share the same chart
  const norm = (vals: number[]) => {
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const span = Math.max(1e-6, maxV - minV);
    return vals.map((v) => (v - minV) / span);
  };

  const xs = kg.map((_, i) => pad + (i * (w - pad * 2)) / (kg.length - 1));
  const nKg = norm(kg.map((p) => p.value));
  const nReps = norm(reps.map((p) => p.value));

  const ysFromNorm = (nv: number[]) => nv.map((t) => pad + (1 - t) * (h - pad * 2));

  const ysKg = ysFromNorm(nKg);
  const ysReps = ysFromNorm(nReps);

  const pathFrom = (ys: number[]) =>
    xs
      .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`)
      .join(" ");

  const dKg = pathFrom(ysKg);
  const dReps = pathFrom(ysReps);

  const lastKg = kg[kg.length - 1].value;
  const lastReps = reps[reps.length - 1].value;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-xs text-white/55">Last 14 sessions (normalized)</div>
        <div className="text-xs text-white/70 tabular-nums">
          last: {lastKg > 0 ? `+${lastKg}kg` : "BW"} • {lastReps} reps
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" preserveAspectRatio="none">
        <path d={`M ${pad} ${h - pad} L ${w - pad} ${h - pad}`} className="stroke-white/10" strokeWidth="1" fill="none" />
        <path d={`M ${pad} ${pad} L ${w - pad} ${pad}`} className="stroke-white/10" strokeWidth="1" fill="none" />

        {/* kg line */}
        <path
          d={dKg}
          className="stroke-emerald-200/80"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={xs[xs.length - 1]} cy={ysKg[ysKg.length - 1]} r="3.5" className="fill-emerald-200" />

        {/* reps line */}
        <path
          d={dReps}
          className="stroke-sky-200/80"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={xs[xs.length - 1]} cy={ysReps[ysReps.length - 1]} r="3.5" className="fill-sky-200" />
      </svg>

      <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
        <span className="tabular-nums">{kg[0].xLabel}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-200/80" />
            +kg
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-200/80" />
            reps
          </span>
        </span>
        <span className="tabular-nums">{kg[kg.length - 1].xLabel}</span>
      </div>
    </div>
  );
}

function SingleSparkline({
  points,
  emptyLabel,
  label,
  valueFmt,
}: {
  points: Point[];
  emptyLabel: string;
  label: string;
  valueFmt: (v: number) => string;
}) {
  if (points.length < 2) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
        {emptyLabel}
      </div>
    );
  }

  const w = 320;
  const h = 96;
  const pad = 10;

  const values = points.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = Math.max(1e-6, maxV - minV);

  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / (points.length - 1));
  const ys = points.map((p) => pad + (1 - (p.value - minV) / span) * (h - pad * 2));

  const d = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-xs text-white/55">{label} • last 14 sessions</div>
        <div className="text-xs text-white/70 tabular-nums">last: {valueFmt(last.value)}</div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" preserveAspectRatio="none">
        <path d={`M ${pad} ${h - pad} L ${w - pad} ${h - pad}`} className="stroke-white/10" strokeWidth="1" fill="none" />
        <path d={`M ${pad} ${pad} L ${w - pad} ${pad}`} className="stroke-white/10" strokeWidth="1" fill="none" />
        <path
          d={d}
          className="stroke-emerald-200/80"
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" className="fill-emerald-200" />
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-white/45 tabular-nums">
        <span>{points[0].xLabel}</span>
        <span>
          {minV.toFixed(0)} → {maxV.toFixed(0)}
        </span>
        <span>{points[points.length - 1].xLabel}</span>
      </div>
    </div>
  );
}
