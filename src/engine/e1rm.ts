/**
 * تقدير الحدّ الأقصى لتكرارٍ واحد (لرسم التقدّم فقط، لا للوصف) — معادلة Epley:
 * e1RM = w × (1 + reps / 30)، وتُستبعد المجموعات فوق 12 تكراراً.
 */
import type { SetLog } from "../types";

export const E1RM_MAX_REPS = 12;

export function epley(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export function setE1RM(set: Pick<SetLog, "reps" | "weightKg">): number | null {
  if (set.reps <= 0 || set.weightKg <= 0 || set.reps > E1RM_MAX_REPS)
    return null;
  return Math.round(epley(set.weightKg, set.reps) * 10) / 10;
}

export function bestE1RM(
  sets: Pick<SetLog, "reps" | "weightKg">[],
): number | undefined {
  let best: number | undefined;
  for (const s of sets) {
    const v = setE1RM(s);
    if (v !== null && (best === undefined || v > best)) best = v;
  }
  return best;
}

export function bestReps(sets: Pick<SetLog, "reps">[]): number | undefined {
  if (!sets.length) return undefined;
  return Math.max(...sets.map((s) => s.reps));
}
