import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISE_BY_ID } from "../data/exercises";
import { MAJOR_MUSCLES, MINOR_MUSCLES } from "../data/muscles";
import type { Equip, Goal, Level } from "../types";
import {
  alternativesFor,
  buildMesocycle,
  chooseSplit,
  swapSlotExercise,
} from "./builder";
import { assertInvariants, exercisesOf, profileOf } from "./testUtils";

describe("اختيار التقسيم", () => {
  it("2–3 أيام جسم كامل، 4 علوي/سفلي، 5–6 دفع/سحب/أرجل", () => {
    expect(chooseSplit(2)).toBe("full");
    expect(chooseSplit(3)).toBe("full");
    expect(chooseSplit(4)).toBe("ul");
    expect(chooseSplit(5)).toBe("ppl");
    expect(chooseSplit(6)).toBe("ppl");
  });

  it("الخانات كما في التكليف (جسم كامل أ/ب)", () => {
    const m = buildMesocycle({
      profile: profileOf({ daysPerWeek: 3 }),
      exercises: EXERCISES,
      now: 1,
    });
    const mains = (i: number) =>
      m.templates[i].slots.filter((s) => !s.accessory).map((s) => s.pattern);
    expect(mains(0)).toEqual([
      "squat",
      "hinge",
      "hpush",
      "hpull",
      "vpush",
      "core",
    ]);
    expect(mains(1)).toEqual([
      "lunge",
      "hinge",
      "hpush",
      "hpull",
      "vpull",
      "core",
    ]);
  });

  it("يسمح بتجاوز التقسيم يدوياً", () => {
    const m = buildMesocycle({
      profile: profileOf({ daysPerWeek: 4 }),
      exercises: EXERCISES,
      split: "full",
      now: 1,
    });
    expect(m.split).toBe("full");
    expect(m.templates).toHaveLength(2);
  });
});

describe("سيناريو القبول: متوسّط، تضخّم، 4 أيام، 60 دقيقة، دمبل + ماكينة، ركبة حسّاسة", () => {
  const p = profileOf({
    level: 2,
    goal: "hypertrophy",
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: ["free", "machine"],
    sensitiveJoints: ["knee"],
  });
  const m = buildMesocycle({ profile: p, exercises: EXERCISES, now: 1 });

  it("خطة علوي/سفلي بلا أي تحذير", () => {
    expect(m.split).toBe("ul");
    expect(m.templates).toHaveLength(4);
    expect(m.warnings).toEqual([]);
    assertInvariants(m, p);
  });

  it("كل عضلة رئيسية بين 10 و20 وتُدرَّب مرّتين على الأقل", () => {
    for (const mu of MAJOR_MUSCLES) {
      expect(m.volumeByMuscle[mu], mu).toBeGreaterThanOrEqual(10);
      expect(m.volumeByMuscle[mu], mu).toBeLessThanOrEqual(20);
      expect(m.frequencyByMuscle![mu], mu).toBeGreaterThanOrEqual(2);
    }
    for (const mu of MINOR_MUSCLES)
      expect(m.volumeByMuscle[mu], mu).toBeGreaterThanOrEqual(4);
  });

  it("لا قفز ولا اندفاع عميق يُجهد الركبة، ومخطّط RIR للأسابيع الأربعة", () => {
    for (const ex of exercisesOf(m)) expect(ex.joints).not.toContain("knee");
    expect(exercisesOf(m).map((e) => e.id)).not.toContain("jump-squat");
    expect(m.rirByWeek).toEqual([2, 1, 1, 1]);
  });

  it("تنويع بين الجلستين المتماثلتين (علوي أ ≠ علوي ب في الدفع الأفقي)", () => {
    const hpush = m.templates
      .filter((t) => t.slots.some((s) => s.pattern === "hpush"))
      .map(
        (t) =>
          t.slots.find((s) => s.pattern === "hpush" && !s.accessory)!
            .exerciseId,
      );
    expect(new Set(hpush).size).toBe(hpush.length);
  });

  it("«بدّل» يقترح بديلاً من نفس النمط ويعيد حساب الحجم", () => {
    const t = m.templates[0];
    const slot = t.slots[0];
    const ex = EXERCISE_BY_ID[slot.exerciseId];
    const alts = alternativesFor(ex, p, EXERCISES);
    expect(alts.length).toBeGreaterThan(0);
    for (const a of alts) {
      expect(a.pattern).toBe(ex.pattern);
      expect(a.id).not.toBe(ex.id);
      expect(a.joints).not.toContain("knee");
    }
    const swapped = swapSlotExercise(m, t.id, 0, alts[0], p, EXERCISE_BY_ID);
    expect(swapped.templates[0].slots[0].exerciseId).toBe(alts[0].id);
    expect(swapped.volumeByMuscle).toBeDefined();
  });

  it("إعادة التوليد ببذورٍ مختلفة تنوّع التمارين", () => {
    const keys = new Set(
      [1, 2, 3, 4, 5].map((seed) =>
        buildMesocycle({ profile: p, exercises: EXERCISES, seed, now: 1 })
          .templates.flatMap((t) => t.slots.map((s) => s.exerciseId))
          .join(","),
      ),
    );
    expect(keys.size).toBeGreaterThan(1);
  });
});

describe("خطط النادي المعتادة بلا تحذيرات", () => {
  const goals: Goal[] = ["strength", "hypertrophy", "general", "endurance"];
  for (const level of [2, 3] as Level[]) {
    for (const days of [4, 5, 6] as const) {
      it(`مستوى ${level}، ${days} أيام`, () => {
        const failures: string[] = [];
        for (const goal of goals) {
          for (const sessionMinutes of [60, 75] as const) {
            for (const equipment of [
              ["free", "machine"],
              ["bodyweight", "free", "machine"],
            ] as Equip[][]) {
              const p = profileOf({
                level,
                goal,
                daysPerWeek: days,
                sessionMinutes,
                equipment,
              });
              const m = buildMesocycle({
                profile: p,
                exercises: EXERCISES,
                now: 1,
              });
              if (m.warnings.length)
                failures.push(
                  `${goal} ${sessionMinutes} ${equipment}: ${m.warnings}`,
                );
            }
          }
        }
        expect(failures).toEqual([]);
      });
    }
  }

  it("جسم كامل 3 أيام (تضخّم ولياقة عامة) بلا تحذيرات", () => {
    for (const goal of ["hypertrophy", "general"] as Goal[]) {
      const p = profileOf({
        goal,
        daysPerWeek: 3,
        equipment: ["free", "machine"],
      });
      const m = buildMesocycle({ profile: p, exercises: EXERCISES, now: 1 });
      expect(m.warnings, goal).toEqual([]);
    }
  });
});
