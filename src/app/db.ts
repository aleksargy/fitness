import Dexie from "dexie";
import type { Table } from "dexie";
import type { Template, Session } from "./types";

class WorkoutDB extends Dexie {
  templates!: Table<Template, string>;
  sessions!: Table<Session, string>;

  constructor() {
    super("workoutDB");
    this.version(1).stores({
      templates: "id, name, createdAt",
      sessions: "id, date, startedAt",
    });
  }
}

export const db = new WorkoutDB();
