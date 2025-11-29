import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  MUSCLE_GROUPS,
  type View,
  type MuscleGroup,
  type WorkoutExerciseTemplate,
  type ExerciseSetLog,
  type WorkoutExerciseLog,
  type WorkoutTemplate,
  type WorkoutLog,
} from "./types/training";

import {
  calculateStreak,
  getWeekStart,
  getHeatmapClass,
} from "./utils/stats";

import { FragmentRow } from "./components/FragmentRow";
import { StatCard } from "./components/StatCard";
import { StatSubCard } from "./components/StatSubCard";

const STORAGE_KEY_TEMPLATES = "fitlog-v3-workout-templates";
const STORAGE_KEY_LOGS = "fitlog-v3-workout-logs";

function App() {
  const [view, setView] = useState<View>("overview");

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  const todayDate = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");

  // Workout builder / editor state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [newWorkoutDescription, setNewWorkoutDescription] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseSets, setNewExerciseSets] = useState("3");
  const [newExerciseReps, setNewExerciseReps] = useState("10");
  const [newExerciseWeight, setNewExerciseWeight] = useState("");
  const [builderExercises, setBuilderExercises] = useState<
    WorkoutExerciseTemplate[]
  >([]);

  // Stats: selected exercise
  const [selectedExerciseForStats, setSelectedExerciseForStats] =
    useState<string>("");

  // ---- Load & persist localStorage ----
  useEffect(() => {
    try {
      const tRaw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (tRaw) {
        const parsed = JSON.parse(tRaw);
        if (Array.isArray(parsed)) {
          setTemplates(parsed);
        }
      }
    } catch {
      // ignore
    }

    try {
      const lRaw = localStorage.getItem(STORAGE_KEY_LOGS);
      if (lRaw) {
        const parsed = JSON.parse(lRaw);
        if (Array.isArray(parsed)) {
          setLogs(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  }, [logs]);

  // ---- Derived data ----
  const selectedDateLogs = logs.filter((l) => l.date === selectedDate);

  const allExerciseEntries = useMemo(
    () =>
      logs.flatMap((log) =>
        log.exercises.flatMap((ex) =>
          ex.sets.map((set) => {
            const volume =
              set.weight > 0 ? set.weight * set.reps : set.reps;
            return {
              exerciseName: ex.name,
              reps: set.reps,
              weight: set.weight,
              volume,
              date: log.date,
              logId: log.id,
            };
          })
        )
      ),
    [logs]
  );

  const allExerciseNames = useMemo(
    () =>
      Array.from(
        new Set(allExerciseEntries.map((e) => e.exerciseName))
      ).sort((a, b) => a.localeCompare(b)),
    [allExerciseEntries]
  );

  useEffect(() => {
    if (!selectedExerciseForStats && allExerciseNames.length > 0) {
      setSelectedExerciseForStats(allExerciseNames[0]);
    }
    if (
      selectedExerciseForStats &&
      !allExerciseNames.includes(selectedExerciseForStats)
    ) {
      setSelectedExerciseForStats("");
    }
  }, [allExerciseNames, selectedExerciseForStats]);

  const selectedExerciseEntries = useMemo(
    () =>
      selectedExerciseForStats
        ? allExerciseEntries.filter(
            (e) => e.exerciseName === selectedExerciseForStats
          )
        : [],
    [allExerciseEntries, selectedExerciseForStats]
  );

  // Global stats
  const totalWorkoutsLogged = logs.length;
  const trainingDaysCount = useMemo(
    () => new Set(logs.map((l) => l.date)).size,
    [logs]
  );
  const distinctExercisesCount = allExerciseNames.length;

  const { currentStreak, bestStreak } = useMemo(
    () => calculateStreak(logs.map((l) => l.date)),
    [logs]
  );

  // PRs & per-exercise stats
  const exercisePRs = useMemo(() => {
    if (!selectedExerciseEntries.length) return null;

    let heaviest: (typeof selectedExerciseEntries)[number] | null = null;
    let bestReps: (typeof selectedExerciseEntries)[number] | null = null;
    let bestVolume: (typeof selectedExerciseEntries)[number] | null = null;
    let best1RM:
      | { entry: (typeof selectedExerciseEntries)[number]; oneRM: number }
      | null = null;

    let isWeighted = false;

    for (const e of selectedExerciseEntries) {
      if (!bestReps || e.reps > bestReps.reps) bestReps = e;
      if (!bestVolume || e.volume > bestVolume.volume) bestVolume = e;

      if (e.weight > 0) {
        isWeighted = true;
        if (!heaviest || e.weight > heaviest.weight) heaviest = e;
        const oneRM = e.weight * (1 + e.reps / 30);
        if (!best1RM || oneRM > best1RM.oneRM) {
          best1RM = { entry: e, oneRM };
        }
      }
    }

    return {
      isWeighted,
      heaviest,
      bestReps,
      bestVolume,
      best1RM,
    };
  }, [selectedExerciseEntries]);

  const exerciseStats = useMemo(() => {
    if (!selectedExerciseEntries.length) {
      return null;
    }
    const sessions = new Set(
      selectedExerciseEntries.map((e) => e.logId)
    ).size;

    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    const dates = new Set<string>();

    for (const e of selectedExerciseEntries) {
      totalSets += 1;
      totalReps += e.reps;
      totalVolume += e.volume;
      dates.add(e.date);
    }

    const sortedDates = Array.from(dates).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      sessions,
      totalSets,
      totalReps,
      totalVolume,
      daysTrained: dates.size,
      firstDate: sortedDates[0],
      lastDate: sortedDates[sortedDates.length - 1],
    };
  }, [selectedExerciseEntries]);

  const exerciseVolumeByDate = useMemo(() => {
    if (!selectedExerciseEntries.length) return [];
    const map = new Map<string, number>();
    for (const e of selectedExerciseEntries) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.volume);
    }
    return Array.from(map.entries())
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedExerciseEntries]);

  const exercise1RMByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of selectedExerciseEntries) {
      if (e.weight <= 0) continue;
      const oneRM = e.weight * (1 + e.reps / 30);
      const prev = map.get(e.date) ?? 0;
      if (oneRM > prev) map.set(e.date, oneRM);
    }
    return Array.from(map.entries())
      .map(([date, oneRM]) => ({ date, oneRM }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedExerciseEntries]);

  const exerciseBestRepsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of selectedExerciseEntries) {
      const prev = map.get(e.date) ?? 0;
      if (e.reps > prev) map.set(e.date, e.reps);
    }
    return Array.from(map.entries())
      .map(([date, reps]) => ({ date, reps }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedExerciseEntries]);

  const exerciseWeeklyStats = useMemo(() => {
    if (!selectedExerciseEntries.length) return [];
    const map = new Map<
      string,
      { volume: number; sets: number; reps: number; sessions: Set<string> }
    >();

    for (const e of selectedExerciseEntries) {
      const week = getWeekStart(e.date);
      let entry = map.get(week);
      if (!entry) {
        entry = {
          volume: 0,
          sets: 0,
          reps: 0,
          sessions: new Set<string>(),
        };
        map.set(week, entry);
      }
      entry.volume += e.volume;
      entry.sets += 1;
      entry.reps += e.reps;
      entry.sessions.add(e.logId);
    }

    return Array.from(map.entries())
      .map(([weekStart, v]) => ({
        weekStart,
        volume: v.volume,
        sets: v.sets,
        reps: v.reps,
        sessions: v.sessions.size,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }, [selectedExerciseEntries]);

  // Calendar view
  const logsByDate = useMemo(
    () =>
      logs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
        if (!acc[log.date]) acc[log.date] = [];
        acc[log.date].push(log);
        return acc;
      }, {}),
    [logs]
  );

  const sortedDates = useMemo(
    () => Object.keys(logsByDate).sort((a, b) => b.localeCompare(a)),
    [logsByDate]
  );

  // Muscle-group mapping
  const exerciseGroupMap = useMemo(() => {
    const map = new Map<string, MuscleGroup>();
    templates.forEach((t) =>
      t.exercises.forEach((ex) => {
        if (ex.muscleGroup) {
          map.set(ex.name, ex.muscleGroup);
        }
      })
    );
    return map;
  }, [templates]);

  const muscleGroupStats = useMemo(() => {
    const result: {
      group: MuscleGroup;
      sets: number;
      reps: number;
      volume: number;
      days: number;
    }[] = [];

    if (!allExerciseEntries.length) return result;

    const perGroup: Record<
      MuscleGroup,
      { sets: number; reps: number; volume: number; dates: Set<string> }
    > = {} as any;

    MUSCLE_GROUPS.forEach((g) => {
      perGroup[g] = {
        sets: 0,
        reps: 0,
        volume: 0,
        dates: new Set<string>(),
      };
    });

    for (const e of allExerciseEntries) {
      const g = exerciseGroupMap.get(e.exerciseName) ?? "Other";
      const st = perGroup[g];
      st.sets += 1;
      st.reps += e.reps;
      st.volume += e.volume;
      st.dates.add(e.date);
    }

    MUSCLE_GROUPS.forEach((g) => {
      const st = perGroup[g];
      if (st.sets > 0) {
        result.push({
          group: g,
          sets: st.sets,
          reps: st.reps,
          volume: st.volume,
          days: st.dates.size,
        });
      }
    });

    result.sort((a, b) => b.volume - a.volume);
    return result;
  }, [allExerciseEntries, exerciseGroupMap]);

  // Heatmap
  const dailyIntensityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of allExerciseEntries) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.volume);
    }
    return map;
  }, [allExerciseEntries]);

  const heatmapDays = useMemo(() => {
    const days: { date: string; intensity: number }[] = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const intensity = dailyIntensityMap.get(ds) ?? 0;
      days.push({ date: ds, intensity });
    }
    return days;
  }, [dailyIntensityMap]);

  const maxHeatmapIntensity = useMemo(
    () =>
      heatmapDays.reduce(
        (max, d) => (d.intensity > max ? d.intensity : max),
        0
      ),
    [heatmapDays]
  );

  // ---- Handlers: workout builder / editor ----
  const handleAddExerciseToBuilder = (e: FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    const sets = Number(newExerciseSets) || 0;
    const reps = Number(newExerciseReps) || 0;
    if (sets <= 0 || reps <= 0) return;

    const weight = newExerciseWeight
      ? Number(newExerciseWeight)
      : undefined;

    const newEx: WorkoutExerciseTemplate = {
      id: crypto.randomUUID(),
      name: newExerciseName.trim(),
      sets,
      reps,
      weight,
    };

    setBuilderExercises((prev) => [...prev, newEx]);
    setNewExerciseName("");
    setNewExerciseSets("3");
    setNewExerciseReps("10");
    setNewExerciseWeight("");
  };

  const handleRemoveExerciseFromBuilder = (id: string) => {
    setBuilderExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleMoveExercise = (id: string, direction: "up" | "down") => {
    setBuilderExercises((prev) => {
      const index = prev.findIndex((ex) => ex.id === id);
      if (index === -1) return prev;
      const newArr = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newArr.length) return prev;
      const [item] = newArr.splice(index, 1);
      newArr.splice(newIndex, 0, item);
      return newArr;
    });
  };

  const handleEditBuilderExerciseField = (
    id: string,
    field: "name" | "sets" | "reps" | "weight" | "muscleGroup",
    value: string
  ) => {
    setBuilderExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        if (field === "name") {
          return { ...ex, name: value };
        }
        if (field === "sets") {
          return { ...ex, sets: Number(value) || 0 };
        }
        if (field === "reps") {
          return { ...ex, reps: Number(value) || 0 };
        }
        if (field === "weight") {
          return {
            ...ex,
            weight: value ? Number(value) : undefined,
          };
        }
        if (field === "muscleGroup") {
          return {
            ...ex,
            muscleGroup: value as MuscleGroup,
          };
        }
        return ex;
      })
    );
  };

  const resetBuilder = () => {
    setEditingTemplateId(null);
    setNewWorkoutName("");
    setNewWorkoutDescription("");
    setBuilderExercises([]);
  };

  const handleCreateOrUpdateTemplate = (e: FormEvent) => {
    e.preventDefault();
    if (!newWorkoutName.trim()) return;
    if (builderExercises.length === 0) {
      alert("Add at least one exercise to the workout.");
      return;
    }

    const baseTemplate: WorkoutTemplate = {
      id: editingTemplateId ?? crypto.randomUUID(),
      name: newWorkoutName.trim(),
      description: newWorkoutDescription.trim() || undefined,
      createdAt:
        editingTemplateId !== null
          ? templates.find((t) => t.id === editingTemplateId)
              ?.createdAt ?? new Date().toISOString()
          : new Date().toISOString(),
      exercises: builderExercises,
    };

    if (editingTemplateId) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplateId ? baseTemplate : t))
      );
    } else {
      setTemplates((prev) => [baseTemplate, ...prev]);
    }

    setSelectedWorkoutId(baseTemplate.id);
    resetBuilder();
  };

  const handleStartEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplateId(template.id);
    setNewWorkoutName(template.name);
    setNewWorkoutDescription(template.description ?? "");
    setBuilderExercises(
      template.exercises.map((ex) => ({ ...ex }))
    );
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm("Delete this workout template? Existing logs will stay.")) {
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedWorkoutId === id) {
      setSelectedWorkoutId("");
    }
  };

  // ---- Handlers: logging + editing logs ----
  const handleLogWorkout = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWorkoutId) return;

    const template = templates.find((t) => t.id === selectedWorkoutId);
    if (!template) return;

    const exercises: WorkoutExerciseLog[] = template.exercises.map(
      (ex) => ({
        id: crypto.randomUUID(),
        name: ex.name,
        sets: Array.from({ length: ex.sets }, (_, idx) => ({
          id: crypto.randomUUID(),
          setIndex: idx + 1,
          reps: ex.reps,
          weight: ex.weight ?? 0, // 0 = bodyweight
        })),
      })
    );

    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      date: selectedDate,
      workoutId: template.id,
      workoutName: template.name,
      exercises,
    };

    setLogs((prev) => [newLog, ...prev]);
  };

  const handleClearLogsForDate = (date: string) => {
    if (!confirm(`Clear all logs for ${date}?`)) return;
    setLogs((prev) => prev.filter((l) => l.date !== date));
  };

  const updateLog = (updateFn: (log: WorkoutLog) => WorkoutLog) => {
    setLogs((prev) => prev.map(updateFn));
  };

  const handleUpdateSetInLog = (
    logId: string,
    exerciseId: string,
    setId: string,
    field: "reps" | "weight",
    value: string
  ) => {
    const numeric = Number(value) || 0;
    updateLog((log) => {
      if (log.id !== logId) return log;
      return {
        ...log,
        exercises: log.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    [field]: numeric,
                  }
                : set
            ),
          };
        }),
      };
    });
  };

  const handleAddSetToLoggedExercise = (
    logId: string,
    exerciseId: string
  ) => {
    updateLog((log) => {
      if (log.id !== logId) return log;
      return {
        ...log,
        exercises: log.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const last = ex.sets[ex.sets.length - 1];
          const newSet: ExerciseSetLog = {
            id: crypto.randomUUID(),
            setIndex: ex.sets.length + 1,
            reps: last?.reps ?? 10,
            weight: last?.weight ?? 0,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      };
    });
  };

  const handleRemoveLastSetFromLoggedExercise = (
    logId: string,
    exerciseId: string
  ) => {
    updateLog((log) => {
      if (log.id !== logId) return log;
      return {
        ...log,
        exercises: log.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          if (ex.sets.length <= 1) return ex;
          return {
            ...ex,
            sets: ex.sets.slice(0, ex.sets.length - 1),
          };
        }),
      };
    });
  };

  const handleChangeSelectedDate = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // ---- Render ----
  return (
    <div className="w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 via-sky-500 to-indigo-600 rounded-3xl p-[1px] shadow-xl mb-6">
        <div className="bg-slate-950/90 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              FitLog
            </h1>
            <p className="text-sm text-slate-200/90 mt-1">
              Structured workouts, per-set logging, PRs and volume stats —
              in your browser.
            </p>
          </div>
          <div className="text-right text-xs text-slate-200/90 space-y-1">
            <div>
              <p className="uppercase tracking-[0.2em] text-slate-300/80 mb-1">
                Today
              </p>
              <p className="font-mono">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <p className="text-slate-300">
              {totalWorkoutsLogged} workout
              {totalWorkoutsLogged === 1 ? "" : "s"} logged
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-1 mb-6 shadow-lg shadow-slate-950/40">
        <div className="flex text-xs sm:text-sm gap-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "calendar", label: "Calendar" },
            { id: "workouts", label: "Workouts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as View)}
              className={`flex-1 rounded-xl px-3 py-2 transition text-center ${
                view === tab.id
                  ? "bg-slate-800 text-white shadow-inner"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW VIEW */}
      {view === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Log workout + today's logs */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
              <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
                Quick log
                <span className="text-xs font-normal text-slate-400">
                  Stored locally on this device
                </span>
              </h2>
              <form className="space-y-4" onSubmit={handleLogWorkout}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleChangeSelectedDate}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Workout
                    </label>
                    <select
                      value={selectedWorkoutId}
                      onChange={(e) => setSelectedWorkoutId(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400"
                      required
                    >
                      <option value="">Choose a template…</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {templates.length === 0 && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Create a workout in the{" "}
                        <span className="font-semibold">Workouts</span> tab
                        first.
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!selectedWorkoutId}
                  className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-semibold py-2.5 text-sm transition transform hover:-translate-y-[1px] active:translate-y-0 shadow-lg shadow-emerald-500/30"
                >
                  Log workout
                </button>
              </form>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Logs for {selectedDate}
                </h3>
                {selectedDateLogs.length > 0 && (
                  <button
                    onClick={() => handleClearLogsForDate(selectedDate)}
                    className="text-[11px] text-slate-400 hover:text-red-400 transition"
                  >
                    Clear this day
                  </button>
                )}
              </div>
              {selectedDateLogs.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No workouts logged for this date yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedDateLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm space-y-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{log.workoutName}</p>
                        <span className="text-[11px] text-slate-400 font-mono">
                          #{log.id.slice(0, 6)}
                        </span>
                      </div>
                      {log.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="rounded-2xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-xs mb-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-100">
                              {ex.name}
                            </p>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddSetToLoggedExercise(
                                    log.id,
                                    ex.id
                                  )
                                }
                                className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100"
                              >
                                + Set
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveLastSetFromLoggedExercise(
                                    log.id,
                                    ex.id
                                  )
                                }
                                className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400"
                              >
                                - Set
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-[auto,1fr,1fr] gap-2 items-center text-[11px]">
                            <span className="text-slate-400">Set</span>
                            <span className="text-slate-400">Reps</span>
                            <span className="text-slate-400">
                              Weight (kg)
                            </span>
                            {ex.sets.map((set) => (
                              <FragmentRow
                                key={set.id}
                                logId={log.id}
                                exerciseId={ex.id}
                                setData={set}
                                onChange={handleUpdateSetInLog}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats panel */}
          <div className="space-y-6">
            {/* Global stats */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
              <h2 className="text-lg font-semibold mb-4">Overview</h2>
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <StatCard
                  label="Training days"
                  value={trainingDaysCount}
                  hint="Days with at least one logged workout"
                />
                <StatCard
                  label="Total workouts"
                  value={totalWorkoutsLogged}
                  hint="All logged sessions"
                />
                <StatCard
                  label="Distinct exercises"
                  value={distinctExercisesCount}
                  hint="Unique exercise names"
                />
                <StatCard
                  label="Current streak"
                  value={currentStreak}
                  hint="Consecutive days including today"
                />
                <StatCard
                  label="Best streak"
                  value={bestStreak}
                  hint="Longest streak of consecutive days"
                />
              </div>
            </div>

            {/* Muscle group stats */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
              <h2 className="text-lg font-semibold mb-4">
                Muscle groups
              </h2>
              {muscleGroupStats.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Assign muscle groups to exercises in the{" "}
                  <span className="font-semibold">Workouts</span> tab to
                  see which areas you train most.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs sm:text-sm">
                  {muscleGroupStats.map((g) => (
                    <div
                      key={g.group}
                      className="flex items-center justify-between rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{g.group}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {g.days} day{g.days === 1 ? "" : "s"} • {g.sets}{" "}
                          sets • {g.reps} reps
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Volume:{" "}
                        <span className="font-mono">
                          {Math.round(g.volume)}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exercise stats + PRs + charts */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-semibold">
                  Exercise stats & volume
                </h2>
                <select
                  value={selectedExerciseForStats}
                  onChange={(e) =>
                    setSelectedExerciseForStats(e.target.value)
                  }
                  className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400 max-w-[200px]"
                >
                  <option value="">Select exercise…</option>
                  {allExerciseNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedExerciseForStats || !exerciseStats ? (
                <p className="text-sm text-slate-400">
                  Select an exercise to see lifetime stats, PRs and
                  volume charts. For bodyweight moves, volume is based on
                  total reps.
                </p>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-slate-300 font-medium">
                      {selectedExerciseForStats}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Across all workouts where this exercise appears.
                    </p>
                  </div>

                  {/* basic stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <StatSubCard
                      label="Sessions"
                      value={exerciseStats.sessions}
                      hint="Workouts containing this exercise"
                    />
                    <StatSubCard
                      label="Days trained"
                      value={exerciseStats.daysTrained}
                      hint="Unique dates with this exercise"
                    />
                    <StatSubCard
                      label="Total sets"
                      value={exerciseStats.totalSets}
                    />
                    <StatSubCard
                      label="Total reps"
                      value={exerciseStats.totalReps}
                    />
                    <StatSubCard
                      label="Total volume"
                      value={Math.round(exerciseStats.totalVolume)}
                      hint={
                        exercisePRs?.isWeighted
                          ? "Σ (weight × reps)"
                          : "Σ reps (bodyweight)"
                      }
                    />
                  </div>

                  {/* PRs */}
                  {exercisePRs && (
                    <div className="grid grid-cols-2 gap-3 text-[11px] sm:text-xs">
                      <div className="rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2">
                        <p className="text-slate-400 mb-1">
                          PRs (all-time)
                        </p>
                        <ul className="space-y-1">
                          <li>
                            <span className="text-slate-400">
                              Heaviest:
                            </span>{" "}
                            {exercisePRs.isWeighted &&
                            exercisePRs.heaviest ? (
                              <>
                                {exercisePRs.heaviest.weight.toFixed(1)}{" "}
                                kg × {exercisePRs.heaviest.reps}
                              </>
                            ) : (
                              "Bodyweight"
                            )}
                          </li>
                          <li>
                            <span className="text-slate-400">
                              Most reps (single set):
                            </span>{" "}
                            {exercisePRs.bestReps?.reps ?? 0}
                          </li>
                          <li>
                            <span className="text-slate-400">
                              Biggest set volume:
                            </span>{" "}
                            {exercisePRs.bestVolume
                              ? Math.round(
                                  exercisePRs.bestVolume.volume
                                )
                              : 0}{" "}
                            {exercisePRs.isWeighted
                              ? "kg·reps"
                              : "reps"}
                          </li>
                          {exercisePRs.isWeighted &&
                            exercisePRs.best1RM && (
                              <li>
                                <span className="text-slate-400">
                                  Best est. 1RM:
                                </span>{" "}
                                {exercisePRs.best1RM.oneRM.toFixed(1)} kg
                              </li>
                            )}
                        </ul>
                      </div>
                      <div className="rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2">
                        <p className="text-slate-400 mb-1">Type</p>
                        <p className="text-sm">
                          {exercisePRs.isWeighted
                            ? "Weighted exercise"
                            : "Bodyweight / calisthenics"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          For bodyweight moves we treat volume as total
                          reps and track your best sets over time.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Daily volume */}
                  {exerciseVolumeByDate.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-400 mb-1">
                        Daily volume
                      </p>
                      <div className="h-32">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <LineChart data={exerciseVolumeByDate}>
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10, fill: "#cbd5f5" }}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#cbd5f5" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#020617",
                                borderColor: "#1e293b",
                                fontSize: 11,
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="volume"
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* 1RM or best reps */}
                  {exercisePRs?.isWeighted &&
                    exercise1RMByDate.length > 0 && (
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">
                          Estimated 1RM over time
                        </p>
                        <div className="h-32">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                          >
                            <LineChart data={exercise1RMByDate}>
                              <XAxis
                                dataKey="date"
                                tick={{
                                  fontSize: 10,
                                  fill: "#cbd5f5",
                                }}
                              />
                              <YAxis
                                tick={{
                                  fontSize: 10,
                                  fill: "#cbd5f5",
                                }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#020617",
                                  borderColor: "#1e293b",
                                  fontSize: 11,
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="oneRM"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  {!exercisePRs?.isWeighted &&
                    exerciseBestRepsByDate.length > 0 && (
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">
                          Best reps per day (bodyweight)
                        </p>
                        <div className="h-32">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                          >
                            <LineChart data={exerciseBestRepsByDate}>
                              <XAxis
                                dataKey="date"
                                tick={{
                                  fontSize: 10,
                                  fill: "#cbd5f5",
                                }}
                              />
                              <YAxis
                                tick={{
                                  fontSize: 10,
                                  fill: "#cbd5f5",
                                }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#020617",
                                  borderColor: "#1e293b",
                                  fontSize: 11,
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="reps"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  {/* Weekly volume */}
                  {exerciseWeeklyStats.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-400 mb-1">
                        Weekly volume
                      </p>
                      <div className="h-32">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <LineChart data={exerciseWeeklyStats}>
                            <XAxis
                              dataKey="weekStart"
                              tick={{
                                fontSize: 10,
                                fill: "#cbd5f5",
                              }}
                            />
                            <YAxis
                              tick={{
                                fontSize: 10,
                                fill: "#cbd5f5",
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#020617",
                                borderColor: "#1e293b",
                                fontSize: 11,
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="volume"
                              stroke="#a855f7"
                              strokeWidth={2}
                              dot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                    <p>
                      First seen:{" "}
                      <span className="font-mono">
                        {exerciseStats.firstDate}
                      </span>
                    </p>
                    <p>
                      Last seen:{" "}
                      <span className="font-mono">
                        {exerciseStats.lastDate}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Heatmap */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
              <h2 className="text-lg font-semibold mb-3">
                Training heatmap (last 60 days)
              </h2>
              {heatmapDays.every((d) => d.intensity === 0) ? (
                <p className="text-sm text-slate-400">
                  No training recorded yet. As you log sessions, days will
                  light up here.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-[3px] mt-2">
                    {heatmapDays.map((d) => (
                      <div
                        key={d.date}
                        className={`w-3 h-3 rounded-sm border ${getHeatmapClass(
                          d.intensity,
                          maxHeatmapIntensity
                        )}`}
                        title={`${d.date}: ${Math.round(
                          d.intensity
                        )} volume`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Darker squares = higher training volume that day
                    (weighted volume or total reps for bodyweight).
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === "calendar" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Calendar</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Jump to date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={handleChangeSelectedDate}
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>
          </div>

          {sortedDates.length === 0 ? (
            <p className="text-sm text-slate-400">
              No workouts logged yet. Log something in the{" "}
              <span className="font-semibold">Overview</span> tab.
            </p>
          ) : (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {sortedDates.map((date) => (
                <div key={date} className="border-l border-slate-800 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-300">
                      {date}
                    </p>
                    <button
                      onClick={() => handleClearLogsForDate(date)}
                      className="text-[11px] text-slate-400 hover:text-red-400 transition"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {logsByDate[date].map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-slate-100">
                            {log.workoutName}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            #{log.id.slice(0, 6)}
                          </span>
                        </div>
                        <ul className="text-[11px] text-slate-300 space-y-0.5">
                          {log.exercises.map((ex) => (
                            <li key={ex.id}>
                              <span className="font-medium">
                                {ex.name}
                              </span>{" "}
                              —{" "}
                              {ex.sets
                                .map(
                                  (s) =>
                                    `${s.reps} @ ${s.weight.toFixed(
                                      1
                                    )}kg`
                                )
                                .join(", ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKOUTS VIEW */}
      {view === "workouts" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Workout builder / editor */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingTemplateId ? "Edit workout" : "Workout builder"}
              </h2>
              {editingTemplateId && (
                <button
                  type="button"
                  onClick={resetBuilder}
                  className="text-[11px] text-slate-400 hover:text-sky-400 transition"
                >
                  Cancel edit
                </button>
              )}
            </div>
            <form
              className="space-y-5"
              onSubmit={handleCreateOrUpdateTemplate}
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Workout name
                </label>
                <input
                  type="text"
                  placeholder="Push Day, Lower, Full Body..."
                  value={newWorkoutName}
                  onChange={(e) => setNewWorkoutName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Warm-up, RPE targets, tempo notes..."
                  value={newWorkoutDescription}
                  onChange={(e) =>
                    setNewWorkoutDescription(e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-300">
                    Exercises
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {builderExercises.length} added
                  </span>
                </div>

                {/* Add exercise row */}
                <div className="grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_auto] gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Pull-ups"
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newExerciseSets}
                    onChange={(e) => setNewExerciseSets(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
                    placeholder="Sets"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newExerciseReps}
                    onChange={(e) => setNewExerciseReps(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
                    placeholder="Reps"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={newExerciseWeight}
                    onChange={(e) =>
                      setNewExerciseWeight(e.target.value)
                    }
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
                    placeholder="Weight (kg, optional)"
                  />
                  <button
                    onClick={handleAddExerciseToBuilder}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-100 transition"
                    type="button"
                  >
                    Add
                  </button>
                </div>

                {/* Existing exercises in builder */}
                {builderExercises.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                    {builderExercises.map((ex, index) => (
                      <div
                        key={ex.id}
                        className="rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">
                            {index + 1}. {ex.name}
                          </p>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleMoveExercise(ex.id, "up")
                              }
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px]"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMoveExercise(ex.id, "down")
                              }
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px]"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveExerciseFromBuilder(ex.id)
                              }
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] text-red-400"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <p className="text-[10px] text-slate-400">
                              Sets
                            </p>
                            <input
                              type="number"
                              min={1}
                              value={ex.sets}
                              onChange={(e) =>
                                handleEditBuilderExerciseField(
                                  ex.id,
                                  "sets",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px]"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400">
                              Reps
                            </p>
                            <input
                              type="number"
                              min={1}
                              value={ex.reps}
                              onChange={(e) =>
                                handleEditBuilderExerciseField(
                                  ex.id,
                                  "reps",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px]"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400">
                              Weight (kg)
                            </p>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={
                                ex.weight !== undefined ? ex.weight : ""
                              }
                              onChange={(e) =>
                                handleEditBuilderExerciseField(
                                  ex.id,
                                  "weight",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px]"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400">
                              Muscle group
                            </p>
                            <select
                              value={ex.muscleGroup ?? "Other"}
                              onChange={(e) =>
                                handleEditBuilderExerciseField(
                                  ex.id,
                                  "muscleGroup",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px]"
                            >
                              {MUSCLE_GROUPS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 text-sm transition transform hover:-translate-y-[1px] active:translate-y-0 shadow-lg shadow-emerald-500/30"
              >
                {editingTemplateId
                  ? "Save changes"
                  : "Save workout template"}
              </button>
            </form>
          </div>

          {/* List of templates */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
            <h2 className="text-lg font-semibold mb-4">
              Your workouts
            </h2>
            {templates.length === 0 ? (
              <p className="text-sm text-slate-400">
                No workouts yet. Build one on the left.
              </p>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        {t.description && (
                          <p className="text-xs text-slate-300 mt-1 whitespace-pre-line">
                            {t.description}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          Created{" "}
                          {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedWorkoutId(t.id);
                            setView("overview");
                            setSelectedDate(todayDate);
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                        >
                          Use today
                        </button>
                        <button
                          onClick={() => handleStartEditTemplate(t)}
                          className="text-[11px] text-sky-400 hover:text-sky-300 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="text-[11px] text-slate-400 hover:text-red-400 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {t.exercises.length > 0 && (
                      <ul className="mt-3 text-xs text-slate-300 space-y-1">
                        {t.exercises.map((ex, index) => (
                          <li key={ex.id}>
                            {index + 1}.{" "}
                            <span className="font-medium">{ex.name}</span>{" "}
                            — {ex.sets} x {ex.reps}
                            {ex.weight !== undefined &&
                              ` @ ${ex.weight}kg`}
                            {ex.muscleGroup && (
                              <span className="text-[10px] text-slate-400">
                                {" "}
                                • {ex.muscleGroup}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default App;