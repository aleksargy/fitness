import React, { useEffect, useRef, useState } from "react";
import { Card } from "../../shared/ui/Card";
import { formatTime } from "../../shared/utils/time";
import { loadJSON, saveJSON } from "../../shared/utils/storage";
import { MOVEMENTS } from "./data/movements";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExercisePicker } from "./components/ExercisePicker";
import type { Movement } from "./data/movements";


type LoadMode = "bodyweight" | "weighted";

type SetRow = { id: string; reps: number | ""; done: boolean };

type ExerciseEntry = {
  id: string;
  movementId: string;
  name: string;
  variation: string;
  notes: string;
  load: { mode: LoadMode; addKg: number | "" };
  sets: SetRow[];
};

type Workout = {
  id: string;
  title: string;
  status: "idle" | "running" | "paused";
  elapsedMs: number;
  exercises: ExerciseEntry[];
};

const STORAGE_KEY = "workout_pwa_v1";
const uid = () => Math.random().toString(36).slice(2, 10);

function pill(active: boolean) {
  return `px-3 py-1.5 rounded-full text-sm transition border
  ${active ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"}`;
}

function SortableExercise({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: ExerciseEntry;
  onUpdate: (patch: Partial<ExerciseEntry>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <button
            className="mt-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-white/70 hover:text-white hover:bg-white/10 active:scale-[0.99]"
            {...attributes}
            {...listeners}
            title="Drag to reorder"
          >
            <div className="grid gap-1">
              <span className="block h-1 w-4 rounded bg-white/40" />
              <span className="block h-1 w-4 rounded bg-white/40" />
              <span className="block h-1 w-4 rounded bg-white/40" />
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-white">
                    {entry.name}
                  </h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                    {entry.load.mode === "bodyweight"
                      ? "Bodyweight"
                      : `+${entry.load.addKg || 0} kg`}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/25"
                    placeholder="Variation (e.g., rings, wide grip)"
                    value={entry.variation}
                    onChange={(e) => onUpdate({ variation: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/25"
                    placeholder="Notes (optional)"
                    value={entry.notes}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className={pill(entry.load.mode === "bodyweight")}
                    onClick={() =>
                      onUpdate({ load: { ...entry.load, mode: "bodyweight", addKg: "" } })
                    }
                  >
                    Bodyweight
                  </button>
                  <button
                    className={pill(entry.load.mode === "weighted")}
                    onClick={() => onUpdate({ load: { ...entry.load, mode: "weighted" } })}
                  >
                    Weighted
                  </button>

                  {entry.load.mode === "weighted" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-sm text-white/70">+ kg</span>
                        <input
                          inputMode="decimal"
                          className="w-24 bg-transparent text-white outline-none placeholder:text-white/30 text-base"
                          placeholder="0"
                          value={entry.load.addKg}
                          onChange={(e) => {
                            const v = e.target.value;
                            onUpdate({
                              load: { ...entry.load, addKg: v === "" ? "" : Number(v) },
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}

                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">Sets</p>
                    <button
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                      onClick={() =>
                        onUpdate({
                          sets: [...entry.sets, { id: uid(), reps: "", done: false }],
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
                            className="w-20 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-white outline-none focus:border-white/25"
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

                        <button
                          className={`ml-auto rounded-xl px-3 py-1.5 text-sm border transition ${s.done
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
                          {s.done ? "Done" : "Mark done"}
                        </button>

                        <button
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 hover:text-white"
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
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={onRemove}
                title="Remove exercise"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function WorkoutScreen() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [workout, setWorkout] = useState<Workout>(() =>
    loadJSON(STORAGE_KEY, {
      id: uid(),
      title: "Workout",
      status: "idle",
      elapsedMs: 0,
      exercises: [],
    })
  );

  useEffect(() => saveJSON(STORAGE_KEY, workout), [workout]);

  // timer
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
  }, [workout.status]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const addExercise = (m: Movement) => {
    const entry: ExerciseEntry = {
      id: uid(),
      movementId: m.id,
      name: m.name,
      variation: "",
      notes: "",
      load: { mode: "bodyweight", addKg: "" },
      sets: [
        { id: uid(), reps: "", done: false },
        { id: uid(), reps: "", done: false },
        { id: uid(), reps: "", done: false },
      ],
    };

    setWorkout((w) => ({ ...w, exercises: [...w.exercises, entry] }));
  };


  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    setWorkout((w) => {
      const oldIndex = w.exercises.findIndex((x) => x.id === active.id);
      const newIndex = w.exercises.findIndex((x) => x.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return w;
      return { ...w, exercises: arrayMove(w.exercises, oldIndex, newIndex) };
    });
  };

  const running = workout.status === "running";

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-10">
        <header className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Fit with Schlago</h1>
              <p className="text-white/55 text-sm">
                Create Workout
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-semibold tabular-nums">
                {formatTime(workout.elapsedMs)}
              </div>
              <div className="text-xs text-white/50">
                {workout.status === "idle" ? "Ready" : workout.status === "running" ? "Tracking" : "Paused"}
              </div>
            </div>
          </div>

          <Card className="p-4">
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <input
                className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/25"
                value={workout.title}
                onChange={(e) => setWorkout((w) => ({ ...w, title: e.target.value }))}
              />

              <button
                className={`rounded-xl px-4 py-2 border transition ${running
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                onClick={() =>
                  setWorkout((w) => ({
                    ...w,
                    status: w.status === "running" ? "paused" : "running",
                  }))
                }
              >
                {running ? "Pause" : workout.status === "paused" ? "Resume" : "Start"}
              </button>

              <button
                className="rounded-xl px-4 py-2 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setWorkout((w) => ({ ...w, elapsedMs: 0, status: "idle" }))}
              >
                Reset
              </button>

              <button
                className="rounded-xl px-4 py-2 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() =>
                  setWorkout({
                    id: uid(),
                    title: "Workout",
                    status: "idle",
                    elapsedMs: 0,
                    exercises: [],
                  })
                }
              >
                New
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="text-sm text-white/60">Add exercise</div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white/85 hover:bg-white/10 active:scale-[0.99] transition"
                  onClick={() => setPickerOpen(true)}
                >
                  + Add exercise
                </button>
              </div>
              <div className="ml-auto text-xs text-white/45">Tip: drag handle to reorder</div>
            </div>
          </Card>
        </header>

        <main className="space-y-3">
          {workout.exercises.length === 0 ? (
            <Card className="p-6">
              <p className="text-white/70">
                Add a movement to start logging. Defaults to{" "}
                <span className="text-white">bodyweight</span>, with a clean way to log{" "}
                <span className="text-white">weighted</span> load.
              </p>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={workout.exercises.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {workout.exercises.map((ex) => (
                    <SortableExercise
                      key={ex.id}
                      entry={ex}
                      onUpdate={(patch) =>
                        setWorkout((w) => ({
                          ...w,
                          exercises: w.exercises.map((x) => (x.id === ex.id ? { ...x, ...patch } : x)),
                        }))
                      }
                      onRemove={() =>
                        setWorkout((w) => ({ ...w, exercises: w.exercises.filter((x) => x.id !== ex.id) }))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </main>

        <footer className="mt-8 text-center text-xs text-white/35">If you read this you are a schli schla</footer>
      </div>
      <ExercisePicker
        open={pickerOpen}
        movements={MOVEMENTS}
        onClose={() => setPickerOpen(false)}
        onPick={(m) => addExercise(m)}
      />
    </div>
  );
}
