import { describe, expect, it } from "vitest";
import type { CardioLog, SessionLog } from "../types";
import {
  addDays,
  bestSetOf,
  cardioEquivalentMinutes,
  dayKey,
  exerciseSeries,
  parseDayKey,
  sessionsInMonth,
  streakWeeks,
  strengthDays,
  weekStart,
  whoWeek,
} from "./analytics";

// السبت 7 نوفمبر 2026، 10 صباحاً (بالتوقيت المحلي)
const SAT = new Date(2026, 10, 7, 10).getTime();

function sess(ts: number, sets: [number, number][] = [[10, 20]]): SessionLog {
  return {
    id: `s${ts}`,
    startedAt: ts,
    endedAt: ts + 3600_000,
    exercises: [
      {
        exerciseId: "goblet-squat",
        sets: sets.map(([reps, weightKg]) => ({ reps, weightKg, rir: 2, ts })),
      },
    ],
    volumeKg: 0,
  };
}

describe("الأسبوع يبدأ السبت", () => {
  it("weekStart يعيد السبت 00:00", () => {
    const tue = addDays(SAT, 3);
    const ws = new Date(weekStart(tue));
    expect(ws.getDay()).toBe(6);
    expect(ws.getDate()).toBe(7);
    expect(ws.getHours()).toBe(0);
    // الجمعة آخر يوم في الأسبوع نفسه
    expect(weekStart(addDays(SAT, 6))).toBe(weekStart(SAT));
    expect(weekStart(addDays(SAT, 7))).not.toBe(weekStart(SAT));
  });

  it("مفتاح اليوم ذهاباً وإياباً", () => {
    expect(dayKey(SAT)).toBe("2026-11-07");
    expect(dayKey(parseDayKey("2026-11-07")!)).toBe("2026-11-07");
    expect(parseDayKey("bad")).toBeNull();
  });
});

describe("مؤشّرات WHO", () => {
  const cardio: CardioLog[] = [
    { id: "c1", ts: SAT, type: "walk", minutes: 30, intensity: "moderate" },
    {
      id: "c2",
      ts: addDays(SAT, 1),
      type: "run",
      minutes: 20,
      intensity: "vigorous",
    },
    {
      id: "c3",
      ts: addDays(SAT, -1),
      type: "bike",
      minutes: 60,
      intensity: "moderate",
    },
  ];

  it("الدقيقة الشديدة تُحسب دقيقتين معتدلتين", () => {
    const from = weekStart(SAT);
    expect(cardioEquivalentMinutes(cardio, from, addDays(from, 7))).toBe(70);
  });

  it("30 دقيقة معتدلة → 30 من 150", () => {
    const w = whoWeek([], [cardio[0]], SAT);
    expect(w.cardioMinutes).toBe(30);
    expect(w.cardioMet).toBe(false);
  });

  it("أيام التقوية: أيامٌ تقويمية فيها جلسة منتهية", () => {
    const s = [sess(SAT), sess(SAT + 3600_000 * 3), sess(addDays(SAT, 2))];
    expect(strengthDays(s, weekStart(SAT), addDays(weekStart(SAT), 7))).toBe(2);
    expect(whoWeek(s, [], SAT).strengthMet).toBe(true);
  });
});

describe("الالتزام والتحليلات", () => {
  it("سلسلة الأسابيع التي حقّقت يومَي تقوية", () => {
    const s = [
      sess(SAT),
      sess(addDays(SAT, 2)),
      sess(addDays(SAT, -7)),
      sess(addDays(SAT, -5)),
      sess(addDays(SAT, -14)), // أسبوعٌ بيومٍ واحد يكسر السلسلة
    ];
    expect(streakWeeks(s, addDays(SAT, 3))).toBe(2);
    // الأسبوع الجاري غير المكتمل لا يكسرها
    expect(streakWeeks(s.slice(2), addDays(SAT, 1))).toBe(1);
  });

  it("جلسات الشهر", () => {
    expect(sessionsInMonth([sess(SAT), sess(addDays(SAT, 30))], 2026, 10)).toBe(
      1,
    );
  });

  it("سلسلة e1RM لكل تمرين وأفضل مجموعة", () => {
    const s = [
      sess(SAT, [
        [10, 20],
        [8, 25],
      ]),
      sess(addDays(SAT, 2), [[10, 25]]),
    ];
    const pts = exerciseSeries(s, "goblet-squat");
    expect(pts).toHaveLength(2);
    expect(pts[0].e1rm).toBeCloseTo(31.7, 1); // 25 × (1 + 8/30)
    expect(pts[1].e1rm).toBeCloseTo(33.3, 1);
    expect(pts[0].volumeKg).toBe(400);
    expect(bestSetOf(s, "goblet-squat")?.set.weightKg).toBe(25);
  });
});
