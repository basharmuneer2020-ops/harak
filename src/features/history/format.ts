import { ar } from "../../i18n/ar";

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${ar.dates.days[d.getDay()]} ${d.getDate()} ${ar.dates.months[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtShortDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${ar.dates.months[d.getMonth()]}`;
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
