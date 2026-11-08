import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID } from "../data/exercises";
import { buildMesocycle } from "./builder";
import { EXERCISES } from "../data/exercises";
import { planSession, sessionVolumeKg } from "./session";
import { buildWarmup, rampSets, roundToPlate, sessionFocus } from "./warmup";
import { deloadWeight } from "./load";
import { profileOf } from "./testUtils";

describe("الإحماء RAMP", () => {
  it("المجموعات التصاعدية 40%×8، 60%×5، 80%×3 مقرّبة لأصغر قفزة", () => {
    expect(rampSets(100, 2.5)).toEqual([
      { percent: 40, reps: 8, weightKg: 40 },
      { percent: 60, reps: 5, weightKg: 60 },
      { percent: 80, reps: 3, weightKg: 80 },
    ]);
    expect(rampSets(22.5, 2.5).map((r) => r.weightKg)).toEqual([
      10, 12.5, 17.5,
    ]);
    expect(roundToPlate(13.3, 1.25)).toBe(13.75);
  });

  it("تركيز الجلسة: ورك وكاحل للأرجل، كتف للعلوي", () => {
    expect(sessionFocus(["squat", "hinge", "lunge", "core"])).toBe("lower");
    expect(sessionFocus(["hpush", "vpush", "hpull", "vpull", "core"])).toBe(
      "upper",
    );
    expect(sessionFocus(["squat", "hpush", "core"])).toBe("full");
  });

  it("قائمة التحقّق: رفع النبض + حركتان + 3 مجموعات تصاعدية للأوزان", () => {
    const items = buildWarmup(
      ["squat", "hinge", "lunge", "core"],
      EXERCISE_BY_ID["goblet-squat"],
      30,
      2.5,
    );
    expect(items.filter((i) => i.phase === "raise")).toHaveLength(1);
    expect(
      items.filter((i) => i.phase === "mobilize").map((i) => i.key),
    ).toEqual(["hipCircles", "ankleRocks"]);
    expect(
      items.filter((i) => i.phase === "potentiate").map((i) => i.weightKg),
    ).toEqual([12.5, 17.5, 25]);
  });

  it("لا مجموعات تصاعدية إن كان التمرين الأول بوزن الجسم", () => {
    const items = buildWarmup(
      ["hpush"],
      EXERCISE_BY_ID["push-up"],
      undefined,
      2.5,
    );
    expect(items.some((i) => i.phase === "potentiate")).toBe(false);
  });
});

describe("تخطيط الجلسة", () => {
  const profile = profileOf({ goal: "hypertrophy", daysPerWeek: 4 });
  const meso = buildMesocycle({ profile, exercises: EXERCISES, now: 1 });
  const exById = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
  const template = meso.templates[0];
  const firstId = template.slots[0].exerciseId;

  it("أهداف الأسبوع الأول والوزن من حالة التقدّم", () => {
    const logs = planSession({
      meso,
      template,
      week: 1,
      exById,
      states: {
        [firstId]: {
          exerciseId: firstId,
          nextWeightKg: 50,
          consecutiveFails: 0,
          updatedAt: 0,
        },
      },
      sessions: [],
      plateKg: 2.5,
      choice: "normal",
    });
    expect(logs).toHaveLength(template.slots.length);
    expect(logs[0].target?.sets).toBe(template.slots[0].sets);
    expect(logs[0].target?.rir).toBe(meso.rirByWeek[0]);
    expect(logs[0].target?.weightKg).toBe(50);
  });

  it("أسبوع التفريغ: نصف المجموعات وحِمل أخفّ و RIR 4", () => {
    const logs = planSession({
      meso,
      template,
      week: 5,
      exById,
      states: {
        [firstId]: {
          exerciseId: firstId,
          nextWeightKg: 50,
          consecutiveFails: 0,
          updatedAt: 0,
        },
      },
      sessions: [],
      plateKg: 2.5,
      choice: "normal",
    });
    expect(logs[0].target?.sets).toBe(Math.ceil(template.slots[0].sets / 2));
    expect(logs[0].target?.weightKg).toBe(42.5); // خفض 15% (أقرب قيمة داخل 10–15% إلى 12.5%)
    expect(logs[0].target?.rir).toBeGreaterThanOrEqual(4);
  });

  it("الحجم الكلّي = Σ الوزن × التكرارات", () => {
    expect(
      sessionVolumeKg(
        {
          exercises: [
            {
              exerciseId: "goblet-squat",
              sets: [
                { reps: 10, weightKg: 20, rir: 2, ts: 0 },
                { reps: 8, weightKg: 22.5, rir: 1, ts: 0 },
              ],
            },
            {
              exerciseId: "plank",
              sets: [{ reps: 45, weightKg: 0, rir: 2, ts: 0 }],
            },
          ],
        },
        exById,
      ),
    ).toBe(380);
  });
});

describe("حِمل التفريغ", () => {
  it("خفضٌ بين 10% و15% بعد التقريب لأصغر قفزة", () => {
    for (const [kg, plate] of [
      [20, 2.5],
      [50, 2.5],
      [80, 5],
      [100, 2.5],
      [42.5, 1.25],
    ] as const) {
      const w = deloadWeight(kg, plate);
      const cut = 1 - w / kg;
      expect(cut, `${kg}`).toBeGreaterThanOrEqual(0.1 - 1e-9);
      expect(cut, `${kg}`).toBeLessThanOrEqual(0.15 + 1e-9);
    }
    expect(deloadWeight(20, 2.5)).toBe(17.5);
    // حين يتعذّر المجال بالقفزات المتاحة يُختار الأخفّ (60 كغ بقفزة 5: 50 أو 55)
    expect(deloadWeight(60, 5)).toBe(50);
  });
});
