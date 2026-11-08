import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID } from "../data/exercises";
import {
  directSets,
  loggedVolume,
  sessionVolume,
  setContribution,
  weeklyFrequency,
  weeklyVolume,
} from "./volume";
import type { SessionLog } from "../types";

describe("حساب الحجم: 1.0 للأساسية و0.5 للمساندة", () => {
  it("مساهمة مجموعة تمرين ضغط (موروثة من النمط)", () => {
    const c = setContribution(EXERCISE_BY_ID["push-up"]);
    expect(c).toEqual({
      chest: 1,
      "front delt": 1,
      triceps: 1,
      abs: 0.5,
    });
  });

  it("تجاوز التمرين لعضلات النمط (ضغط بنش مسنود بلا بطن)", () => {
    expect(setContribution(EXERCISE_BY_ID["dumbbell-bench-press"])).toEqual({
      chest: 1,
      "front delt": 1,
      triceps: 1,
    });
  });

  it("جلسة معلومة → مجموعات لكل عضلة بدقّة", () => {
    const v = sessionVolume(
      [
        { exerciseId: "goblet-squat", sets: 3 }, // quads 1, glutes 1 | hamstrings .5, abs .5, calves .5
        { exerciseId: "romanian-deadlift", sets: 3 }, // hamstrings 1, glutes 1, lower back 1 | upper back .5, grip .5
        { exerciseId: "push-up", sets: 4 }, // chest 1, front delt 1, triceps 1 | abs .5
        { exerciseId: "lat-pulldown", sets: 2 }, // lats 1, biceps 1 | upper back .5, rear delt .5, grip .5
      ],
      EXERCISE_BY_ID,
    );
    expect(v.quads).toBe(3);
    expect(v.glutes).toBe(6);
    expect(v.hamstrings).toBe(4.5); // 3 + 0.5×3
    expect(v.abs).toBe(3.5); // 0.5×3 + 0.5×4
    expect(v.calves).toBe(1.5);
    expect(v["lower back"]).toBe(3);
    expect(v["upper back"]).toBe(2.5); // 0.5×3 + 0.5×2
    expect(v.grip).toBe(2.5); // 0.5×3 + 0.5×2
    expect(v.chest).toBe(4);
    expect(v["front delt"]).toBe(4);
    expect(v.triceps).toBe(4);
    expect(v.lats).toBe(2);
    expect(v.biceps).toBe(2);
    expect(v["rear delt"]).toBe(1);
    expect(v["side delt"]).toBe(0);
    expect(v.obliques).toBe(0);
  });

  it("المجموعات المباشرة تحسب العضلات الأساسية فقط", () => {
    const d = directSets(
      [
        { exerciseId: "push-up", sets: 3 },
        { exerciseId: "dumbbell-overhead-press", sets: 3 },
      ],
      EXERCISE_BY_ID,
    );
    expect(d["front delt"]).toBe(6);
    expect(d.triceps).toBe(6);
    expect(d.chest).toBe(3); // الصدر مساند في الدفع العمودي فلا يُحسب مباشراً
    expect(d.abs).toBe(0);
  });

  it("الحجم والتكرار الأسبوعيان مع تكرار القالب", () => {
    const templates = [
      { slots: [{ exerciseId: "push-up", sets: 3 }] },
      { slots: [{ exerciseId: "goblet-squat", sets: 3 }] },
    ];
    const v = weeklyVolume(templates, 1.5, EXERCISE_BY_ID);
    expect(v.chest).toBe(4.5);
    expect(v.abs).toBe(4.5); // (1.5 + 1.5) × 1.5
    const f = weeklyFrequency(templates, 1.5, EXERCISE_BY_ID);
    expect(f.chest).toBe(1.5);
    expect(f.quads).toBe(1.5);
    expect(f.abs).toBe(0); // مساند فقط
  });

  it("الحجم المسجّل فعلاً من سجل الجلسات ضمن مدى زمني", () => {
    const set = { reps: 10, weightKg: 20, rir: 2, ts: 0 };
    const sessions: SessionLog[] = [
      {
        id: "a",
        startedAt: 100,
        exercises: [{ exerciseId: "push-up", sets: [set, set] }],
        volumeKg: 0,
      },
      {
        id: "b",
        startedAt: 500,
        exercises: [{ exerciseId: "push-up", sets: [set] }],
        volumeKg: 0,
      },
    ];
    expect(loggedVolume(sessions, EXERCISE_BY_ID).chest).toBe(3);
    expect(loggedVolume(sessions, EXERCISE_BY_ID, 0, 200).chest).toBe(2);
  });
});
