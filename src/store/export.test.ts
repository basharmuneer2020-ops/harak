import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISE_BY_ID } from "../data/exercises";
import { buildMesocycle } from "../engine/builder";
import type { Snapshot } from "./repo";
import { createRepo } from "./repo";
import { HarakDB } from "./db";
import {
  backupDue,
  fileToSnapshot,
  mergeSnapshots,
  parseExportFile,
  sessionsToCsv,
  toExportFile,
} from "./exportImport";

function sample(): Snapshot {
  const profile = {
    level: 2 as const,
    goal: "hypertrophy" as const,
    daysPerWeek: 4 as const,
    sessionMinutes: 60 as const,
    equipment: ["free", "machine"] as ("free" | "machine")[],
    sensitiveJoints: ["knee"] as "knee"[],
    minPlateKg: 2.5 as const,
    units: "kg" as const,
    createdAt: 1000,
  };
  const meso = buildMesocycle({
    profile,
    exercises: EXERCISES,
    now: 2000,
    id: "meso-1",
  });
  return {
    profile,
    mesocycles: [meso],
    sessions: [
      {
        id: "s1",
        mesocycleId: "meso-1",
        templateId: "t1",
        week: 1,
        index: 0,
        startedAt: 3000,
        endedAt: 6000,
        readiness: { sleep: 4, soreness: 4, energy: 5 },
        exercises: [
          {
            exerciseId: "dumbbell-bench-press",
            sets: [
              { reps: 10, weightKg: 22.5, rir: 2, ts: 3100 },
              { reps: 9, weightKg: 22.5, rir: 1, ts: 3300 },
            ],
            target: {
              sets: 3,
              reps: [6, 12],
              rir: 2,
              restSec: 120,
              weightKg: 22.5,
            },
            slotIndex: 0,
          },
        ],
        volumeKg: 427.5,
        decisions: [
          {
            exerciseId: "dumbbell-bench-press",
            kind: "hold",
            fromKg: 22.5,
            toKg: 22.5,
          },
        ],
      },
    ],
    states: [
      {
        exerciseId: "dumbbell-bench-press",
        nextWeightKg: 22.5,
        consecutiveFails: 0,
        bestE1RM: 30,
        updatedAt: 6000,
      },
    ],
    cardio: [
      {
        id: "c1",
        ts: 7000,
        type: "walk",
        minutes: 30,
        intensity: "moderate",
        note: "مساءً",
      },
    ],
    customExercises: [
      {
        id: "custom-1",
        ar: "ضغط مائل بالدمبل",
        en: "incline dumbbell press",
        pattern: "hpush",
        equip: "free",
        diff: 2,
        primary: ["chest", "front delt"],
        secondary: ["triceps"],
        cues: [],
        mistakes: [],
        joints: [],
        custom: true,
      },
    ],
    meta: {
      disclaimerAcceptedAt: 1000,
      lastExportAt: 8000,
      sessionsAtLastExport: 1,
    },
  };
}

describe("التصدير والاستيراد", () => {
  it("تصدير ثم استيراد يعيد البيانات مطابقة (round-trip)", () => {
    const snap = sample();
    const text = JSON.stringify(toExportFile(snap, 9000));
    const parsed = parseExportFile(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.file.schemaVersion).toBe(1);
    expect(fileToSnapshot(parsed.file)).toEqual(snap);
  });

  it("round-trip كامل عبر IndexedDB: تصدير → مسح → استيراد → قراءة", async () => {
    const repo = createRepo(new HarakDB("harak-test-roundtrip"));
    const snap = sample();
    await repo.replaceAll(snap);
    const exported = JSON.stringify(toExportFile(await repo.loadAll(), 9000));
    await repo.clearAll();
    expect((await repo.loadAll()).sessions).toHaveLength(0);
    const parsed = parseExportFile(exported);
    if (!parsed.ok) throw new Error(parsed.error);
    await repo.replaceAll(
      mergeSnapshots(
        await repo.loadAll(),
        fileToSnapshot(parsed.file),
        "merge",
      ),
    );
    expect(await repo.loadAll()).toEqual(snap);
  });

  it("يرفض الملفات غير الصالحة ويحدّد السبب", () => {
    expect(parseExportFile("not json")).toEqual({ ok: false, error: "json" });
    expect(parseExportFile('{"schemaVersion":2}')).toEqual({
      ok: false,
      error: "schemaVersion",
    });
    const bad = { ...toExportFile(sample()), profile: { level: 9 } };
    expect(parseExportFile(JSON.stringify(bad))).toEqual({
      ok: false,
      error: "profile.level",
    });
    const bad2 = { ...toExportFile(sample()), sessions: [{ id: 1 }] };
    expect(parseExportFile(JSON.stringify(bad2))).toEqual({
      ok: false,
      error: "sessions[0]",
    });
  });

  it("الدمج الآمن لا يمسح الموجود، ويضيف الجديد", () => {
    const cur = sample();
    const inc = sample();
    inc.sessions = [{ ...inc.sessions[0], id: "s2", startedAt: 10_000 }];
    inc.cardio = [];
    inc.states = [{ ...inc.states[0], nextWeightKg: 25, updatedAt: 9999 }];
    inc.profile = { ...inc.profile!, level: 3 };
    const m = mergeSnapshots(cur, inc, "merge");
    expect(m.sessions.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(m.cardio).toHaveLength(1); // الموجود باقٍ
    expect(m.profile?.level).toBe(2); // الملف الحالي لا يُستبدل في الدمج
    expect(m.states[0].nextWeightKg).toBe(25); // حالة التقدّم الأحدث
    expect(mergeSnapshots(cur, inc, "replace")).toBe(inc);
  });

  it("تصدير السجل CSV: صفٌّ لكل مجموعة مع رأس", () => {
    const csv = sessionsToCsv(sample().sessions, EXERCISE_BY_ID);
    const lines = csv.trim().split("\n");
    expect(lines[0].replace("﻿", "")).toBe(
      "date,session_id,week,exercise_id,exercise_en,exercise_ar,set,reps,weight_kg,rir,e1rm",
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("dumbbell-bench-press,dumbbell bench press");
    expect(lines[1]).toContain(",1,10,22.5,2,30");
  });

  it("تذكير النسخ الاحتياطي كل 30 يوماً أو 12 جلسة", () => {
    const day = 86_400_000;
    expect(backupDue({}, 0, 0, 40 * day)).toBe(false); // لا جلسات بعد
    expect(backupDue({}, 1, 0, 31 * day)).toBe(true);
    expect(
      backupDue(
        { lastExportAt: 10 * day, sessionsAtLastExport: 2 },
        13,
        0,
        20 * day,
      ),
    ).toBe(false);
    expect(
      backupDue(
        { lastExportAt: 10 * day, sessionsAtLastExport: 2 },
        14,
        0,
        20 * day,
      ),
    ).toBe(true);
    expect(backupDue({ backupSnoozedAt: 39 * day }, 20, 0, 40 * day)).toBe(
      false,
    );
  });
});
