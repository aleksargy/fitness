import React, { useEffect, useMemo, useState } from "react";
import type { WorkoutDraft } from "./types";
import { loadActiveWorkout, saveActiveWorkout, clearActiveWorkout } from "./activeStorage";
import { uid } from "./utils";
import { TrainTab } from "../features/workout/tabs/TrainTab";
import { TemplatesTab } from "../features/workout/tabs/TemplatesTab";
import { CalendarTab } from "../features/workout/tabs/CalendarTab";
import { StatsTab } from "../features/workout/tabs/StatsTab";

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
    <div className="min-h-screen bg-[#0F1115] text-white">
      {/* background glow: subtle forest */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),rgba(0,0,0,0))] blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-150px] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),rgba(0,0,0,0))] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-6">
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

        {tab === "calendar" && <CalendarTab onStartNew={() => setTab("train")} />}
    
        {tab === "stats" && <StatsTab/>}

      </div>

      {/* bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto max-w-3xl px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <div className="grid grid-cols-4 gap-2">
              <NavBtn active={tab === "train"} onClick={() => setTab("train")}>
                Train
              </NavBtn>
              <NavBtn active={tab === "templates"} onClick={() => setTab("templates")}>
                Templates
              </NavBtn>
              <NavBtn active={tab === "calendar"} onClick={() => setTab("calendar")}>
                Calendar
              </NavBtn>
              <NavBtn active={tab === "stats"} onClick={() => setTab("stats")}>
                Stats
              </NavBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl px-3 py-3 text-sm font-medium transition active:scale-[0.99] border",
        active
          ? "bg-white/10 border-white/20 text-white"
          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
