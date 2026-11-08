import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID } from "../data/exercises";
import {
  basePrescription,
  deloadSets,
  rirByWeek,
  weekTarget,
} from "./prescription";

describe("الوصف بحسب الهدف والمستوى (2.4 والملحق أ.4)", () => {
  const bench = EXERCISE_BY_ID["dumbbell-bench-press"];
  it("قوّة: 3–6 تكرارات وراحة 180 ثانية", () => {
    expect(basePrescription(bench, "strength", 2)).toEqual({
      reps: [3, 6],
      rir: 2,
      restSec: 180,
    });
  });
  it("تضخّم: 6–12، راحة 120 للمركّب و90 للعزل", () => {
    expect(basePrescription(bench, "hypertrophy", 1).reps).toEqual([6, 12]);
    expect(basePrescription(bench, "hypertrophy", 1).restSec).toBe(120);
    expect(
      basePrescription(EXERCISE_BY_ID["leg-extension"], "hypertrophy", 1)
        .restSec,
    ).toBe(90);
  });
  it("لياقة عامة 8–15 وتحمّل 12–20", () => {
    expect(basePrescription(bench, "general", 2).reps).toEqual([8, 15]);
    expect(basePrescription(bench, "endurance", 2).reps).toEqual([12, 20]);
    expect(basePrescription(bench, "endurance", 2).restSec).toBe(60);
  });
  it("البلانك يوصف بالثواني 30–60", () => {
    expect(
      basePrescription(EXERCISE_BY_ID.plank, "hypertrophy", 2).reps,
    ).toEqual([30, 60]);
  });
  it("RIR ابتدائي: 3/2/1 للقوّة والتضخّم و4/3/2 للياقة والتحمّل", () => {
    expect(
      [1, 2, 3].map((l) => basePrescription(bench, "hypertrophy", l as 1).rir),
    ).toEqual([3, 2, 1]);
    expect(
      [1, 2, 3].map((l) => basePrescription(bench, "general", l as 1).rir),
    ).toEqual([4, 3, 2]);
  });
});

describe("تدرّج الـRIR داخل الدورة", () => {
  it("المتوسّط بلياقة عامة: 3 → 2 → 2 → 1", () => {
    expect(rirByWeek("general", 2)).toEqual([3, 2, 2, 1]);
  });
  it("مقيّد بمجال المستوى: المبتدئ 3–4، المتقدّم 0–2", () => {
    for (const r of rirByWeek("hypertrophy", 1)) {
      expect(r).toBeGreaterThanOrEqual(3);
      expect(r).toBeLessThanOrEqual(4);
    }
    for (const r of rirByWeek("strength", 3)) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(2);
    }
  });
});

describe("أسبوع التفريغ", () => {
  const slot = {
    sets: 4,
    prescription: { reps: [6, 12] as [number, number], rir: 2, restSec: 120 },
  };
  it("نصف المجموعات، حِمل أخفّ، و RIR 4+", () => {
    const t = weekTarget(slot, [2, 1, 1, 1], 5);
    expect(t.deload).toBe(true);
    expect(t.sets).toBe(2);
    expect(t.loadFactor).toBeGreaterThanOrEqual(0.85);
    expect(t.loadFactor).toBeLessThanOrEqual(0.9);
    expect(t.rir).toBeGreaterThanOrEqual(4);
    expect(deloadSets(3)).toBe(2);
  });
  it("أسابيع التراكم تأخذ RIR أسبوعها", () => {
    expect(weekTarget(slot, [3, 2, 2, 1], 4).rir).toBe(1);
    expect(weekTarget(slot, [3, 2, 2, 1], 1).sets).toBe(4);
  });
});
