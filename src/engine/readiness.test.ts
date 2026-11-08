import { describe, expect, it } from "vitest";
import type { ExerciseTarget, SessionLog } from "../types";
import {
  applyReadiness,
  lowReadinessStreak,
  readinessLevel,
  readinessOptions,
  readinessScore,
} from "./readiness";

const targets: ExerciseTarget[] = [
  { sets: 3, reps: [6, 12], rir: 2, restSec: 120 },
  { sets: 3, reps: [6, 12], rir: 2, restSec: 120 },
  { sets: 1, reps: [30, 60], rir: 2, restSec: 90 },
];

describe("مؤشّر الاستعداد = متوسّط الأسئلة الثلاثة", () => {
  it("يحسب المتوسّط", () => {
    expect(readinessScore({ sleep: 5, soreness: 4, energy: 3 })).toBe(4);
    expect(readinessScore({ sleep: 2, soreness: 3, energy: 3 })).toBeCloseTo(
      2.67,
      2,
    );
  });

  it("≥ 4.0 مرتفع، 2.5–3.9 طبيعي، < 2.5 منخفض", () => {
    expect(readinessLevel(4)).toBe("high");
    expect(readinessLevel(5)).toBe("high");
    expect(readinessLevel(3.99)).toBe("normal");
    expect(readinessLevel(2.5)).toBe("normal");
    expect(readinessLevel(2.49)).toBe("low");
    expect(readinessLevel(1)).toBe("low");
  });

  it("الخيارات: المرتفع يقترح +1 مجموعة، والمنخفض جلسةً خفيفة", () => {
    expect(readinessOptions("high")).toEqual(["normal", "plus"]);
    expect(readinessOptions("normal")).toEqual(["normal"]);
    expect(readinessOptions("low")).toEqual(["light", "normal"]);
  });
});

describe("أثر الاستعداد على الجلسة", () => {
  it("كما هي: لا تغيير", () => {
    expect(applyReadiness(targets, "normal")).toEqual(targets);
  });

  it("مرتفع: +1 مجموعة على التمرين الأول فقط", () => {
    const r = applyReadiness(targets, "plus");
    expect(r.map((t) => t.sets)).toEqual([4, 3, 1]);
    expect(r[0].rir).toBe(2);
  });

  it("خفيفة: −1 مجموعة لكل تمرين (ولا تقلّ عن 1) و RIR +1", () => {
    const r = applyReadiness(targets, "light");
    expect(r.map((t) => t.sets)).toEqual([2, 2, 1]);
    expect(r.map((t) => t.rir)).toEqual([3, 3, 3]);
  });

  it("لا يعدّل المدخلات", () => {
    applyReadiness(targets, "light");
    expect(targets[0].sets).toBe(3);
  });
});

describe("سلسلة الاستعداد المنخفض (للتفريغ المبكر)", () => {
  const s = (i: number, score: number): SessionLog => ({
    id: String(i),
    startedAt: i,
    endedAt: i + 1,
    readiness: { sleep: score, soreness: score, energy: score },
    exercises: [],
    volumeKg: 0,
  });
  it("تعدّ الجلسات الأخيرة المتتالية تحت 2.5", () => {
    expect(lowReadinessStreak([s(1, 2), s(2, 2), s(3, 2)])).toBe(3);
    expect(lowReadinessStreak([s(1, 2), s(2, 4), s(3, 2)])).toBe(1);
    expect(lowReadinessStreak([s(1, 2), s(2, 2), s(3, 4)])).toBe(0);
  });
});
