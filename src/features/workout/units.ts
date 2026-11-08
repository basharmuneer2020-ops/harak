import type { Profile } from "../../types";

/** تُخزَّن الأوزان دائماً بالكيلوغرام، وتُعرض بوحدة المستخدم */
export const LB_PER_KG = 2.20462;

export type Units = Profile["units"];

export function fmtNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function toUnit(kg: number, units: Units): number {
  if (units === "lb") return Math.round(kg * LB_PER_KG * 2) / 2;
  return Math.round(kg * 100) / 100;
}

export function fromUnit(v: number, units: Units): number {
  if (units === "lb") return Math.round((v / LB_PER_KG) * 100) / 100;
  return v;
}

/** خطوة زرّي ± للوزن: أصغر قفزة (وضعفها تقريباً بالرطل) */
export function weightStep(plateKg: number, units: Units): number {
  return units === "lb" ? plateKg * 2 : plateKg;
}

export function fmtWeight(kg: number, units: Units): string {
  return `${fmtNum(toUnit(kg, units))} ${units}`;
}
