import { useEffect, useMemo, useState } from "react";
import type { Session } from "../../../app/types";
import { Card } from "../../../shared/ui/Card";
import { listSessionsNewestFirst } from "../../../app/dbHelpers";
import { formatTime } from "../../../shared/utils/time";
import { ExerciseDetailSheet } from "../components/ExerciseDetailSheet";

function cn(...xs: Array<string | false | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function ymd(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function dateFromYmd(s: string) {
    const [y, m, d] = s.split("-").map((x) => Number(x));
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function startOfWeekMon(d: Date) {
    const out = new Date(d);
    const js = out.getDay(); // Sun=0
    const mon0 = (js + 6) % 7; // Mon=0
    out.setDate(out.getDate() - mon0);
    out.setHours(0, 0, 0, 0);
    return out;
}
function addDays(d: Date, n: number) {
    const out = new Date(d);
    out.setDate(out.getDate() + n);
    return out;
}

type BestSet = {
    movementId: string;
    name: string;
    bestAddKg: number;
    bestReps: number;
    lastDate: string;
};

export function StatsTab() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [detailTitle, setDetailTitle] = useState<string | null>(null);

    function openExercise(id: string, name: string) {
        setDetailId(id);
        setDetailTitle(name);
        setDetailOpen(true);
    }


    useEffect(() => {
        listSessionsNewestFirst().then(setSessions);
    }, []);

    const byDate = useMemo(() => {
        const map: Record<string, Session[]> = {};
        for (const s of sessions) (map[s.date] ??= []).push(s);
        return map;
    }, [sessions]);

    const now = new Date();
    const todayKey = ymd(now);

    const thisWeek = useMemo(() => {
        const ws = startOfWeekMon(now);
        const keys = Array.from({ length: 7 }).map((_, i) => ymd(addDays(ws, i)));
        const weekSessions = keys.flatMap((k) => byDate[k] ?? []);
        const workouts = weekSessions.length;
        const totalMs = weekSessions.reduce((acc, s) => acc + (s.elapsedMs ?? 0), 0);
        const minutes = Math.round(totalMs / 60000);
        const exercises = weekSessions.reduce((acc, s) => acc + (s.exercises?.length ?? 0), 0);
        return { workouts, minutes, exercises, keys };
    }, [byDate, now]);

    const last30 = useMemo(() => {
        const keys = Array.from({ length: 30 }).map((_, i) => ymd(addDays(now, -i)));
        const lastSessions = keys.flatMap((k) => byDate[k] ?? []);
        const workouts = lastSessions.length;
        const totalMs = lastSessions.reduce((acc, s) => acc + (s.elapsedMs ?? 0), 0);
        const minutes = Math.round(totalMs / 60000);
        const avgMins = workouts ? Math.round(minutes / workouts) : 0;
        const avgExercises = workouts
            ? Math.round(lastSessions.reduce((a, s) => a + (s.exercises?.length ?? 0), 0) / workouts)
            : 0;
        return { workouts, minutes, avgMins, avgExercises };
    }, [byDate, now]);

    const streaks = useMemo(() => {
        // current streak from today backwards
        let current = 0;
        for (let i = 0; i < 365; i++) {
            const k = ymd(addDays(now, -i));
            if ((byDate[k]?.length ?? 0) > 0) current++;
            else break;
        }

        // best streak from available dates
        const allDates = Object.keys(byDate).sort(); // ascending YYYY-MM-DD
        let best = 0;
        let run = 0;
        let prev: string | null = null;

        for (const d of allDates) {
            if (!prev) {
                run = 1;
            } else {
                const prevDate = dateFromYmd(prev);
                const nextExpected = ymd(addDays(prevDate, 1));
                run = d === nextExpected ? run + 1 : 1;
            }
            best = Math.max(best, run);
            prev = d;
        }

        return { current, best };
    }, [byDate, now]);

    const topExercises = useMemo(() => {
        const counts = new Map<string, { name: string; c: number }>();
        for (const s of sessions) {
            for (const ex of s.exercises ?? []) {
                const key = ex.movementId || ex.name; // fallback
                const cur = counts.get(key);
                counts.set(key, { name: ex.name, c: (cur?.c ?? 0) + 1 });
            }
        }
        return [...counts.entries()]
            .map(([id, v]) => ({ id, name: v.name, count: v.c }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [sessions]);

    const bestSets = useMemo(() => {
        // best +kg and best reps per movement (across all time)
        const best = new Map<string, BestSet>();

        for (const s of sessions) {
            for (const ex of s.exercises ?? []) {
                const movementId = ex.movementId || ex.name;
                for (const set of ex.sets as any[]) {
                    const addKg = Number(set.addKg ?? 0) || 0;
                    const reps = Number(set.reps ?? 0) || 0;

                    const prev = best.get(movementId);
                    const next: BestSet = prev
                        ? {
                            ...prev,
                            bestAddKg: Math.max(prev.bestAddKg, addKg),
                            bestReps: Math.max(prev.bestReps, reps),
                            lastDate: s.date > prev.lastDate ? s.date : prev.lastDate,
                        }
                        : {
                            movementId,
                            name: ex.name,
                            bestAddKg: addKg,
                            bestReps: reps,
                            lastDate: s.date,
                        };

                    best.set(movementId, next);
                }
            }
        }

        return [...best.values()]
            .sort((a, b) => (b.bestAddKg - a.bestAddKg) || (b.bestReps - a.bestReps))
            .slice(0, 10);
    }, [sessions]);

    const repsLeaderboard30 = useMemo(() => {
        const keys = Array.from({ length: 30 }).map((_, i) => ymd(addDays(now, -i)));
        const lastSessions = keys.flatMap((k) => byDate[k] ?? []);
        const reps = new Map<string, { name: string; reps: number }>();

        for (const s of lastSessions) {
            for (const ex of s.exercises ?? []) {
                const id = ex.movementId || ex.name;
                for (const set of ex.sets as any[]) {
                    const r = Number(set.reps ?? 0) || 0;
                    const cur = reps.get(id);
                    reps.set(id, { name: ex.name, reps: (cur?.reps ?? 0) + r });
                }
            }
        }

        return [...reps.entries()]
            .map(([id, v]) => ({ id, name: v.name, reps: v.reps }))
            .sort((a, b) => b.reps - a.reps)
            .slice(0, 8);
    }, [byDate, now]);

    // tiny “activity bar” for this week
    const weekActivity = useMemo(() => {
        const max = Math.max(1, ...thisWeek.keys.map((k) => (byDate[k]?.length ?? 0)));
        return thisWeek.keys.map((k) => {
            const c = byDate[k]?.length ?? 0;
            return { k, c, h: Math.round(6 + (c / max) * 18) };
        });
    }, [thisWeek.keys, byDate]);

    return (
        <>
            <header className="mb-4 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
            </header>

            {/* Hero row */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                    <div className="text-xs text-white/55">This week</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums">{thisWeek.workouts}</div>
                    <div className="text-xs text-white/55">workout{thisWeek.workouts === 1 ? "" : "s"}</div>

                    <div className="mt-3 flex items-end gap-1">
                        {weekActivity.map((d) => (
                            <div
                                key={d.k}
                                className={cn(
                                    "w-2 rounded-full",
                                    d.c > 0 ? "bg-emerald-200/70" : "bg-white/10"
                                )}
                                style={{ height: d.h }}
                                title={`${d.k}: ${d.c}`}
                            />
                        ))}
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-xs text-white/55">Streak</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums">{streaks.current}</div>
                    <div className="text-xs text-white/55">days (best {streaks.best})</div>

                    <div className="mt-3 text-xs text-white/55">
                        Today:{" "}
                        <span className="text-white/80">
                            {(byDate[todayKey]?.length ?? 0) > 0 ? "✅ trained" : "—"}
                        </span>
                    </div>
                </Card>
            </div>

            {/* 30d summary */}
            <div className="mt-3 grid grid-cols-2 gap-4">
                <Card className="p-4">
                    <div className="text-xs text-white/55">Last 30 days</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                        {last30.workouts} workouts
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                        {last30.minutes} min total • avg {last30.avgMins} min
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                        avg {last30.avgExercises} exercises / workout
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-xs text-white/55">All-time</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                        {sessions.length} sessions
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                        {formatTime(sessions.reduce((a, s) => a + (s.elapsedMs ?? 0), 0))}
                    </div>
                </Card>
            </div>

            {/* Top exercises */}
            <Card className="mt-3 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Top exercises</div>
                    <div className="text-xs text-white/45">all time</div>
                </div>

                <div className="mt-3 space-y-2">
                    {topExercises.length === 0 ? (
                        <div className="text-sm text-white/55">No data yet.</div>
                    ) : (
                        topExercises.map((x) => (
                            <button
                                key={x.id}
                                className="w-full text-left"
                                onClick={() => openExercise(x.id, x.name)}
                            >
                                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 active:scale-[0.99] transition">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">{x.name}</div>
                                    </div>
                                    <div className="text-sm text-white/70 tabular-nums">{x.count}</div>
                                </div>
                            </button>

                        ))
                    )}
                </div>
            </Card>

            {/* Highlights */}
            <Card className="mt-3 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Highlights</div>
                    <div className="text-xs text-white/45">best set (all time)</div>
                </div>

                <div className="mt-3 space-y-2">
                    {bestSets.length === 0 ? (
                        <div className="text-sm text-white/55">No sets logged yet.</div>
                    ) : (
                        bestSets.map((b) => (
                            <div
                                key={b.movementId}
                                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">{b.name}</div>
                                        <div className="text-xs text-white/55">last: {b.lastDate}</div>
                                    </div>
                                    <div className="text-right text-xs text-white/70 tabular-nums">
                                        <div>{b.bestReps} reps</div>
                                        <div>{b.bestAddKg > 0 ? `+${b.bestAddKg}kg` : "BW"}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Volume leaderboard */}
            <Card className="mt-3 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Volume</div>
                    <div className="text-xs text-white/45">total reps (30d)</div>
                </div>

                <div className="mt-3 space-y-2">
                    {repsLeaderboard30.length === 0 ? (
                        <div className="text-sm text-white/55">No data yet.</div>
                    ) : (
                        repsLeaderboard30.map((x, idx) => (
                            <div
                                key={x.id}
                                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                            >
                                <div className="min-w-0 flex items-center gap-4">
                                    <span className="text-xs text-white/45 w-5 tabular-nums">{idx + 1}</span>
                                    <div className="truncate text-sm font-medium">{x.name}</div>
                                </div>
                                <div className="text-sm text-white/70 tabular-nums">{x.reps}</div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
            <ExerciseDetailSheet
                open={detailOpen}
                movementId={detailId}
                title={detailTitle}
                sessions={sessions}
                onClose={() => setDetailOpen(false)}
            />


            <div className="h-6" />
        </>
    );
}
