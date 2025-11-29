import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type View = "overview" | "calendar" | "workouts";

type WorkoutExerciseTemplate = {
  id: string;
  name: string;
  sets: number;
  reps: number;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  exercises: WorkoutExerciseTemplate[];
};

type WorkoutExerciseLog = {
  id: string;
  name: string;
  sets: number;
  reps: number;
};

type WorkoutLog = {
  id: string;
  date: string; // YYYY-MM-DD
  workoutId: string | null;
  workoutName: string;
  exercises: WorkoutExerciseLog[];
};

const STORAGE_KEY_TEMPLATES = "fitlog-v2-workout-templates";
const STORAGE_KEY_LOGS = "fitlog-v2-workout-logs";

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

  // Workout builder state
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [newWorkoutDescription, setNewWorkoutDescription] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseSets, setNewExerciseSets] = useState("3");
  const [newExerciseReps, setNewExerciseReps] = useState("10");
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
  
  // Flattened exercise entries across all logs for stats
  const allExerciseEntries = useMemo(
    () =>
      logs.flatMap((log) =>
        log.exercises.map((ex) => ({
          exerciseName: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          date: log.date,
          logId: log.id,
        }))
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

  // Exercise-specific stats
  const exerciseStats = useMemo(() => {
    if (!selectedExerciseEntries.length) {
      return null;
    }
    const sessions = new Set(
      selectedExerciseEntries.map((e) => e.logId)
    ).size;

    let totalSets = 0;
    let totalReps = 0;
    const dates = new Set<string>();

    for (const e of selectedExerciseEntries) {
      totalSets += e.sets;
      totalReps += e.sets * e.reps;
      dates.add(e.date);
    }

    const sortedDates = Array.from(dates).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      sessions,
      totalSets,
      totalReps,
      daysTrained: dates.size,
      firstDate: sortedDates[0],
      lastDate: sortedDates[sortedDates.length - 1],
    };
  }, [selectedExerciseEntries]);

  // Calendar view: date -> logs
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

  // ---- Handlers ----
  const handleAddExerciseToBuilder = (e: FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    const sets = Number(newExerciseSets) || 0;
    const reps = Number(newExerciseReps) || 0;
    if (sets <= 0 || reps <= 0) return;

    const newEx: WorkoutExerciseTemplate = {
      id: crypto.randomUUID(),
      name: newExerciseName.trim(),
      sets,
      reps,
    };

    setBuilderExercises((prev) => [...prev, newEx]);
    setNewExerciseName("");
    setNewExerciseSets("3");
    setNewExerciseReps("10");
  };

  const handleRemoveExerciseFromBuilder = (id: string) => {
    setBuilderExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleCreateTemplate = (e: FormEvent) => {
    e.preventDefault();
    if (!newWorkoutName.trim()) return;
    if (builderExercises.length === 0) {
      alert("Add at least one exercise to the workout.");
      return;
    }

    const newTemplate: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name: newWorkoutName.trim(),
      description: newWorkoutDescription.trim() || undefined,
      createdAt: new Date().toISOString(),
      exercises: builderExercises,
    };

    setTemplates((prev) => [newTemplate, ...prev]);
    setNewWorkoutName("");
    setNewWorkoutDescription("");
    setBuilderExercises([]);
    setSelectedWorkoutId(newTemplate.id);
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

  const handleLogWorkout = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWorkoutId) return;

    const template = templates.find((t) => t.id === selectedWorkoutId);
    if (!template) return;

    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      date: selectedDate,
      workoutId: template.id,
      workoutName: template.name,
      exercises: template.exercises.map((ex) => ({
        id: crypto.randomUUID(),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
      })),
    };

    setLogs((prev) => [newLog, ...prev]);
  };

  const handleClearLogsForDate = (date: string) => {
    if (!confirm(`Clear all logs for ${date}?`)) return;
    setLogs((prev) => prev.filter((l) => l.date !== date));
  };

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
              Build structured workouts, log your sessions, and track your
              training over time.
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
                      onChange={(e) => setSelectedDate(e.target.value)}
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
                <div className="space-y-3">
                  {selectedDateLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-medium">{log.workoutName}</p>
                        <span className="text-[11px] text-slate-400 font-mono">
                          #{log.id.slice(0, 6)}
                        </span>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {log.exercises.map((ex) => (
                          <li key={ex.id}>
                            <span className="font-medium">{ex.name}</span>{" "}
                            — {ex.sets} x {ex.reps}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats panel */}
          <div className="space-y-6">
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

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-semibold">
                  Exercise stats
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
                  Select an exercise to see lifetime stats. Exercises are
                  pulled from the workouts you log.
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
                  </div>
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
                onChange={(e) => setSelectedDate(e.target.value)}
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
                              {ex.name} — {ex.sets} x {ex.reps}
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
          {/* Workout builder */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg shadow-slate-950/50">
            <h2 className="text-lg font-semibold mb-4">
              Workout builder
            </h2>
            <form className="space-y-5" onSubmit={handleCreateTemplate}>
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

                <div className="grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Bench press"
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
                  <button
                    onClick={handleAddExerciseToBuilder}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-100 transition"
                    type="button"
                  >
                    Add
                  </button>
                </div>

                {builderExercises.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                    {builderExercises.map((ex, index) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="font-medium">
                            {index + 1}. {ex.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ex.sets} x {ex.reps}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveExerciseFromBuilder(ex.id)
                          }
                          className="text-[11px] text-slate-400 hover:text-red-400 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 text-sm transition transform hover:-translate-y-[1px] active:translate-y-0 shadow-lg shadow-emerald-500/30"
              >
                Save workout template
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

// ---- Small stat card components ----
type StatCardProps = {
  label: string;
  value: number;
  hint?: string;
};

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 shadow-sm shadow-slate-950/40">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {hint && (
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
          {hint}
        </p>
      )}
    </div>
  );
}

type StatSubCardProps = {
  label: string;
  value: number;
  hint?: string;
};

function StatSubCard({ label, value, hint }: StatSubCardProps) {
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

// ---- Streak helper ----
function calculateStreak(dates: string[]) {
  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const uniqueDates = Array.from(new Set(dates)).sort();
  const dayNumbers = uniqueDates.map((d) =>
    Math.floor(new Date(d + "T00:00:00").getTime() / 86400000)
  );

  let bestStreak = 1;
  let current = 1;

  for (let i = 1; i < dayNumbers.length; i++) {
    if (dayNumbers[i] === dayNumbers[i - 1] + 1) {
      current += 1;
      bestStreak = Math.max(bestStreak, current);
    } else {
      current = 1;
    }
  }

  const todayNum = Math.floor(
    new Date().setHours(0, 0, 0, 0) / 86400000
  );
  const dateSet = new Set(dayNumbers);

  let currentStreak = 0;
  let day = todayNum;
  while (dateSet.has(day)) {
    currentStreak += 1;
    day -= 1;
  }

  return { currentStreak, bestStreak };
}

export default App;

