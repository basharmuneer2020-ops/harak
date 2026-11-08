import Dexie, { type Table } from "dexie";
import type {
  CardioLog,
  Exercise,
  ExerciseState,
  Mesocycle,
  Profile,
  SessionLog,
} from "../types";

export interface ProfileRow extends Profile {
  id: "me";
}

export interface MetaRow {
  key: string;
  value: unknown;
}

/** قاعدة IndexedDB المحلية — كل بيانات المستخدم تبقى على جهازه */
export class HarakDB extends Dexie {
  profile!: Table<ProfileRow, string>;
  mesocycles!: Table<Mesocycle, string>;
  sessions!: Table<SessionLog, string>;
  states!: Table<ExerciseState, string>;
  cardio!: Table<CardioLog, string>;
  customExercises!: Table<Exercise, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = "harak") {
    super(name);
    this.version(1).stores({
      profile: "id",
      mesocycles: "id, createdAt",
      sessions: "id, startedAt, mesocycleId",
      states: "exerciseId",
      cardio: "id, ts",
      customExercises: "id",
      meta: "key",
    });
  }
}
