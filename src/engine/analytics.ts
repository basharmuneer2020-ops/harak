/**
 * التحليلات ومؤشّرات WHO (القسمان 2.1 و2.10 وF6): أيام التقوية، دقائق الكارديو
 * المكافئة، سلسلة الالتزام، وسلاسل تقدّم كل تمرين. دوالّ صِرفة.
 */
import type { CardioLog, SessionLog, SetLog } from "../types";
import { bestE1RM, bestReps, setE1RM } from "./e1rm";

/** الأسبوع يبدأ السبت (القرار D-24): 6 بترقيم getDay */
export const WEEK_START_DAY = 6;
export const DAY_MS = 86_400_000;
export const WHO_MODERATE_MIN = 150;
export const WHO_MODERATE_MAX = 300;
export const WHO_STRENGTH_DAYS = 2;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** بداية الأسبوع (السبت 00:00 بالتوقيت المحلي) الذي يقع فيه ts */
export function weekStart(ts: number, startDay = WEEK_START_DAY): number {
  const d = new Date(startOfDay(ts));
  const diff = (d.getDay() - startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function addDays(ts: number, n: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/** مفتاح اليوم المحلي بصيغة YYYY-MM-DD */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDayKey(key: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

function finished(sessions: SessionLog[]): SessionLog[] {
  return sessions.filter((s) => s.endedAt);
}

/** أيام التقوية: أيامٌ تقويمية فيها جلسة مقاومة منتهية ضمن [from, to) */
export function strengthDays(
  sessions: SessionLog[],
  from: number,
  to: number,
): number {
  const days = new Set<string>();
  for (const s of finished(sessions)) {
    if (s.startedAt >= from && s.startedAt < to) days.add(dayKey(s.startedAt));
  }
  return days.size;
}

/** الدقائق المعتدلة المكافئة: المعتدلة + 2 × الشديدة */
export function cardioEquivalentMinutes(
  cardio: CardioLog[],
  from: number,
  to: number,
): number {
  let m = 0;
  for (const c of cardio) {
    if (c.ts < from || c.ts >= to) continue;
    m += c.intensity === "vigorous" ? 2 * c.minutes : c.minutes;
  }
  return m;
}

export interface WhoWeek {
  from: number;
  to: number;
  cardioMinutes: number;
  strengthDays: number;
  cardioMet: boolean;
  strengthMet: boolean;
}

export function whoWeek(
  sessions: SessionLog[],
  cardio: CardioLog[],
  now = Date.now(),
): WhoWeek {
  const from = weekStart(now);
  const to = addDays(from, 7);
  const cardioMinutes = cardioEquivalentMinutes(cardio, from, to);
  const sd = strengthDays(sessions, from, to);
  return {
    from,
    to,
    cardioMinutes,
    strengthDays: sd,
    cardioMet: cardioMinutes >= WHO_MODERATE_MIN,
    strengthMet: sd >= WHO_STRENGTH_DAYS,
  };
}

/**
 * سلسلة الالتزام بالأسابيع: عدد الأسابيع المتتالية التي حقّقت ≥ 2 أيام تقوية.
 * الأسبوع الجاري يُحسب إن تحقّق، ولا يكسر السلسلة إن لم يكتمل بعد.
 */
export function streakWeeks(sessions: SessionLog[], now = Date.now()): number {
  let w = weekStart(now);
  let n = 0;
  if (strengthDays(sessions, w, addDays(w, 7)) >= WHO_STRENGTH_DAYS) n++;
  for (;;) {
    w = addDays(w, -7);
    if (strengthDays(sessions, w, addDays(w, 7)) >= WHO_STRENGTH_DAYS) n++;
    else break;
    if (n > 520) break;
  }
  return n;
}

export function sessionsInMonth(
  sessions: SessionLog[],
  year: number,
  month: number,
): number {
  return finished(sessions).filter((s) => {
    const d = new Date(s.startedAt);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

export interface SeriesPoint {
  ts: number;
  sessionId: string;
  e1rm?: number;
  bestReps?: number;
  volumeKg: number;
  sets: number;
}

/** سلسلة تقدّم تمرين: نقطة لكل جلسة منتهية أُدّي فيها */
export function exerciseSeries(
  sessions: SessionLog[],
  exerciseId: string,
): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (const s of finished(sessions).sort(
    (a, b) => a.startedAt - b.startedAt,
  )) {
    const sets: SetLog[] = s.exercises
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => e.sets);
    if (!sets.length) continue;
    out.push({
      ts: s.startedAt,
      sessionId: s.id,
      e1rm: bestE1RM(sets),
      bestReps: bestReps(sets),
      volumeKg:
        Math.round(sets.reduce((v, x) => v + x.weightKg * x.reps, 0) * 10) / 10,
      sets: sets.length,
    });
  }
  return out;
}

/** أفضل مجموعة: أعلى e1RM، وإلا أكثر تكرارات */
export function bestSetOf(
  sessions: SessionLog[],
  exerciseId: string,
): { set: SetLog; ts: number } | null {
  let best: { set: SetLog; ts: number; score: number } | null = null;
  for (const s of finished(sessions)) {
    for (const e of s.exercises) {
      if (e.exerciseId !== exerciseId) continue;
      for (const set of e.sets) {
        const score = setE1RM(set) ?? set.reps / 1000;
        if (!best || score > best.score) best = { set, ts: s.startedAt, score };
      }
    }
  }
  return best ? { set: best.set, ts: best.ts } : null;
}

/** التمارين المؤدّاة مرتّبةً بآخر أداء */
export function performedExercises(
  sessions: SessionLog[],
): { exerciseId: string; last: number; count: number }[] {
  const map = new Map<string, { last: number; count: number }>();
  for (const s of finished(sessions)) {
    for (const e of s.exercises) {
      if (!e.sets.length) continue;
      const cur = map.get(e.exerciseId) ?? { last: 0, count: 0 };
      cur.last = Math.max(cur.last, s.startedAt);
      cur.count++;
      map.set(e.exerciseId, cur);
    }
  }
  return [...map.entries()]
    .map(([exerciseId, v]) => ({ exerciseId, ...v }))
    .sort((a, b) => b.last - a.last);
}
