import React, { useEffect, useMemo, useState } from "react";
import type { WorkoutDraft } from "./types";
import { loadActiveWorkout, saveActiveWorkout, clearActiveWorkout } from "./activeStorage";
import { uid } from "./utils";
import { TrainTab } from "../features/workout/tabs/TrainTab";
import { TemplatesTab } from "../features/workout/tabs/TemplatesTab";
import { CalendarTab } from "../features/workout/tabs/CalendarTab";
import { StatsTab } from "../features/workout/tabs/StatsTab";
import { Dumbbell, LayoutGrid, CalendarDays, BarChart3 } from "lucide-react";

type Tab = "train" | "templates" | "calendar" | "stats";

function newEmptyWorkout(): WorkoutDraft {
  return {
    id: uid(),
    title: "Workout",
    status: "idle",
    startedAt: null,
    elapsedMs: 0,
    exercises: [],
  };
}

function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function Home() {
  const [tab, setTab] = useState<Tab>("train");

  const [activeWorkout, setActiveWorkout] = useState<WorkoutDraft>(() => {
    return loadActiveWorkout() ?? newEmptyWorkout();
  });

  // save active workout continuously
  useEffect(() => {
    saveActiveWorkout(activeWorkout);
  }, [activeWorkout]);

  const [historyBump, setHistoryBump] = useState(0); // used to refresh "last time" hints after finishing

  const finishAndClear = useMemo(() => {
    return async () => {
      // TrainTab will call save session itself, then call this.
      clearActiveWorkout();
      setActiveWorkout(newEmptyWorkout());
      setTab("calendar");
      setHistoryBump((x) => x + 1);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1117] via-[#0b0e13] to-[#05070b] text-white">
      {/* background glow: subtle forest */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-[-150px] right-[-100px] h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),rgba(0,0,0,0))] blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-150px] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),rgba(0,0,0,0))] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pb-32 pt-6">
        {tab === "train" && (
          <TrainTab
            workout={activeWorkout}
            setWorkout={setActiveWorkout}
            onGoTemplates={() => setTab("templates")}
            onFinishedCleared={finishAndClear}
            historyBump={historyBump}
          />
        )}

        {tab === "templates" && (
          <TemplatesTab
            onStartFromTemplate={(w) => {
              setActiveWorkout(w);
              setTab("train");
            }}
            onBack={() => setTab("train")}
          />
        )}

        {tab === "calendar" && <CalendarTab />}

        {tab === "stats" && <StatsTab />}

      </div>

      {/* bottom nav */}
      <div className="fixed inset-x-0 bottom-0.5 z-40">
        <div className="mx-auto max-w-3xl px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-2 shadow-[0_10px_35px_rgba(0,0,0,0.55)]">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <NavBtn
                active={tab === "train"}
                label="Train"
                icon={Dumbbell}
                onClick={() => setTab("train")}
              />
              <NavBtn
                active={tab === "templates"}
                label="Templates"
                icon={LayoutGrid}
                onClick={() => setTab("templates")}
              />
              <NavBtn
                active={tab === "calendar"}
                label="Calendar"
                icon={CalendarDays}
                onClick={() => setTab("calendar")}
              />
              <NavBtn
                active={tab === "stats"}
                label="Stats"
                icon={BarChart3}
                onClick={() => setTab("stats")}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 transition-all duration-150 active:scale-[0.98]",
        "min-w-0", // allow truncate
        active
          ? "border-white/20 bg-white/12 text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {/* icon */}
      <Icon
        className={cn(
          "h-5 w-5 transition-transform duration-150",
          active ? "scale-105" : "group-hover:scale-105"
        )}
      />

      {/* label */}
      <span
        className={cn(
          "w-full truncate text-center text-[11px] font-medium leading-none",
          active ? "text-white" : "text-white/70"
        )}
      >
        {label}
      </span>

      {/* active indicator */}
      <span
        className={cn(
          "mt-1 h-1 w-6 rounded-full transition-opacity",
          active ? "bg-white/40 opacity-100" : "bg-white/20 opacity-0 group-hover:opacity-60"
        )}
      />
    </button>
  );
}

