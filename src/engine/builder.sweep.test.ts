import { afterEach, describe, it } from "vitest";
import { EXERCISES } from "../data/exercises";
import type { Equip, Goal, Joint, Level } from "../types";
import { buildMesocycle } from "./builder";
import { assertInvariants, profileOf } from "./testUtils";

// نُفسح لحلقة الأحداث بين الاختبارات الطويلة كي يستجيب العامل لرسائل Vitest
afterEach(() => new Promise((r) => setTimeout(r, 0)));

describe("الثوابت لكل تركيبة (مستوى × هدف × أيام × أدوات × مدّة × مفاصل)", () => {
  const goals: Goal[] = ["strength", "hypertrophy", "general", "endurance"];
  const equipSets: Equip[][] = [
    ["bodyweight"],
    ["machine"],
    ["free", "machine"],
    ["bodyweight", "free", "machine"],
  ];
  const jointSets: Joint[][] = [[], ["knee"], ["shoulder", "lower_back"]];
  for (const days of [2, 3, 4, 5, 6] as const) {
    for (const level of [1, 2, 3] as Level[]) {
      it(`${days} أيام، مستوى ${level}`, () => {
        for (const goal of goals)
          for (const equipment of equipSets)
            for (const sessionMinutes of [30, 60] as const)
              for (const sensitiveJoints of jointSets) {
                const p = profileOf({
                  level,
                  goal,
                  daysPerWeek: days,
                  sessionMinutes,
                  equipment,
                  sensitiveJoints,
                });
                const m = buildMesocycle({
                  profile: p,
                  exercises: EXERCISES,
                  now: 1,
                });
                assertInvariants(m, p);
              }
      });
    }
  }
});
