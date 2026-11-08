import type {
  CardioLog,
  Exercise,
  ExerciseState,
  Mesocycle,
  Meta,
  Profile,
  SessionLog,
} from "../types";
import { HarakDB } from "./db";

/** لقطة كاملة من بيانات المستخدم في الذاكرة */
export interface Snapshot {
  profile: Profile | null;
  mesocycles: Mesocycle[];
  sessions: SessionLog[];
  states: ExerciseState[];
  cardio: CardioLog[];
  customExercises: Exercise[];
  meta: Meta;
}

export const EMPTY_SNAPSHOT: Snapshot = {
  profile: null,
  mesocycles: [],
  sessions: [],
  states: [],
  cardio: [],
  customExercises: [],
  meta: {},
};

/**
 * طبقة المستودع الوحيدة بين الواجهة والتخزين (Dexie).
 * الواجهة لا تلمس IndexedDB مباشرة.
 */
export function createRepo(db: HarakDB) {
  return {
    db,

    async loadAll(): Promise<Snapshot> {
      const [
        profileRow,
        mesocycles,
        sessions,
        states,
        cardio,
        custom,
        metaRows,
      ] = await Promise.all([
        db.profile.get("me"),
        db.mesocycles.orderBy("createdAt").toArray(),
        db.sessions.orderBy("startedAt").toArray(),
        db.states.toArray(),
        db.cardio.orderBy("ts").toArray(),
        db.customExercises.toArray(),
        db.meta.toArray(),
      ]);
      let profile: Profile | null = null;
      if (profileRow) {
        const { id: _id, ...rest } = profileRow;
        profile = rest;
      }
      const meta: Meta = {};
      for (const row of metaRows) {
        (meta as Record<string, unknown>)[row.key] = row.value;
      }
      return {
        profile,
        mesocycles,
        sessions,
        states,
        cardio,
        customExercises: custom,
        meta,
      };
    },

    saveProfile: (p: Profile) => db.profile.put({ ...p, id: "me" }),
    putMesocycle: (m: Mesocycle) => db.mesocycles.put(m),
    deleteMesocycle: (id: string) => db.mesocycles.delete(id),
    putSession: (s: SessionLog) => db.sessions.put(s),
    deleteSession: (id: string) => db.sessions.delete(id),
    putStates: (list: ExerciseState[]) => db.states.bulkPut(list),
    putCardio: (c: CardioLog) => db.cardio.put(c),
    deleteCardio: (id: string) => db.cardio.delete(id),
    putCustomExercise: (e: Exercise) => db.customExercises.put(e),
    deleteCustomExercise: (id: string) => db.customExercises.delete(id),

    async setMeta(patch: Partial<Meta>): Promise<void> {
      const rows = Object.entries(patch).map(([key, value]) => ({
        key,
        value,
      }));
      await db.meta.bulkPut(rows);
    },

    /** يكتب لقطةً كاملة بدل الموجود (يُستخدم في الاستيراد بعد الدمج) */
    async replaceAll(snap: Snapshot): Promise<void> {
      await db.transaction(
        "rw",
        [
          db.profile,
          db.mesocycles,
          db.sessions,
          db.states,
          db.cardio,
          db.customExercises,
          db.meta,
        ],
        async () => {
          await Promise.all([
            db.profile.clear(),
            db.mesocycles.clear(),
            db.sessions.clear(),
            db.states.clear(),
            db.cardio.clear(),
            db.customExercises.clear(),
            db.meta.clear(),
          ]);
          if (snap.profile) await db.profile.put({ ...snap.profile, id: "me" });
          await db.mesocycles.bulkPut(snap.mesocycles);
          await db.sessions.bulkPut(snap.sessions);
          await db.states.bulkPut(snap.states);
          await db.cardio.bulkPut(snap.cardio);
          await db.customExercises.bulkPut(snap.customExercises);
          await db.meta.bulkPut(
            Object.entries(snap.meta).map(([key, value]) => ({ key, value })),
          );
        },
      );
    },

    async clearAll(): Promise<void> {
      await this.replaceAll(EMPTY_SNAPSHOT);
    },
  };
}

export type Repo = ReturnType<typeof createRepo>;
