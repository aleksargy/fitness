import type { WorkoutDraft } from "./types";

const KEY = "active_workout_v2";

export function loadActiveWorkout(): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkoutDraft) : null;
  } catch {
    return null;
  }
}

export function saveActiveWorkout(w: WorkoutDraft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    // ignore
  }
}

export function clearActiveWorkout() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
