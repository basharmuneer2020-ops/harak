/**
 * الوصف (قسم 2.4 والملحق أ.4): التكرارات والـRIR والراحة والمجموعات
 * من الهدف والمستوى، وتدرّج الـRIR عبر أسابيع الدورة، وأسبوع التفريغ (2.6).
 */
import type {
  Exercise,
  Goal,
  Level,
  PatternId,
  SetPrescription,
} from "../types";

interface GoalRow {
  reps: [number, number];
  /** RIR ابتدائي: مبتدئ / متوسّط / متقدّم */
  rir: [number, number, number];
  restCompound: number;
  restIsolation: number;
  sets: number;
}

/** الملحق أ.4 */
export const GOAL_TABLE: Record<Goal, GoalRow> = {
  strength: {
    reps: [3, 6],
    rir: [3, 2, 1],
    restCompound: 180,
    restIsolation: 120,
    sets: 4,
  },
  hypertrophy: {
    reps: [6, 12],
    rir: [3, 2, 1],
    restCompound: 120,
    restIsolation: 90,
    sets: 3,
  },
  general: {
    reps: [8, 15],
    rir: [4, 3, 2],
    restCompound: 105,
    restIsolation: 75,
    sets: 3,
  },
  endurance: {
    reps: [12, 20],
    rir: [4, 3, 2],
    restCompound: 60,
    restIsolation: 45,
    sets: 3,
  },
};

/** مجال الـRIR المسموح لكل مستوى (2.4) */
export const LEVEL_RIR_RANGE: Record<Level, [number, number]> = {
  1: [3, 4],
  2: [1, 3],
  3: [0, 2],
};

/** شكل التدرّج داخل الدورة: الأسبوع 1 → 4 (مثل 3 → 2 → 2 → 1) */
export const RIR_WEEK_OFFSETS = [0, -1, -1, -2];

/** التمارين الموقوتة: 30–60 ثانية × 3 */
export const TIMED_RANGE: [number, number] = [30, 60];
export const TIMED_SETS = 3;

/** العزل في هدف القوّة: مجالٌ أعلى من 3–6 لحماية المفاصل (قرار D-15) */
export const STRENGTH_ISOLATION_REPS: [number, number] = [6, 10];

/** تمارين الجذع غير الموقوتة */
export const CORE_REPS: [number, number] = [8, 15];

/** التفريغ (2.6): نصف المجموعات، حِمل −12.5% (منتصف 10–15%)، و RIR 4+ */
export const DELOAD = { setFactor: 0.5, loadFactor: 0.875, rir: 4 };

export const MESO_WEEKS = 4;
export const DELOAD_WEEK = 5;

const UPPER: PatternId[] = ["hpush", "vpush", "hpull", "vpull", "core"];

/** هل التمرين للجزء العلوي (قفزة +2.5) أم السفلي (+5)؟ */
export function isUpperBody(ex: Pick<Exercise, "pattern">): boolean {
  return UPPER.includes(ex.pattern);
}

export function repRange(ex: Exercise, goal: Goal): [number, number] {
  if (ex.timed) return [...TIMED_RANGE];
  if (ex.pattern === "core") {
    return goal === "endurance"
      ? [...GOAL_TABLE.endurance.reps]
      : [...CORE_REPS];
  }
  if (ex.isolation && goal === "strength") return [...STRENGTH_ISOLATION_REPS];
  return [...GOAL_TABLE[goal].reps];
}

export function restFor(ex: Exercise, goal: Goal): number {
  const row = GOAL_TABLE[goal];
  return ex.isolation || ex.pattern === "core"
    ? row.restIsolation
    : row.restCompound;
}

export function defaultSets(ex: Exercise, goal: Goal): number {
  if (ex.timed || ex.pattern === "core") return TIMED_SETS;
  return GOAL_TABLE[goal].sets;
}

/** RIR الأسبوع الأول من الجدول بحسب الهدف والمستوى */
export function initialRir(goal: Goal, level: Level): number {
  return GOAL_TABLE[goal].rir[level - 1];
}

/** مخطّط الـRIR لأسابيع التراكم الأربعة، مقيّداً بمجال المستوى */
export function rirByWeek(goal: Goal, level: Level): number[] {
  const r0 = initialRir(goal, level);
  const [lo, hi] = LEVEL_RIR_RANGE[level];
  return RIR_WEEK_OFFSETS.map((d) => Math.min(hi, Math.max(lo, r0 + d)));
}

export function basePrescription(
  ex: Exercise,
  goal: Goal,
  level: Level,
): SetPrescription {
  return {
    reps: repRange(ex, goal),
    rir: initialRir(goal, level),
    restSec: restFor(ex, goal),
  };
}

export function deloadSets(sets: number): number {
  return Math.max(1, Math.ceil(sets * DELOAD.setFactor));
}

export interface WeekTarget {
  sets: number;
  reps: [number, number];
  rir: number;
  restSec: number;
  /** معامل الحِمل (1 عادةً، 0.875 في التفريغ) */
  loadFactor: number;
  deload: boolean;
}

/** الهدف الفعلي لخانة في أسبوعٍ معيّن (1..4 تراكم، 5 تفريغ) */
export function weekTarget(
  slot: { sets: number; prescription: SetPrescription },
  rirWeeks: number[],
  week: number,
): WeekTarget {
  if (week >= DELOAD_WEEK) {
    return {
      sets: deloadSets(slot.sets),
      reps: slot.prescription.reps,
      rir: Math.max(DELOAD.rir, rirWeeks[0] ?? DELOAD.rir),
      restSec: slot.prescription.restSec,
      loadFactor: DELOAD.loadFactor,
      deload: true,
    };
  }
  const i = Math.min(Math.max(week, 1), MESO_WEEKS) - 1;
  return {
    sets: slot.sets,
    reps: slot.prescription.reps,
    rir: rirWeeks[i] ?? slot.prescription.rir,
    restSec: slot.prescription.restSec,
    loadFactor: 1,
    deload: false,
  };
}
