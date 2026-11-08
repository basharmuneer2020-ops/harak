/**
 * موقع المتدرّب داخل الدورة المتوسطة: الأسبوع الحالي، الجلسة التالية، واكتمال الدورة.
 * «الأسبوع» هنا كتلةٌ من الجلسات بعدد أيام التدريب (قرار D-16)، فتأخّر يومٍ لا يُفسد التدرّج.
 */
import type { Mesocycle, SessionLog, SessionTemplate } from "../types";
import { DELOAD_WEEK, MESO_WEEKS } from "./prescription";

export function daysOf(meso: Mesocycle): number {
  return meso.daysPerWeek ?? meso.templates.length;
}

/** الجلسات المنتهية التابعة لهذه الدورة */
export function completedSessions(
  meso: Mesocycle,
  sessions: SessionLog[],
): SessionLog[] {
  return sessions.filter((s) => s.mesocycleId === meso.id && s.endedAt);
}

/** الأسبوع (1..4 تراكم، 5 تفريغ) للجلسة ذات الترتيب index (0..) */
export function weekOfIndex(meso: Mesocycle, index: number): number {
  if (meso.earlyDeloadAt !== undefined && index >= meso.earlyDeloadAt)
    return DELOAD_WEEK;
  return Math.min(Math.floor(index / daysOf(meso)) + 1, DELOAD_WEEK);
}

/** عدد جلسات الدورة كاملةً (تراكم + تفريغ) */
export function totalSessions(meso: Mesocycle): number {
  const d = daysOf(meso);
  if (meso.earlyDeloadAt !== undefined) return meso.earlyDeloadAt + d;
  return (MESO_WEEKS + 1) * d;
}

export function isCycleComplete(
  meso: Mesocycle,
  completedCount: number,
): boolean {
  return completedCount >= totalSessions(meso);
}

/** القالب المقترح للجلسة ذات الترتيب index (تناوبٌ دوري: أ، ب، أ، ب…) */
export function templateForIndex(
  meso: Mesocycle,
  index: number,
): SessionTemplate {
  return meso.templates[index % meso.templates.length];
}

export interface CyclePosition {
  index: number;
  week: number;
  deload: boolean;
  template: SessionTemplate;
  done: number;
  total: number;
  complete: boolean;
}

export function cyclePosition(
  meso: Mesocycle,
  sessions: SessionLog[],
): CyclePosition {
  const done = completedSessions(meso, sessions).length;
  const week = weekOfIndex(meso, done);
  return {
    index: done,
    week,
    deload: week >= DELOAD_WEEK,
    template: templateForIndex(meso, done),
    done,
    total: totalSessions(meso),
    complete: isCycleComplete(meso, done),
  };
}
