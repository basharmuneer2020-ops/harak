/** أدوات مشتركة لاختبارات المولّد (ليست ملف اختبار) */
import { expect } from "vitest";
import { EXERCISE_BY_ID } from "../data/exercises";
import { MAJOR_MUSCLES, MINOR_MUSCLES } from "../data/muscles";
import type { Mesocycle, Profile } from "../types";
import {
  analyzeTemplates,
  FREQ_MIN,
  MINOR_MIN,
  RATIO_MAX,
  RATIO_MIN,
  VOLUME_MAX,
  VOLUME_MIN,
} from "./builder";

export function profileOf(p: Partial<Profile>): Profile {
  return {
    level: 2,
    goal: "general",
    daysPerWeek: 3,
    sessionMinutes: 60,
    equipment: ["bodyweight", "free", "machine"],
    sensitiveJoints: [],
    minPlateKg: 2.5,
    units: "kg",
    createdAt: 0,
    ...p,
  };
}

export function exercisesOf(m: Mesocycle) {
  return m.templates.flatMap((t) =>
    t.slots.map((s) => EXERCISE_BY_ID[s.exerciseId]),
  );
}

/** الثوابت التي يجب أن تتحقّق في أي خطة مهما كانت المدخلات */
export function assertInvariants(m: Mesocycle, p: Profile) {
  const issues = m.issues ?? [];
  const has = (kind: string, muscle: string) =>
    issues.some((i) => i.kind === kind && i.muscle === muscle);
  for (const mu of MAJOR_MUSCLES) {
    const v = m.volumeByMuscle[mu];
    if (v < VOLUME_MIN) expect(has("volume-low", mu), `${mu}=${v}`).toBe(true);
    if (v > VOLUME_MAX) expect(has("volume-high", mu), `${mu}=${v}`).toBe(true);
    const f = m.frequencyByMuscle![mu];
    if (f < FREQ_MIN) expect(has("frequency", mu), `${mu} f=${f}`).toBe(true);
  }
  for (const mu of MINOR_MUSCLES) {
    if (m.volumeByMuscle[mu] < MINOR_MIN)
      expect(has("minor-low", mu), mu).toBe(true);
  }
  // كل تحذيرٍ له نصٌّ عربي ظاهر
  expect(m.warnings).toHaveLength(issues.length);
  for (const ex of exercisesOf(m)) {
    expect(ex, "تمرين غير معروف").toBeDefined();
    expect(p.equipment, `${ex.id} أداة غير متاحة`).toContain(ex.equip);
    expect(ex.diff, `${ex.id} فوق المستوى`).toBeLessThanOrEqual(p.level);
    for (const j of ex.joints)
      expect(p.sensitiveJoints, `${ex.id} يمسّ ${j}`).not.toContain(j);
  }
  const st = analyzeTemplates(m.templates, p.daysPerWeek, EXERCISE_BY_ID);
  for (const min of st.sessionMinutes)
    expect(min).toBeLessThanOrEqual(p.sessionMinutes * 1.1);
  // سقف 8 مجموعات مباشرة للعضلة في الجلسة
  expect(st.maxDirect).toBeLessThanOrEqual(8);
  if (st.ratio !== null && (st.ratio < RATIO_MIN || st.ratio > RATIO_MAX)) {
    expect(issues.some((i) => i.kind === "ratio")).toBe(true);
  }
  expect(m.rirByWeek).toHaveLength(4);
  expect(m.weeks).toBe(4);
  expect(m.deloadWeek).toBe(true);
}
