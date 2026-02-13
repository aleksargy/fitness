import React from "react";
import type { ExerciseEntry } from "../../../app/types";
import { Card } from "../../../shared/ui/Card";

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
    lastTime: null | {
        date: string;
        summary: string;
    };
}) {

    return (
        <Card className="p-4">
            <div className="flex items-start gap-3">
                {dragHandle}

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-semibold text-white">
                                    {entry.name}
                                </h3>
                            </div>

                            {lastTime && (
                                <div className="mt-1 text-xs text-white/55">
                                    <span className="text-white/70">Last time ({lastTime.date}):</span>{" "}
                                    {lastTime.summary}
                                </div>
                            )}

                            <div className="mt-2 grid grid-cols-1 gap-2">
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white placeholder:text-white/30 outline-none focus:border-white/25"
                                    placeholder="Variation (e.g., rings, wide grip)"
                                    value={entry.variation}
                                    onChange={(e) => onUpdate({ variation: e.target.value })}
                                />
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white placeholder:text-white/30 outline-none focus:border-white/25"
                                    placeholder="Notes (optional)"
                                    value={entry.notes}
                                    onChange={(e) => onUpdate({ notes: e.target.value })}
                                />
                            </div>

                            {/* sets */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-white/80">Sets</p>
                                    <button
                                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.99] transition"
                                        onClick={() =>
                                            onUpdate({
                                                sets: [...entry.sets, { id: uid(), reps: "", addKg: "", done: false }],
                                            })
                                        }
                                    >
                                        + Add set
                                    </button>
                                </div>

                                <div className="mt-2 space-y-2">
                                    {entry.sets.map((s, idx) => (
                                        <div
                                            key={s.id}
                                            className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                                        >
                                            <span className="w-10 text-sm text-white/60">#{idx + 1}</span>

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-white/60">Reps</span>
                                                <input
                                                    inputMode="numeric"
                                                    className="w-16 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-white outline-none focus:border-white/25"
                                                    placeholder="0"
                                                    value={s.reps}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        onUpdate({
                                                            sets: entry.sets.map((x) =>
                                                                x.id === s.id
                                                                    ? { ...x, reps: v === "" ? "" : Number(v) }
                                                                    : x
                                                            ),
                                                        });
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-white/60">+kg</span>
                                                <input
                                                    inputMode="decimal"
                                                    className="w-16 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-white outline-none focus:border-white/25"
                                                    placeholder="0"
                                                    value={s.addKg}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        onUpdate({
                                                            sets: entry.sets.map((x) =>
                                                                x.id === s.id
                                                                    ? { ...x, addKg: v === "" ? "" : Number(v) }
                                                                    : x
                                                            ),
                                                        });
                                                    }}
                                                />
                                            </div>

                                            <button
                                                className={`ml-auto rounded-2xl px-3 py-2 text-sm border transition active:scale-[0.99] ${s.done
                                                    ? "bg-white/15 border-white/25 text-white"
                                                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`}
                                                onClick={() =>
                                                    onUpdate({
                                                        sets: entry.sets.map((x) =>
                                                            x.id === s.id ? { ...x, done: !x.done } : x
                                                        ),
                                                    })
                                                }
                                            >
                                                {s.done ? "Done" : "Mark"}
                                            </button>

                                            <button
                                                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white active:scale-[0.99] transition"
                                                onClick={() =>
                                                    onUpdate({ sets: entry.sets.filter((x) => x.id !== s.id) })
                                                }
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white active:scale-[0.99] transition"
                            onClick={onRemove}
                            title="Remove exercise"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
}

const uid = () => Math.random().toString(36).slice(2, 10);
