/**
 * تخطيط جلسةٍ من قالبها: الأهداف بحسب أسبوع الدورة والتفريغ والاستعداد،
 * والوزن المقترح من حالة التقدّم أو من آخر جلسة.
 */
import type {
  Exercise,
  ExerciseLog,
  ExerciseState,
  ExerciseTarget,
  Mesocycle,
  ReadinessChoice,
  SessionLog,
  SessionTemplate,
  SetLog,
} from "../types";
import { applyReadiness } from "./readiness";
import { deloadWeight } from "./load";
import { weekTarget } from "./prescription";

/** آخر مجموعات مسجّلة لتمرين (من أحدث جلسة منتهية فيها هذا التمرين) */
export function lastSetsFor(
  exerciseId: string,
  sessions: SessionLog[],
  excludeSessionId?: string,
): SetLog[] {
  let best: { at: number; sets: SetLog[] } | null = null;
  for (const s of sessions) {
    if (!s.endedAt || s.id === excludeSessionId) continue;
    for (const e of s.exercises) {
      if (e.exerciseId !== exerciseId || !e.sets.length) continue;
      if (!best || s.startedAt > best.at)
        best = { at: s.startedAt, sets: e.sets };
    }
  }
  return best?.sets ?? [];
}

/** الوزن المقترح: قرار محرّك التقدّم أولاً، وإلا أثقل وزنٍ في آخر جلسة */
export function suggestedWeight(
  ex: Exercise,
  state: ExerciseState | undefined,
  sessions: SessionLog[],
): number | undefined {
  if (ex.equip === "bodyweight" && !state?.nextWeightKg) return undefined;
  if (state?.nextWeightKg !== undefined) return state.nextWeightKg;
  const last = lastSetsFor(ex.id, sessions);
  if (!last.length) return undefined;
  return Math.max(...last.map((s) => s.weightKg));
}

export interface PlanInput {
  meso: Mesocycle;
  template: SessionTemplate;
  week: number;
  exById: Record<string, Exercise>;
  states: Record<string, ExerciseState>;
  sessions: SessionLog[];
  plateKg: number;
  choice: ReadinessChoice;
}

/** يبني قائمة تمارين الجلسة مع أهدافها */
export function planSession(input: PlanInput): ExerciseLog[] {
  const { meso, template, week, exById, states, sessions, plateKg } = input;
  const targets: ExerciseTarget[] = template.slots.map((slot) => {
    const ex = exById[slot.exerciseId];
    const wt = weekTarget(slot, meso.rirByWeek, week);
    const t: ExerciseTarget = {
      sets: wt.sets,
      reps: wt.reps,
      rir: wt.rir,
      restSec: wt.restSec,
    };
    const w = ex ? suggestedWeight(ex, states[ex.id], sessions) : undefined;
    if (w !== undefined) {
      t.weightKg = wt.deload ? deloadWeight(w, plateKg) : w;
    }
    return t;
  });
  const adjusted = applyReadiness(targets, input.choice);
  return template.slots.map((slot, i) => ({
    exerciseId: slot.exerciseId,
    sets: [],
    target: adjusted[i],
    slotIndex: i,
  }));
}

/** الحجم الكلّي للجلسة (كغ × تكرارات) — التمارين الموقوتة لا تُحسب */
export function sessionVolumeKg(
  s: Pick<SessionLog, "exercises">,
  exById: Record<string, Exercise>,
): number {
  let v = 0;
  for (const e of s.exercises) {
    if (exById[e.exerciseId]?.timed) continue;
    for (const set of e.sets) v += set.weightKg * set.reps;
  }
  return Math.round(v * 10) / 10;
}
