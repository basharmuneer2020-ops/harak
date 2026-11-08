import { ar } from "../i18n/ar";
import type { Equip, Joint } from "../types";

export const EQUIP_IDS: Equip[] = ["bodyweight", "free", "machine"];

export const EQUIP_INFO: Record<
  Equip,
  { name: string; where: string; icon: "bodyweight" | "free" | "machine" }
> = {
  bodyweight: { ...ar.equip.bodyweight, icon: "bodyweight" },
  free: { ...ar.equip.free, icon: "free" },
  machine: { ...ar.equip.machine, icon: "machine" },
};

export const JOINT_IDS: Joint[] = [
  "shoulder",
  "knee",
  "lower_back",
  "wrist",
  "elbow",
  "hip",
];
