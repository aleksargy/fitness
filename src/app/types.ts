export type SetRow = {
  id: string;
  reps: number | "";
  addKg: number | "";
  done: boolean;
};

export type ExerciseEntry = {
  id: string;
  movementId: string;
  name: string;
  notes: string;
  sets: SetRow[];
};

export type WorkoutDraft = {
  id: string;
  title: string;
  status: "idle" | "running" | "paused";
  startedAt: number | null;
  elapsedMs: number;
  exercises: ExerciseEntry[];
};

export type Template = {
  id: string;
  name: string;
  createdAt: string; // ISO
  exercises: Array<{
    id: string;
    movementId: string;
    name: string;
    notes: string;
  }>;
};

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  startedAt: string; // ISO
  endedAt: string; // ISO
  elapsedMs: number;
  exercises: ExerciseEntry[];
};

export type CustomMovement = {
  id: string; // "custom_<uid>"
  name: string;
  category: "Pull" | "Push" | "Legs" | "Core";
  image?: string; // optional (URL or /public path)
  createdAt: string; // ISO
};