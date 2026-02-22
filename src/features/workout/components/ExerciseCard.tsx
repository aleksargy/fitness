import React from "react";
import type { ExerciseEntry } from "../../../app/types";
import { Card } from "../../../shared/ui/Card";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export function ExerciseCard({
  entry,
  dragHandle,
  onUpdate,
  onRemove,
  lastTime,
}: {
  entry: ExerciseEntry;
  dragHandle: React.ReactNode;
  onUpdate: (patch: Partial<ExerciseEntry>) => void;
  onRemove: () => void;
  lastTime: null | { date: string; summary: string };
}) {
  return (
    <Card className="p-4">
      {/* Header row: grip + title + remove */}
      <div className="flex items-start gap-3">
        {dragHandle}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-white">
                {entry.name}
              </h3>

              {lastTime && (
                <div className="mt-1 text-xs text-white/55">
                  <span className="text-white/70">Last time ({lastTime.date}):</span>{" "}
                  {lastTime.summary}
                </div>
              )}
            </div>

            <button
              className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white active:scale-[0.99] transition"
              onClick={onRemove}
              title="Remove exercise"
              aria-label="Remove exercise"
            >
              ✕
            </button>
          </div>

          {/* Notes */}
          <div className="mt-3">
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white placeholder:text-white/30 outline-none focus:border-white/25"
              placeholder="Notes (optional)"
              value={entry.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
            />
          </div>

          {/* Sets */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white/80">Sets</p>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.99] transition"
                onClick={() =>
                  onUpdate({
                    sets: [
                      ...entry.sets,
                      { id: uid(), reps: "", addKg: "", done: false },
                    ],
                  })
                }
              >
                + Add
              </button>
            </div>

            {entry.sets.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/55">
                No sets yet — add one to start logging.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {entry.sets.map((s, idx) => (
                  <SetRow
                    key={s.id}
                    idx={idx}
                    reps={s.reps}
                    addKg={s.addKg}
                    done={s.done}
                    onReps={(v) =>
                      onUpdate({
                        sets: entry.sets.map((x) =>
                          x.id === s.id ? { ...x, reps: v } : x
                        ),
                      })
                    }
                    onKg={(v) =>
                      onUpdate({
                        sets: entry.sets.map((x) =>
                          x.id === s.id ? { ...x, addKg: v } : x
                        ),
                      })
                    }
                    onToggleDone={() =>
                      onUpdate({
                        sets: entry.sets.map((x) =>
                          x.id === s.id ? { ...x, done: !x.done } : x
                        ),
                      })
                    }
                    onRemove={() =>
                      onUpdate({ sets: entry.sets.filter((x) => x.id !== s.id) })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function SetRow({
  idx,
  reps,
  addKg,
  done,
  onReps,
  onKg,
  onToggleDone,
  onRemove,
}: {
  idx: number;
  reps: any;
  addKg: any;
  done: boolean;
  onReps: (v: any) => void;
  onKg: (v: any) => void;
  onToggleDone: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[34px_1fr_1fr_72px_38px] items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-xs text-white/60 tabular-nums">#{idx + 1}</div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-white/60">Reps</span>
        <input
          inputMode="numeric"
          className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-white outline-none focus:border-white/25"
          placeholder="0"
          value={reps}
          onChange={(e) => {
            const v = e.target.value;
            onReps(v === "" ? "" : Number(v));
          }}
        />
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-white/60">+kg</span>
        <input
          inputMode="decimal"
          className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-white outline-none focus:border-white/25"
          placeholder="0"
          value={addKg}
          onChange={(e) => {
            const v = e.target.value;
            onKg(v === "" ? "" : Number(v));
          }}
        />
      </div>

      <button
        className={cn(
          "rounded-2xl px-3 py-2 text-xs font-semibold border transition active:scale-[0.99]",
          done
            ? "bg-white/15 border-white/25 text-white"
            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
        )}
        onClick={onToggleDone}
      >
        {done ? "Done" : "Mark"}
      </button>

      <button
        className="rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-white/60 hover:bg-white/10 hover:text-white active:scale-[0.99] transition"
        onClick={onRemove}
        aria-label="Remove set"
        title="Remove set"
      >
        ✕
      </button>
    </div>
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);