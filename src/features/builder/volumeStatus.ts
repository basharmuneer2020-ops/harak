import { MINOR_MUSCLES } from "../../data/muscles";
import { MINOR_MIN, VOLUME_MAX, VOLUME_MIN } from "../../engine/builder";

/** حالة حجم العضلة مقابل هدفها: تحت / داخل / فوق */
export function volumeStatus(muscle: string, v: number): "low" | "ok" | "high" {
  if (MINOR_MUSCLES.includes(muscle as never))
    return v < MINOR_MIN ? "low" : "ok";
  if (v < VOLUME_MIN) return "low";
  if (v > VOLUME_MAX) return "high";
  return "ok";
}
