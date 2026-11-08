import type { Equip } from "../../types";

/** يقرأ فلتر الأداة من رابط الصفحة */
export function parseEquip(v: string | null): Equip | "all" {
  return v === "bodyweight" || v === "free" || v === "machine" ? v : "all";
}
