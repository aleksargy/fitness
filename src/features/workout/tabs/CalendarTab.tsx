import { useEffect, useMemo, useState } from "react";
import type { Session } from "../../../app/types";
import { Card } from "../../../shared/ui/Card";
import { deleteSession, listSessionsNewestFirst } from "../../../app/dbHelpers";
import { formatTime } from "../../../shared/utils/time";

function cn(...xs: Array<string | false | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, delta: number) {
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function yyyyMmDdFromDate(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function weekdayMon0(date: Date) {
    // Mon=0 .. Sun=6
    const js = date.getDay(); // Sun=0..Sat=6
    return (js + 6) % 7;
}
function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

export function CalendarTab({ onStartNew }: { onStartNew: () => void }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState(() => yyyyMmDdFromDate(new Date()));
    const [openSession, setOpenSession] = useState<Session | null>(null);

    async function refresh() {
        setSessions(await listSessionsNewestFirst());
    }

    useEffect(() => {
        refresh();
    }, []);

    // group sessions by date (YYYY-MM-DD)
    const byDate = useMemo(() => {
        const map: Record<string, Session[]> = {};
        for (const s of sessions) (map[s.date] ??= []).push(s);
        // newest session first within day
        for (const k of Object.keys(map)) {
            map[k] = map[k].slice().sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1));
        }
        return map;
    }, [sessions]);

    // Build calendar grid: 6 weeks x 7 days
    const grid = useMemo(() => {
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        const lead = weekdayMon0(start); // number of leading blanks
        const totalDays = end.getDate();
        const cells: Array<{ date: Date; inMonth: boolean; key: string }> = [];

        // start from the Monday of the first week
        const firstCellDate = new Date(start);
        firstCellDate.setDate(start.getDate() - lead);

        for (let i = 0; i < 42; i++) {
            const d = new Date(firstCellDate);
            d.setDate(firstCellDate.getDate() + i);
            const inMonth = d.getMonth() === month.getMonth();
            cells.push({ date: d, inMonth, key: yyyyMmDdFromDate(d) });
        }

        return { cells, lead, totalDays };
    }, [month]);

    const todayKey = yyyyMmDdFromDate(new Date());
    const selectedSessions = byDate[selectedDate] ?? [];

    // keep selectedDate in current month when switching months (nice UX)
    useEffect(() => {
        const d = new Date(selectedDate);
        if (Number.isNaN(d.getTime())) return;
        // if selected date not in this month, select first day of month
        if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) {
            setSelectedDate(`${month.getFullYear()}-${pad2(month.getMonth() + 1)}-01`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month]);

    return (
        <>
            <header className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
                    <p className="text-white/55 text-sm">Tap a day to review your training</p>
                </div>

                <button
                    className="rounded-2xl px-4 py-3 text-sm font-semibold bg-[#F3F4F6] text-black hover:bg-white active:scale-[0.98] transition"
                    onClick={onStartNew}
                >
                    Train
                </button>
            </header>

            {/* Month header */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <button
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 active:scale-[0.99] transition"
                        onClick={() => setMonth((m) => addMonths(m, -1))}
                        aria-label="Previous month"
                    >
                        ←
                    </button>

                    <div className="text-base font-semibold">
                        {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
                    </div>

                    <button
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 active:scale-[0.99] transition"
                        onClick={() => setMonth((m) => addMonths(m, 1))}
                        aria-label="Next month"
                    >
                        →
                    </button>
                </div>

                {/* Weekday labels */}
                <div className="mt-4 grid grid-cols-7 text-xs text-white/45">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                        <div key={w} className="px-1 py-1 text-center">
                            {w}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="mt-1 grid grid-cols-7 gap-2">
                    {grid.cells.map(({ date, inMonth, key }) => {
                        const isToday = key === todayKey;
                        const isSelected = key === selectedDate;
                        const count = (byDate[key]?.length ?? 0);
                        const intensity = clamp(count, 0, 4);

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedDate(key)}
                                className={cn(
                                    "rounded-2xl border px-2 py-2 text-center transition active:scale-[0.99]",
                                    inMonth ? "text-white" : "text-white/30",
                                    isSelected
                                        ? "border-white/25 bg-white/10"
                                        : "border-white/10 bg-white/5 hover:bg-white/10",
                                    isToday && !isSelected ? "ring-1 ring-white/20" : ""
                                )}
                            >
                                <div className="text-sm font-semibold tabular-nums">
                                    {date.getDate()}
                                </div>

                                {/* activity indicator */}
                                <div className="mt-1 flex justify-center gap-1">
                                    {count === 0 ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                                    ) : (
                                        <>
                                            {Array.from({ length: Math.min(3, count) }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        // subtle forest-y dots
                                                        intensity >= 3 ? "bg-emerald-300/80" : "bg-emerald-200/60"
                                                    )}
                                                />
                                            ))}
                                            {count > 3 ? (
                                                <span className="text-[10px] text-white/55 ml-1">+{count - 3}</span>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Selected day summary */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-white/70">
                        {selectedDate}
                        <span className="text-white/45"> • </span>
                        {selectedSessions.length === 0
                            ? "No sessions"
                            : `${selectedSessions.length} session${selectedSessions.length > 1 ? "s" : ""}`}
                    </div>

                    {selectedDate === todayKey ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                            Today
                        </span>
                    ) : null}
                </div>
            </Card>

            {/* Day sessions list */}
            <div className="mt-4 space-y-3">
                {selectedSessions.length === 0 ? (
                    <Card className="p-6">
                        <p className="text-white/70">No workouts logged for this day.</p>
                    </Card>
                ) : (
                    selectedSessions.map((s) => (
                        <button
                            key={s.id}
                            className="w-full text-left"
                            onClick={() => setOpenSession(s)}
                        >
                            <Card className="p-4 hover:bg-white/[0.06] transition">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-base font-semibold truncate">{s.title}</div>
                                        <div className="text-xs text-white/55">
                                            {formatTime(s.elapsedMs)} • {s.exercises.length} exercises
                                        </div>
                                    </div>
                                    <div className="text-white/45">›</div>
                                </div>

                                {/* tiny preview chips */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {s.exercises.slice(0, 4).map((ex) => (
                                        <span
                                            key={ex.id}
                                            className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
                                        >
                                            {ex.name}
                                        </span>
                                    ))}
                                    {s.exercises.length > 4 ? (
                                        <span className="text-xs text-white/45">+{s.exercises.length - 4} more</span>
                                    ) : null}
                                </div>
                            </Card>
                        </button>
                    ))
                )}
            </div>

            {/* Session detail sheet */}
            <SessionSheet
                openSession={openSession}
                onClose={() => setOpenSession(null)}
                onDeleted={async (id) => {
                    await deleteSession(id);
                    setOpenSession(null);
                    await refresh();
                }}
            />

        </>
    );
}

function SessionSheet({
    openSession,
    onClose,
    onDeleted,
}: {
    openSession: Session | null;
    onClose: () => void;
    onDeleted: (id: string) => Promise<void>;
}) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (openSession) {
            setMounted(true);
            requestAnimationFrame(() => setVisible(true));
        } else if (mounted) {
            setVisible(false);
            const t = setTimeout(() => setMounted(false), 180);
            return () => clearTimeout(t);
        }
    }, [openSession, mounted]);

    if (!mounted || !openSession) return null;

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
                                        <div className="text-base font-semibold truncate">{openSession.title}</div>
                                        <div className="text-xs text-white/55">
                                            {openSession.date} • {formatTime(openSession.elapsedMs)} •{" "}
                                            {openSession.exercises.length} exercises
                                        </div>
                                    </div>
                                    <button
                                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 active:scale-[0.99] transition"
                                        onClick={async () => {
                                            const ok = window.confirm(`Delete "${openSession.title}" on ${openSession.date}?`);
                                            if (!ok) return;
                                            await onDeleted(openSession.id);
                                        }}
                                        title="Delete this session"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="h-[calc(82vh-92px)] overflow-y-auto px-2 pb-3">
                                <div className="space-y-2">
                                    {openSession.exercises.map((ex) => (
                                        <div key={ex.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-semibold">{ex.name}</div>
                                            </div>

                                            {(ex.notes) && (
                                                <div className="mt-1 text-xs text-white/55">
                                                    {ex.notes ? <span> • </span> : null}
                                                    {ex.notes ? <span>Notes: {ex.notes}</span> : null}
                                                </div>
                                            )}

                                            {/* Sets */}
                                            <div className="mt-2 space-y-1">
                                                {ex.sets.map((set, i) => (
                                                    <div
                                                        key={set.id}
                                                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                                                    >
                                                        <div className="text-white/60">Set {i + 1}</div>
                                                        <div className="text-white/85 tabular-nums">
                                                            {set.reps === "" ? "-" : set.reps} reps
                                                            {"addKg" in set && set.addKg !== "" && set.addKg !== 0
                                                                ? `  •  +${set.addKg}kg`
                                                                : ""}
                                                        </div>
                                                        <div className="text-white/50">{set.done ? "✓" : ""}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
