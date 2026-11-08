/**
 * الإحماء بروتوكول RAMP (قسم 2.7):
 * Raise — نشاطٌ خفيف 3–5 دقائق؛ Activate & Mobilize — حركتان ديناميكيتان لمفاصل الجلسة؛
 * Potentiate — مجموعات تصاعدية على التمرين الأول: 40%×8، 60%×5، 80%×3 (للأوزان فقط).
 */
import type { Exercise, PatternId } from "../types";
import { roundToPlate } from "./load";

export { roundToPlate };

export type Focus = "upper" | "lower" | "full";

export interface WarmupItem {
  id: string;
  phase: "raise" | "mobilize" | "potentiate";
  /** مفتاح نصّ الحركة في ملف الترجمة */
  key: string;
  percent?: number;
  reps?: number;
  weightKg?: number;
}

export const RAMP_SETS: { percent: number; reps: number }[] = [
  { percent: 40, reps: 8 },
  { percent: 60, reps: 5 },
  { percent: 80, reps: 3 },
];

const LOWER: PatternId[] = ["squat", "hinge", "lunge"];
const UPPER: PatternId[] = ["hpush", "vpush", "hpull", "vpull"];

/** تركيز الجلسة من أنماطها: ورك وكاحل ليوم الأرجل، كتف ولوح كتف ليوم العلوي */
export function sessionFocus(patterns: PatternId[]): Focus {
  const lower = patterns.some((p) => LOWER.includes(p));
  const upper = patterns.some((p) => UPPER.includes(p));
  if (lower && !upper) return "lower";
  if (upper && !lower) return "upper";
  return "full";
}

export function rampSets(
  workingKg: number,
  plateKg: number,
): { percent: number; reps: number; weightKg: number }[] {
  return RAMP_SETS.map((r) => ({
    ...r,
    weightKg: roundToPlate((workingKg * r.percent) / 100, plateKg),
  }));
}

const MOBILIZE: Record<Focus, string[]> = {
  lower: ["hipCircles", "ankleRocks"],
  upper: ["armCircles", "wallSlides"],
  full: ["hipCircles", "wallSlides"],
};

/** قائمة تحقّق الإحماء للجلسة */
export function buildWarmup(
  patterns: PatternId[],
  first: Exercise | undefined,
  firstWorkingKg: number | undefined,
  plateKg: number,
): WarmupItem[] {
  const focus = sessionFocus(patterns);
  const items: WarmupItem[] = [{ id: "raise", phase: "raise", key: "raise" }];
  MOBILIZE[focus].forEach((key, i) =>
    items.push({ id: `mob-${i}`, phase: "mobilize", key }),
  );
  const weighted = first && first.equip !== "bodyweight" && !first.timed;
  if (weighted) {
    rampSets(firstWorkingKg ?? 0, plateKg).forEach((r, i) =>
      items.push({
        id: `ramp-${i}`,
        phase: "potentiate",
        key: "ramp",
        percent: r.percent,
        reps: r.reps,
        weightKg: firstWorkingKg ? r.weightKg : undefined,
      }),
    );
  }
  return items;
}
