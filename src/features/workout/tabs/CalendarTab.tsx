import { useEffect, useMemo, useState } from "react";
import type { Session } from "../../../app/types";
import { Card } from "../../../shared/ui/Card";
import { listSessionsNewestFirst } from "../../../app/dbHelpers";
import { formatTime } from "../../../shared/utils/time";

export function CalendarTab({ onStartNew }: { onStartNew: () => void }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [openSessionId, setOpenSessionId] = useState<string | null>(null);

    async function refresh() {
        setSessions(await listSessionsNewestFirst());
    }

    useEffect(() => {
        refresh();
    }, []);

    const grouped = useMemo(() => {
        const m: Record<string, Session[]> = {};
        for (const s of sessions) {
            (m[s.date] ??= []).push(s);
        }
        return m;
    }, [sessions]);

    const dates = useMemo(() => Object.keys(grouped).sort().reverse(), [grouped]);

    return (
        <>
            <header className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
                    <p className="text-white/55 text-sm">Your completed workouts by date</p>
                </div>

                <button
                    className="rounded-2xl px-4 py-3 text-sm font-semibold bg-[#F3F4F6] text-black hover:bg-white active:scale-[0.98] transition"
                    onClick={onStartNew}
                >
                    Train
                </button>
            </header>

            {sessions.length === 0 ? (
                <Card className="p-6">
                    <p className="text-white/70">
                        No completed workouts yet. Finish a workout to see it here.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {dates.map((date) => (
                        <div key={date} className="space-y-2">
                            <div className="text-sm font-semibold text-white/80">{date}</div>
                            <div className="space-y-2">
                                {grouped[date].map((s) => {
                                    const open = openSessionId === s.id;
                                    return (
                                        <Card key={s.id} className="p-4">
                                            <button
                                                className="w-full text-left"
                                                onClick={() => setOpenSessionId(open ? null : s.id)}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-base font-semibold truncate">{s.title}</div>
                                                        <div className="text-xs text-white/55">
                                                            {formatTime(s.elapsedMs)} • {s.exercises.length} exercises
                                                        </div>
                                                    </div>
                                                    <div className="text-white/50">{open ? "–" : "+"}</div>
                                                </div>
                                            </button>

                                            {open && (
                                                <div className="mt-3 space-y-3">
                                                    {s.exercises.map((ex) => (
                                                        <div key={ex.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="font-semibold">{ex.name}</div>
                                                            </div>

                                                            {(ex.variation || ex.notes) && (
                                                                <div className="mt-1 text-xs text-white/55">
                                                                    {ex.variation ? <span>Var: {ex.variation}</span> : null}
                                                                    {ex.variation && ex.notes ? <span> • </span> : null}
                                                                    {ex.notes ? <span>Notes: {ex.notes}</span> : null}
                                                                </div>
                                                            )}

                                                            <div className="mt-2 text-sm text-white/80">
                                                                {ex.sets.map((set, i) => (
                                                                    <span key={set.id} className="inline-flex items-center gap-1 mr-3">
                                                                        <span className="text-white/50">#{i + 1}</span>
                                                                        <span>
                                                                            {set.reps === "" ? "-" : set.reps}
                                                                            {set.addKg !== "" && set.addKg !== 0 ? ` @ +${set.addKg}kg` : ""}
                                                                        </span>

                                                                        {set.done ? <span className="text-white/60">✓</span> : null}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
