import { useMemo } from "react";
import { EXERCISES } from "../data/exercises";
import type { Exercise, Mesocycle, SessionLog } from "../types";
import { useApp } from "./useApp";

/** كل التمارين: الأساسية + المخصّصة من المستخدم */
export function useExercises(): {
  list: Exercise[];
  byId: Record<string, Exercise>;
} {
  const custom = useApp((s) => s.customExercises);
  return useMemo(() => {
    const list = [...EXERCISES, ...custom];
    return { list, byId: Object.fromEntries(list.map((e) => [e.id, e])) };
  }, [custom]);
}

/** الدورة النشطة: أحدث دورة لم تُغلَق */
export function activeMesocycleOf(mesocycles: Mesocycle[]): Mesocycle | null {
  for (let i = mesocycles.length - 1; i >= 0; i--) {
    if (mesocycles[i].status !== "completed") return mesocycles[i];
  }
  return null;
}

export function useActiveMesocycle(): Mesocycle | null {
  const mesocycles = useApp((s) => s.mesocycles);
  return useMemo(() => activeMesocycleOf(mesocycles), [mesocycles]);
}

/** الجلسة الجارية (بدأت ولم تنتهِ) */
export function openSessionOf(sessions: SessionLog[]): SessionLog | null {
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (!sessions[i].endedAt) return sessions[i];
  }
  return null;
}

export function useOpenSession(): SessionLog | null {
  const sessions = useApp((s) => s.sessions);
  return useMemo(() => openSessionOf(sessions), [sessions]);
}
