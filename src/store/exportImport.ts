/**
 * التصدير والاستيراد (F8): ملف JSON واحد بإصدار مخطّط، وتصدير السجل CSV،
 * واستيراد بتحقّقٍ من المخطّط ودمجٍ آمن. دوالّ صِرفة (الواجهة تتولّى الملفات).
 */
import type {
  CardioLog,
  Exercise,
  ExerciseState,
  ExportFile,
  Mesocycle,
  Meta,
  Profile,
  SessionLog,
} from "../types";
import type { Snapshot } from "./repo";

export const SCHEMA_VERSION = 1 as const;

export function toExportFile(snap: Snapshot, now = Date.now()): ExportFile {
  if (!snap.profile) throw new Error("لا يوجد ملف شخصي للتصدير");
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    profile: snap.profile,
    mesocycles: snap.mesocycles,
    sessions: snap.sessions,
    states: snap.states,
    cardio: snap.cardio,
    customExercises: snap.customExercises,
    meta: snap.meta,
  };
}

export function exportFileName(now = Date.now()): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, "0");
  return `harak-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

// ───────────── التحقّق من المخطّط ─────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

function checkProfile(p: unknown): string | null {
  if (!isObj(p)) return "profile";
  if (![1, 2, 3].includes(p.level as number)) return "profile.level";
  if (
    !["strength", "hypertrophy", "general", "endurance"].includes(
      p.goal as string,
    )
  )
    return "profile.goal";
  if (![2, 3, 4, 5, 6].includes(p.daysPerWeek as number))
    return "profile.daysPerWeek";
  if (![30, 45, 60, 75].includes(p.sessionMinutes as number))
    return "profile.sessionMinutes";
  if (!Array.isArray(p.equipment)) return "profile.equipment";
  if (!Array.isArray(p.sensitiveJoints)) return "profile.sensitiveJoints";
  if (![1.25, 2.5, 5].includes(p.minPlateKg as number))
    return "profile.minPlateKg";
  if (!["kg", "lb"].includes(p.units as string)) return "profile.units";
  return null;
}

function checkList<T>(
  v: unknown,
  name: string,
  item: (x: Record<string, unknown>) => boolean,
): string | null {
  if (!Array.isArray(v)) return name;
  for (let i = 0; i < v.length; i++) {
    if (!isObj(v[i]) || !item(v[i] as Record<string, unknown>))
      return `${name}[${i}]`;
  }
  return null as T extends never ? never : null;
}

export type ParseResult =
  { ok: true; file: ExportFile } | { ok: false; error: string };

/** يتحقّق من ملف النسخة الاحتياطية ويعيده مُنمّطاً، أو يحدّد أول حقلٍ غير صالح */
export function parseExportFile(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "json" };
  }
  if (!isObj(raw)) return { ok: false, error: "root" };
  if (raw.schemaVersion !== SCHEMA_VERSION)
    return { ok: false, error: "schemaVersion" };
  if (!isNum(raw.exportedAt)) return { ok: false, error: "exportedAt" };
  const err =
    checkProfile(raw.profile) ??
    checkList(
      raw.mesocycles,
      "mesocycles",
      (m) => isStr(m.id) && Array.isArray(m.templates),
    ) ??
    checkList(
      raw.sessions,
      "sessions",
      (s) => isStr(s.id) && isNum(s.startedAt) && Array.isArray(s.exercises),
    ) ??
    checkList(raw.states, "states", (s) => isStr(s.exerciseId)) ??
    checkList(
      raw.cardio,
      "cardio",
      (c) => isStr(c.id) && isNum(c.ts) && isNum(c.minutes),
    ) ??
    checkList(
      raw.customExercises,
      "customExercises",
      (e) => isStr(e.id) && isStr(e.pattern),
    );
  if (err) return { ok: false, error: err };
  if (raw.meta !== undefined && !isObj(raw.meta))
    return { ok: false, error: "meta" };
  return { ok: true, file: raw as unknown as ExportFile };
}

export function fileToSnapshot(f: ExportFile): Snapshot {
  return {
    profile: f.profile as Profile,
    mesocycles: f.mesocycles as Mesocycle[],
    sessions: f.sessions as SessionLog[],
    states: f.states as ExerciseState[],
    cardio: f.cardio as CardioLog[],
    customExercises: f.customExercises as Exercise[],
    meta: (f.meta ?? {}) as Meta,
  };
}

function unionById<T>(
  cur: T[],
  inc: T[],
  key: (x: T) => string,
  prefer?: (a: T, b: T) => T,
): T[] {
  const map = new Map<string, T>();
  for (const x of cur) map.set(key(x), x);
  for (const x of inc) {
    const k = key(x);
    const have = map.get(k);
    if (!have) map.set(k, x);
    else if (prefer) map.set(k, prefer(have, x));
  }
  return [...map.values()];
}

/**
 * الدمج الآمن: يضيف الجديد ولا يمسح الموجود. عند تعارض المعرّف يبقى الموجود،
 * عدا حالة التقدّم حيث يبقى الأحدث تحديثاً. «replace» يستبدل كل شيء (بعد تأكيد المستخدم).
 */
export function mergeSnapshots(
  current: Snapshot,
  incoming: Snapshot,
  mode: "merge" | "replace",
): Snapshot {
  if (mode === "replace") return incoming;
  return {
    profile: current.profile ?? incoming.profile,
    mesocycles: unionById(
      current.mesocycles,
      incoming.mesocycles,
      (m) => m.id,
    ).sort((a, b) => a.createdAt - b.createdAt),
    sessions: unionById(current.sessions, incoming.sessions, (s) => s.id).sort(
      (a, b) => a.startedAt - b.startedAt,
    ),
    states: unionById(
      current.states,
      incoming.states,
      (s) => s.exerciseId,
      (a, b) => ((b.updatedAt ?? 0) > (a.updatedAt ?? 0) ? b : a),
    ),
    cardio: unionById(current.cardio, incoming.cardio, (c) => c.id).sort(
      (a, b) => a.ts - b.ts,
    ),
    customExercises: unionById(
      current.customExercises,
      incoming.customExercises,
      (e) => e.id,
    ),
    meta: { ...incoming.meta, ...current.meta },
  };
}

// ───────────── CSV ─────────────

function csvCell(v: string | number | undefined): string {
  const s = v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** تصدير السجل: صفٌّ لكل مجموعة */
export function sessionsToCsv(
  sessions: SessionLog[],
  exById: Record<string, Exercise>,
): string {
  const head = [
    "date",
    "session_id",
    "week",
    "exercise_id",
    "exercise_en",
    "exercise_ar",
    "set",
    "reps",
    "weight_kg",
    "rir",
    "e1rm",
  ];
  const rows = [head.join(",")];
  for (const s of [...sessions]
    .filter((x) => x.endedAt)
    .sort((a, b) => a.startedAt - b.startedAt)) {
    const date = new Date(s.startedAt).toISOString();
    for (const e of s.exercises) {
      const ex = exById[e.exerciseId];
      e.sets.forEach((set, i) => {
        const e1 =
          set.weightKg > 0 && set.reps > 0 && set.reps <= 12
            ? Math.round(set.weightKg * (1 + set.reps / 30) * 10) / 10
            : undefined;
        rows.push(
          [
            date,
            s.id,
            s.week,
            e.exerciseId,
            ex?.en,
            ex?.ar,
            i + 1,
            set.reps,
            set.weightKg,
            set.rir,
            e1,
          ]
            .map(csvCell)
            .join(","),
        );
      });
    }
  }
  // BOM ليعرض Excel العربية بشكلٍ صحيح
  return "﻿" + rows.join("\n") + "\n";
}

// ───────────── تذكير النسخ الاحتياطي ─────────────

export const BACKUP_DAYS = 30;
export const BACKUP_SESSIONS = 12;
export const BACKUP_SNOOZE_DAYS = 3;

/** تذكيرٌ لطيف كل 30 يوماً أو 12 جلسة منذ آخر تصدير */
export function backupDue(
  meta: Meta,
  finishedSessions: number,
  profileCreatedAt: number,
  now = Date.now(),
): boolean {
  if (
    meta.backupSnoozedAt &&
    now - meta.backupSnoozedAt < BACKUP_SNOOZE_DAYS * 86_400_000
  )
    return false;
  const since = meta.lastExportAt ?? profileCreatedAt;
  const sessionsSince = finishedSessions - (meta.sessionsAtLastExport ?? 0);
  if (finishedSessions === 0) return false;
  return (
    now - since >= BACKUP_DAYS * 86_400_000 || sessionsSince >= BACKUP_SESSIONS
  );
}
