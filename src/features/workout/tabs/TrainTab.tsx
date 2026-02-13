import React, { useEffect, useRef, useState } from "react";
import type { WorkoutDraft, ExerciseEntry } from "../../../app/types";
import { formatTime } from "../../../shared/utils/time";
import { Card } from "../../../shared/ui/Card";
import { MOVEMENTS } from "../data/movements";
import type { Movement } from "../data/movements";
import { ExercisePicker } from "../components/ExercisePicker";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableExercise } from "../components/SortableExercise";
import { uid } from "../../../app/utils";
import { getLastPerformance, saveSessionFromWorkout, saveTemplateFromWorkout } from "../../../app/dbHelpers";

export function TrainTab({
    workout,
    setWorkout,
    onGoTemplates,
    onFinishedCleared,
    historyBump,
}: {
    workout: WorkoutDraft;
    setWorkout: React.Dispatch<React.SetStateAction<WorkoutDraft>>;
    onGoTemplates: () => void;
    onFinishedCleared: () => Promise<void>;
    historyBump: number;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);

    // last-time cache per movementId
    const [lastByMovement, setLastByMovement] = useState<Record<string, null | { date: string; summary: string }>>({});

    // timer loop
    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number | null>(null);

    useEffect(() => {
        if (workout.status !== "running") return;

        const tick = (t: number) => {
            if (lastTickRef.current == null) lastTickRef.current = t;
            const dt = t - lastTickRef.current;
            lastTickRef.current = t;

            setWorkout((w) => ({ ...w, elapsedMs: w.elapsedMs + dt }));
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            lastTickRef.current = null;
        };
    }, [workout.status, setWorkout]);

    // refresh last-time hints after finishing a workout (history changed)
    useEffect(() => {
        // Clear cache so it refetches as needed
        setLastByMovement({});
    }, [historyBump]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    const running = workout.status === "running";

    async function ensureLastHint(movementId: string) {
        if (movementId in lastByMovement) return;
        const last = await getLastPerformance(movementId);
        if (!last) {
            setLastByMovement((m) => ({ ...m, [movementId]: null }));
            return;
        }
        const summary = summarizeExercise(last.exercise);
        setLastByMovement((m) => ({
            ...m,
            [movementId]: { date: last.date, summary },
        }));
    }

    async function addExercise(m: Movement) {
        // fetch last-time hint in background
        ensureLastHint(m.id);

        const entry: ExerciseEntry = {
            id: crypto.randomUUID?.() ?? uid(),
            movementId: m.id,
            name: m.name,
            variation: "",
            notes: "",
            sets: [
            ],
        };

        setWorkout((w) => ({ ...w, exercises: [...w.exercises, entry] }));
    }

    // ensure hints for existing exercises (on load)
    useEffect(() => {
        workout.exercises.forEach((ex) => {
            ensureLastHint(ex.movementId);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workout.exercises.map((e) => e.movementId).join("|")]);

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;

        setWorkout((w) => {
            const oldIndex = w.exercises.findIndex((x) => x.id === active.id);
            const newIndex = w.exercises.findIndex((x) => x.id === over.id);
            if (oldIndex < 0 || newIndex < 0) return w;
            return { ...w, exercises: arrayMove(w.exercises, oldIndex, newIndex) };
        });
    }

    async function finishWorkout() {
        // Save session to IndexedDB
        await saveSessionFromWorkout(workout);
        // Clear active workout (as requested)
        await onFinishedCleared();
    }
    async function saveAsTemplate() {
        if (workout.exercises.length === 0) return;

        const name = window.prompt("Template name?", workout.title || "Workout");
        if (!name) return;

        await saveTemplateFromWorkout(workout, name);
        // optional: tiny feedback
        // window.alert("Saved as template");
    }


    return (
        <>
            <header className="mb-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Train</h1>
                        <p className="text-white/55 text-sm">
                            Log sets • track progressive overload
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="text-3xl font-semibold tabular-nums">
                            {formatTime(workout.elapsedMs)}
                        </div>
                        <div className="text-xs text-white/50">
                            {workout.status === "idle"
                                ? "Ready"
                                : workout.status === "running"
                                    ? "Tracking"
                                    : "Paused"}
                        </div>
                    </div>
                </div>
            </header>

            <Card className="p-4">
                <div className="space-y-3">
                    <input
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none focus:border-white/25"
                        value={workout.title}
                        onChange={(e) => setWorkout((w) => ({ ...w, title: e.target.value }))}
                    />

                    <div className="grid grid-cols-2 gap-2">
                        {/* Primary: matte light */}
                        <button
                            className={`rounded-2xl px-4 py-3 text-base font-semibold transition active:scale-[0.98] ${running
                                ? "bg-white/10 text-white border border-white/20"
                                : "bg-[#F3F4F6] text-black hover:bg-white"
                                }`}
                            onClick={() =>
                                setWorkout((w) => {
                                    const nextStatus = w.status === "running" ? "paused" : "running";
                                    return {
                                        ...w,
                                        status: nextStatus,
                                        startedAt: w.startedAt ?? (nextStatus === "running" ? Date.now() : null),
                                    };
                                })
                            }
                        >
                            {running ? "Pause" : workout.status === "paused" ? "Resume" : "Start"}
                        </button>

                        <button
                            className="rounded-2xl px-4 py-3 text-base font-medium border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 active:scale-[0.98] transition"
                            onClick={() =>
                                setWorkout((w) => ({ ...w, elapsedMs: 0, status: "idle", startedAt: null }))
                            }
                        >
                            Reset
                        </button>

                        <button
                            className="rounded-2xl px-4 py-3 text-base font-medium border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 active:scale-[0.98] transition"
                            onClick={() => setPickerOpen(true)}
                        >
                            + Exercise
                        </button>

                        <button
                            className="rounded-2xl px-4 py-3 text-base font-medium border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 active:scale-[0.98] transition"
                            onClick={onGoTemplates}
                        >
                            Templates
                        </button>

                        <button
                            className="col-span-2 rounded-2xl px-4 py-3 text-base font-medium border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-40"
                            onClick={saveAsTemplate}
                            disabled={workout.exercises.length === 0}
                            title={workout.exercises.length === 0 ? "Add exercises first" : "Save as template"}
                        >
                            Save as template
                        </button>


                        <button
                            className="col-span-2 rounded-2xl px-4 py-3 text-base font-semibold border border-white/10 bg-white/5 text-white hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-40"
                            onClick={finishWorkout}
                            disabled={workout.exercises.length === 0}
                            title={workout.exercises.length === 0 ? "Add exercises first" : "Finish workout"}
                        >
                            Finish workout
                        </button>
                    </div>
                </div>
            </Card>

            <main className="mt-4 space-y-3">
                {workout.exercises.length === 0 ? (
                    <Card className="p-6">
                        <p className="text-white/70">
                            Add exercises to start logging. You’ll see a <span className="text-white">Last time</span>{" "}
                            hint once you’ve finished at least one workout.
                        </p>
                    </Card>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                        <SortableContext
                            items={workout.exercises.map((x) => x.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {workout.exercises.map((ex) => (
                                    <SortableExercise
                                        key={ex.id}
                                        entry={ex}
                                        lastTime={lastByMovement[ex.movementId] ?? null}
                                        onUpdate={(patch) =>
                                            setWorkout((w) => ({
                                                ...w,
                                                exercises: w.exercises.map((x) => (x.id === ex.id ? { ...x, ...patch } : x)),
                                            }))
                                        }
                                        onRemove={() =>
                                            setWorkout((w) => ({
                                                ...w,
                                                exercises: w.exercises.filter((x) => x.id !== ex.id),
                                            }))
                                        }
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </main>

            <ExercisePicker
                open={pickerOpen}
                movements={MOVEMENTS}
                onClose={() => setPickerOpen(false)}
                onPick={(m) => addExercise(m)}
            />
        </>
    );
}

function summarizeExercise(ex: ExerciseEntry) {
    const parts = ex.sets.map((s) => {
        const reps = s.reps === "" ? "-" : s.reps;
        const kg = s.addKg === "" || s.addKg === 0 ? "" : `+${s.addKg}kg`;
        return `${reps}${kg ? ` @ ${kg}` : ""}`;
    });

    return parts.join(" • ");
}
