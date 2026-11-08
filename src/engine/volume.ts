/**
 * حساب الحجم التدريبي (قسم 2.2): مجموعة التمرين تُحسَب 1.0 لكل عضلةٍ أساسية
 * و0.5 لكل عضلةٍ مساندة. دوالّ صِرفة بلا React ولا تخزين.
 */
import { musclesOf } from "../data/exercises";
import { MUSCLE_IDS } from "../data/muscles";
import type { Exercise, MuscleId, SessionLog } from "../types";

export const PRIMARY_WEIGHT = 1.0;
export const SECONDARY_WEIGHT = 0.5;

export type MuscleMap = Record<MuscleId, number>;

export function emptyMuscleMap(): MuscleMap {
  return Object.fromEntries(MUSCLE_IDS.map((m) => [m, 0])) as MuscleMap;
}

/** مساهمة مجموعةٍ واحدة من التمرين في كل عضلة */
export function setContribution(ex: Exercise): Partial<MuscleMap> {
  const { primary, secondary } = musclesOf(ex);
  const out: Partial<MuscleMap> = {};
  for (const m of secondary) out[m] = SECONDARY_WEIGHT;
  for (const m of primary) out[m] = PRIMARY_WEIGHT;
  return out;
}

export interface SetCount {
  exerciseId: string;
  sets: number;
}

/** المجموعات المكافئة لكل عضلة في قائمة (جلسة أو خانات) */
export function sessionVolume(
  items: SetCount[],
  exById: Record<string, Exercise>,
): MuscleMap {
  const out = emptyMuscleMap();
  for (const it of items) {
    const ex = exById[it.exerciseId];
    if (!ex || it.sets <= 0) continue;
    const c = setContribution(ex);
    for (const m of MUSCLE_IDS) {
      const w = c[m];
      if (w) out[m] += w * it.sets;
    }
  }
  return out;
}

/** المجموعات المباشرة (الأساسية فقط) لكل عضلة — لسقف الجلسة (8) والتكرار الأسبوعي */
export function directSets(
  items: SetCount[],
  exById: Record<string, Exercise>,
): MuscleMap {
  const out = emptyMuscleMap();
  for (const it of items) {
    const ex = exById[it.exerciseId];
    if (!ex || it.sets <= 0) continue;
    for (const m of musclesOf(ex).primary) out[m] += it.sets;
  }
  return out;
}

export function addInto(target: MuscleMap, src: MuscleMap, factor = 1): void {
  for (const m of MUSCLE_IDS) target[m] += src[m] * factor;
}

/**
 * الحجم الأسبوعي لخطة: كل قالب جلسة يتكرّر perWeek مرّة أسبوعياً
 * (قد يكون كسرياً، مثل 1.5 لجلستين بالتناوب على 3 أيام).
 */
export function weeklyVolume(
  templates: { slots: SetCount[] }[],
  perWeek: number,
  exById: Record<string, Exercise>,
): MuscleMap {
  const out = emptyMuscleMap();
  for (const t of templates)
    addInto(out, sessionVolume(t.slots, exById), perWeek);
  return out;
}

/** عدد مرّات تدريب كل عضلة أسبوعياً (جلسةٌ فيها عملٌ مباشر عليها) */
export function weeklyFrequency(
  templates: { slots: SetCount[] }[],
  perWeek: number,
  exById: Record<string, Exercise>,
): MuscleMap {
  const out = emptyMuscleMap();
  for (const t of templates) {
    const d = directSets(t.slots, exById);
    for (const m of MUSCLE_IDS) if (d[m] > 0) out[m] += perWeek;
  }
  return out;
}

/** المجموعات المسجّلة فعلاً لكل عضلة ضمن مدى زمني [from, to) */
export function loggedVolume(
  sessions: SessionLog[],
  exById: Record<string, Exercise>,
  from = -Infinity,
  to = Infinity,
): MuscleMap {
  const items: SetCount[] = [];
  for (const s of sessions) {
    if (s.startedAt < from || s.startedAt >= to) continue;
    for (const e of s.exercises) {
      if (e.sets.length)
        items.push({ exerciseId: e.exerciseId, sets: e.sets.length });
    }
  }
  return sessionVolume(items, exById);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
