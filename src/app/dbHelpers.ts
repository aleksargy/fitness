import { db } from "./db";
import type { Session, Template, WorkoutDraft, ExerciseEntry } from "./types";
import { uid, yyyyMmDd } from "./utils";
import type { CustomMovement } from "./types";

export async function listTemplates() {
  return db.templates.orderBy("createdAt").reverse().toArray();
}

export async function saveTemplateFromWorkout(workout: WorkoutDraft, name: string) {
  const tpl: Template = {
    id: crypto.randomUUID?.() ?? uid(),
    name,
    createdAt: new Date().toISOString(),
    exercises: workout.exercises.map((ex) => ({
      id: crypto.randomUUID?.() ?? uid(),
      movementId: ex.movementId,
      name: ex.name,
      notes: ex.notes ?? "",
    })),
  };
  await db.templates.put(tpl);
  return tpl;
}

export async function deleteTemplate(id: string) {
  await db.templates.delete(id);
}

export function workoutFromTemplate(tpl: Template): WorkoutDraft {
  return {
    id: crypto.randomUUID?.() ?? uid(),
    title: tpl.name,
    status: "idle",
    startedAt: null,
    elapsedMs: 0,
    exercises: tpl.exercises.map((ex) => ({
      id: crypto.randomUUID?.() ?? uid(),
      movementId: ex.movementId,
      name: ex.name,
      notes: ex.notes ?? "",
      load: { mode: "bodyweight", addKg: "" },
      sets: [
      ],
    })),
  };
}

export async function saveSessionFromWorkout(workout: WorkoutDraft) {
  const now = new Date();
  const endedAt = now.toISOString();
  const startedAt =
    workout.startedAt != null ? new Date(workout.startedAt).toISOString() : new Date(now.getTime() - workout.elapsedMs).toISOString();

  const session: Session = {
    id: crypto.randomUUID?.() ?? uid(),
    date: yyyyMmDd(now),
    title: workout.title,
    startedAt,
    endedAt,
    elapsedMs: workout.elapsedMs,
    exercises: workout.exercises,
  };
  await db.sessions.put(session);
  return session;
}

export async function listSessionsNewestFirst() {
  return db.sessions.orderBy("date").reverse().toArray();
}

export type LastPerformance = {
  date: string;
  exercise: ExerciseEntry;
};

export async function getLastPerformance(movementId: string): Promise<LastPerformance | null> {
  const sessions = await db.sessions.orderBy("date").reverse().toArray();
  for (const s of sessions) {
    const ex = s.exercises.find((e) => e.movementId === movementId);
    if (ex) return { date: s.date, exercise: ex };
  }
  return null;
}

export async function deleteSession(id: string) {
  await db.sessions.delete(id);
}

export async function listCustomMovements() {
  return db.movements.orderBy("createdAt").reverse().toArray();
}

export async function addCustomMovement(input: {
  name: string;
  category: CustomMovement["category"];
  image?: string;
}) {
  const m: CustomMovement = {
    id: `custom_${crypto.randomUUID?.() ?? uid()}`,
    name: input.name.trim(),
    category: input.category,
    image: input.image?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  await db.movements.put(m);
  return m;
}

export async function deleteCustomMovement(id: string) {
  await db.movements.delete(id);
}
