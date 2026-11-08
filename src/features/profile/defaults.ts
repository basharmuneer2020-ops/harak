import type { Profile } from "../../types";

/** القيم الافتراضية عند تخطّي الإعداد (F2): متوسّط، لياقة عامة، 3 أيام، 60 دقيقة، كل الأدوات */
export function defaultProfile(now = Date.now()): Profile {
  return {
    level: 2,
    goal: "general",
    daysPerWeek: 3,
    sessionMinutes: 60,
    equipment: ["bodyweight", "free", "machine"],
    sensitiveJoints: [],
    minPlateKg: 2.5,
    units: "kg",
    createdAt: now,
  };
}
