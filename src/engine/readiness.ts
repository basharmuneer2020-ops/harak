/**
 * الاستعداد اليومي والضبط الذاتي (قسم 2.8): ثلاثة أسئلة من 1 إلى 5
 * (النوم، الألم العضلي — 5 = لا ألم، الطاقة)، والمؤشّر هو المتوسّط.
 */
import type { ExerciseTarget, ReadinessChoice, SessionLog } from "../types";

export interface Readiness {
  sleep: number;
  soreness: number;
  energy: number;
}

export const READINESS_HIGH = 4.0;
export const READINESS_LOW = 2.5;
/** أيام تدريبٍ متتالية باستعدادٍ منخفض تستدعي تفريغاً مبكراً (2.6) */
export const LOW_READINESS_STREAK = 3;

export type ReadinessLevel = "high" | "normal" | "low";

export function readinessScore(r: Readiness): number {
  return Math.round(((r.sleep + r.soreness + r.energy) / 3) * 100) / 100;
}

/** ≥ 4.0 مرتفع، 2.5–3.9 طبيعي، < 2.5 منخفض */
export function readinessLevel(score: number): ReadinessLevel {
  if (score >= READINESS_HIGH) return "high";
  if (score >= READINESS_LOW) return "normal";
  return "low";
}

/** الخيارات المتاحة لكل مستوى؛ الأول هو الافتراضي المقترح */
export function readinessOptions(level: ReadinessLevel): ReadinessChoice[] {
  if (level === "high") return ["normal", "plus"];
  if (level === "low") return ["light", "normal"];
  return ["normal"];
}

/**
 * أثر الاستعداد على أهداف الجلسة:
 * plus: +1 مجموعة على التمرين الأول؛ light: −1 مجموعة لكل تمرين و RIR +1.
 */
export function applyReadiness(
  targets: ExerciseTarget[],
  choice: ReadinessChoice,
): ExerciseTarget[] {
  if (choice === "plus") {
    return targets.map((t, i) =>
      i === 0 ? { ...t, sets: t.sets + 1 } : { ...t },
    );
  }
  if (choice === "light") {
    return targets.map((t) => ({
      ...t,
      sets: Math.max(1, t.sets - 1),
      rir: t.rir + 1,
    }));
  }
  return targets.map((t) => ({ ...t }));
}

/** عدد جلسات التدريب الأخيرة المتتالية باستعدادٍ منخفض */
export function lowReadinessStreak(sessions: SessionLog[]): number {
  const done = sessions
    .filter((s) => s.endedAt && s.readiness)
    .sort((a, b) => b.startedAt - a.startedAt);
  let n = 0;
  for (const s of done) {
    if (readinessScore(s.readiness!) < READINESS_LOW) n++;
    else break;
  }
  return n;
}
