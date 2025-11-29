// src/types/training.ts

export type View = "overview" | "calendar" | "workouts";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Quads"
  | "Hamstrings"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Glutes"
  | "Full body"
  | "Other";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Quads",
  "Hamstrings",
  "Shoulders",
  "Arms",
  "Core",
  "Glutes",
  "Full body",
  "Other",
];

export type WorkoutExerciseTemplate = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number; // default weight per set (kg). For bodyweight leave empty.
  muscleGroup?: MuscleGroup;
};

export type ExerciseSetLog = {
  id: string;
  setIndex: number;
  reps: number;
  weight: number; // 0 for pure bodyweight
};

export type WorkoutExerciseLog = {
  id: string;
  name: string;
  sets: ExerciseSetLog[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  exercises: WorkoutExerciseTemplate[];
};

export type WorkoutLog = {
  id: string;
  date: string; // YYYY-MM-DD
  workoutId: string | null;
  workoutName: string;
  exercises: WorkoutExerciseLog[];
};
