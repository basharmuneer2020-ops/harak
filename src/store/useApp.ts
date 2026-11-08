import { create } from "zustand";
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
import { createRepo, EMPTY_SNAPSHOT, type Repo, type Snapshot } from "./repo";

let repo: Repo | null = null;
function getRepo(): Repo {
  if (!repo) repo = createRepo(new HarakDB());
  return repo;
}

function upsert<T>(list: T[], item: T, key: (x: T) => string): T[] {
  const k = key(item);
  const i = list.findIndex((x) => key(x) === k);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

export interface AppStore extends Snapshot {
  ready: boolean;
  error: string | null;
  init(): Promise<void>;

  saveProfile(p: Profile): Promise<void>;
  setMeta(patch: Partial<Meta>): Promise<void>;

  saveCustomExercise(e: Exercise): Promise<void>;
  deleteCustomExercise(id: string): Promise<void>;

  saveMesocycle(m: Mesocycle): Promise<void>;
  deleteMesocycle(id: string): Promise<void>;

  saveSession(s: SessionLog): Promise<void>;
  deleteSession(id: string): Promise<void>;
  saveStates(list: ExerciseState[]): Promise<void>;

  saveCardio(c: CardioLog): Promise<void>;
  deleteCardio(id: string): Promise<void>;

  replaceAll(snap: Snapshot): Promise<void>;
}

export const useApp = create<AppStore>((set, get) => ({
  ...EMPTY_SNAPSHOT,
  ready: false,
  error: null,

  async init() {
    if (get().ready) return;
    try {
      const snap = await getRepo().loadAll();
      set({ ...snap, ready: true, error: null });
    } catch (e) {
      console.error(e);
      set({ ready: true, error: String(e) });
    }
  },

  async saveProfile(p) {
    set({ profile: p });
    await getRepo().saveProfile(p);
  },

  async setMeta(patch) {
    set({ meta: { ...get().meta, ...patch } });
    await getRepo().setMeta(patch);
  },

  async saveCustomExercise(e) {
    set({ customExercises: upsert(get().customExercises, e, (x) => x.id) });
    await getRepo().putCustomExercise(e);
  },

  async deleteCustomExercise(id) {
    set({ customExercises: get().customExercises.filter((x) => x.id !== id) });
    await getRepo().deleteCustomExercise(id);
  },

  async saveMesocycle(m) {
    set({ mesocycles: upsert(get().mesocycles, m, (x) => x.id) });
    await getRepo().putMesocycle(m);
  },

  async deleteMesocycle(id) {
    set({ mesocycles: get().mesocycles.filter((x) => x.id !== id) });
    await getRepo().deleteMesocycle(id);
  },

  async saveSession(s) {
    set({ sessions: upsert(get().sessions, s, (x) => x.id) });
    await getRepo().putSession(s);
  },

  async deleteSession(id) {
    set({ sessions: get().sessions.filter((x) => x.id !== id) });
    await getRepo().deleteSession(id);
  },

  async saveStates(list) {
    let states = get().states;
    for (const s of list) states = upsert(states, s, (x) => x.exerciseId);
    set({ states });
    await getRepo().putStates(list);
  },

  async saveCardio(c) {
    set({ cardio: upsert(get().cardio, c, (x) => x.id) });
    await getRepo().putCardio(c);
  },

  async deleteCardio(id) {
    set({ cardio: get().cardio.filter((x) => x.id !== id) });
    await getRepo().deleteCardio(id);
  },

  async replaceAll(snap) {
    await getRepo().replaceAll(snap);
    set({ ...snap });
  },
}));

/** معرّف فريد قصير */
export function uid(prefix = ""): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${rnd}`;
}
