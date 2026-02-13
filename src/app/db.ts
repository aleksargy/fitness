import Dexie from "dexie";
import type { Table } from "dexie";
import type { Template, Session, CustomMovement } from "./types";

class WorkoutDB extends Dexie {
  templates!: Table<Template, string>;
  sessions!: Table<Session, string>;
  movements!: Table<CustomMovement, string>;

  constructor() {
    super("workoutDB");

    // v1 (old)
    this.version(1).stores({
      templates: "id, name, createdAt",
      sessions: "id, date, startedAt",
    });

    // v2 (new) - add movements table
    this.version(2).stores({
      templates: "id, name, createdAt",
      sessions: "id, date, startedAt",
      movements: "id, name, category, createdAt",
    });
  }
}

export const db = new WorkoutDB();
