import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID } from "../data/exercises";
import type { ExerciseLog, ExerciseState, Profile, SessionLog } from "../types";
import {
  bestE1RM,
  earlyDeloadSignal,
  epley,
  loadIncrement,
  progress,
  retreatWeight,
  sessionDecline,
  setE1RM,
} from "./progression";

const profile: Pick<Profile, "minPlateKg" | "equipment" | "sensitiveJoints"> = {
  minPlateKg: 2.5,
  equipment: ["bodyweight", "free", "machine"],
  sensitiveJoints: [],
};

function log(
  exerciseId: string,
  sets: [number, number, number][],
  target: { reps: [number, number]; rir: number; weightKg?: number },
): ExerciseLog {
  return {
    exerciseId,
    sets: sets.map(([reps, weightKg, rir]) => ({ reps, weightKg, rir, ts: 0 })),
    target: { sets: sets.length, restSec: 120, ...target },
  };
}

const run = (
  exId: string,
  l: ExerciseLog,
  state?: ExerciseState,
  p = profile,
  deload = false,
) =>
  progress({
    ex: EXERCISE_BY_ID[exId],
    log: l,
    state,
    profile: p,
    exById: EXERCISE_BY_ID,
    deload,
    now: 1,
  });

describe("التقدّم المزدوج: رفع الحِمل", () => {
  it("بلوغ السقف في كل المجموعات بـ RIR كافٍ → +2.5 كغ للعلوي", () => {
    const r = run(
      "dumbbell-bench-press",
      log(
        "dumbbell-bench-press",
        [
          [12, 20, 2],
          [12, 20, 2],
          [12, 20, 3],
        ],
        { reps: [6, 12], rir: 2 },
      ),
    );
    expect(r.decision.kind).toBe("increase");
    expect(r.decision.toKg).toBe(22.5);
    expect(r.state.nextWeightKg).toBe(22.5);
    expect(r.state.consecutiveFails).toBe(0);
  });

  it("… و +5 كغ للسفلي", () => {
    const r = run(
      "back-squat",
      log(
        "back-squat",
        [
          [12, 60, 2],
          [12, 60, 2],
          [12, 60, 2],
        ],
        { reps: [6, 12], rir: 2 },
      ),
    );
    expect(r.decision.kind).toBe("increase");
    expect(r.decision.toKg).toBe(65);
  });

  it("أقرب قفزة أوزان متاحة: بقفزة 5 كغ يصبح العلوي +5", () => {
    expect(loadIncrement(EXERCISE_BY_ID["dumbbell-bench-press"], 5)).toBe(5);
    expect(loadIncrement(EXERCISE_BY_ID["dumbbell-bench-press"], 1.25)).toBe(
      2.5,
    );
    expect(loadIncrement(EXERCISE_BY_ID["leg-press"], 2.5)).toBe(5);
  });

  it("RIR أقل من المستهدف رغم بلوغ السقف → ثبات (لا رفع)", () => {
    const r = run(
      "dumbbell-bench-press",
      log(
        "dumbbell-bench-press",
        [
          [12, 20, 1],
          [12, 20, 0],
          [12, 20, 1],
        ],
        { reps: [6, 12], rir: 2 },
      ),
    );
    expect(r.decision.kind).toBe("hold");
    expect(r.state.nextWeightKg).toBe(20);
  });

  it("لم يبلغ السقف في كل المجموعات → ثبّت الوزن وزد التكرارات", () => {
    const r = run(
      "dumbbell-bench-press",
      log(
        "dumbbell-bench-press",
        [
          [12, 20, 2],
          [10, 20, 2],
          [9, 20, 2],
        ],
        { reps: [6, 12], rir: 2 },
      ),
    );
    expect(r.decision.kind).toBe("hold");
    expect(r.state.nextWeightKg).toBe(20);
  });
});

describe("تمرين بأوزان بلا وزنٍ مسجّل", () => {
  it("لا يرفع من الصفر بل يطلب تسجيل الوزن", () => {
    const r = run(
      "weighted-step-up",
      log(
        "weighted-step-up",
        [
          [15, 0, 3],
          [15, 0, 3],
        ],
        { reps: [8, 15], rir: 3 },
      ),
    );
    expect(r.decision.kind).toBe("hold");
    expect(r.decision.reason).toBe("noWeight");
  });
});

describe("التراجع التكتيكي", () => {
  const failing = log(
    "dumbbell-bench-press",
    [
      [5, 30, 0],
      [4, 30, 0],
      [4, 30, 0],
    ],
    {
      reps: [6, 12],
      rir: 2,
    },
  );

  it("إخفاقٌ أول → ثبات مع عدّاد إخفاق = 1", () => {
    const r = run("dumbbell-bench-press", failing);
    expect(r.decision.kind).toBe("hold");
    expect(r.state.consecutiveFails).toBe(1);
  });

  it("الإخفاق في جلستين متتاليتين → خفض 10% (مقرّباً لأصغر قفزة)", () => {
    const r = run("dumbbell-bench-press", failing, {
      exerciseId: "dumbbell-bench-press",
      consecutiveFails: 1,
      updatedAt: 0,
    });
    expect(r.decision.kind).toBe("decrease");
    expect(r.decision.toKg).toBe(27.5); // 30 × 0.9 = 27 → أقرب قفزة 27.5
    expect(r.state.consecutiveFails).toBe(0);
  });

  it("الخفض بقفزةٍ واحدة على الأقل حتى للأوزان الخفيفة", () => {
    expect(retreatWeight(10, 2.5)).toBe(7.5);
    expect(retreatWeight(100, 2.5)).toBe(90);
  });

  it("جلسةٌ ناجحة بين إخفاقين تعيد العدّاد إلى الصفر", () => {
    const ok = log(
      "dumbbell-bench-press",
      [
        [8, 30, 2],
        [8, 30, 2],
        [7, 30, 2],
      ],
      {
        reps: [6, 12],
        rir: 2,
      },
    );
    const r = run("dumbbell-bench-press", ok, {
      exerciseId: "dumbbell-bench-press",
      consecutiveFails: 1,
      updatedAt: 0,
    });
    expect(r.state.consecutiveFails).toBe(0);
  });
});

describe("وزن الجسم: سلّم التدرّج", () => {
  it("بلوغ high دون high+3 → أضف تكراراً", () => {
    const r = run(
      "push-up",
      log(
        "push-up",
        [
          [12, 0, 2],
          [12, 0, 2],
          [13, 0, 2],
        ],
        { reps: [6, 12], rir: 2 },
      ),
    );
    expect(r.decision.kind).toBe("reps");
    expect(r.state.nextReps).toBe(14);
  });

  it("بلوغ high+3 في كل المجموعات → الدرجة التالية في السلّم", () => {
    const r = run(
      "incline-push-up",
      log(
        "incline-push-up",
        [
          [15, 0, 2],
          [15, 0, 2],
          [16, 0, 3],
        ],
        { reps: [6, 12], rir: 2 },
      ),
    );
    expect(r.decision.kind).toBe("advance");
    expect(r.decision.toExerciseId).toBe("push-up");
  });

  it("قمّة السلّم → يواصل زيادة التكرارات", () => {
    const r = run(
      "decline-push-up",
      log(
        "decline-push-up",
        [
          [15, 0, 2],
          [15, 0, 2],
        ],
        { reps: [6, 12], rir: 2 },
      ),
    );
    expect(r.decision.kind).toBe("reps");
  });

  it("لا ينتقل إلى درجةٍ تمسّ مفصلاً حسّاساً (القفز للركبة) بل إلى البديل بالأوزان", () => {
    const r = run(
      "bodyweight-squat",
      log(
        "bodyweight-squat",
        [
          [15, 0, 2],
          [15, 0, 2],
        ],
        { reps: [6, 12], rir: 2 },
      ),
      undefined,
      { ...profile, sensitiveJoints: ["knee"] },
    );
    expect(r.decision.kind).toBe("advance");
    expect(r.decision.toExerciseId).toBe("goblet-squat");
  });

  it("العجز عن low مرّتين → تراجع درجةٍ في السلّم", () => {
    const r = run(
      "push-up",
      log(
        "push-up",
        [
          [4, 0, 0],
          [3, 0, 0],
        ],
        { reps: [6, 12], rir: 2 },
      ),
      { exerciseId: "push-up", consecutiveFails: 1, updatedAt: 0 },
    );
    expect(r.decision.kind).toBe("regress");
    expect(r.decision.toExerciseId).toBe("incline-push-up");
  });
});

describe("e1RM بمعادلة Epley", () => {
  it("w × (1 + reps/30)", () => {
    expect(epley(100, 10)).toBeCloseTo(133.33, 2);
    expect(setE1RM({ reps: 5, weightKg: 60 })).toBe(70);
  });
  it("يستبعد المجموعات فوق 12 تكراراً وبلا وزن", () => {
    expect(setE1RM({ reps: 13, weightKg: 60 })).toBeNull();
    expect(setE1RM({ reps: 10, weightKg: 0 })).toBeNull();
    expect(
      bestE1RM([
        { reps: 15, weightKg: 100 },
        { reps: 8, weightKg: 50 },
        { reps: 5, weightKg: 55 },
      ]),
    ).toBeCloseTo(64.2, 1);
  });
  it("يحدّث أفضل e1RM في الحالة", () => {
    const r = run(
      "dumbbell-bench-press",
      log("dumbbell-bench-press", [[10, 30, 2]], { reps: [6, 12], rir: 2 }),
      {
        exerciseId: "dumbbell-bench-press",
        consecutiveFails: 0,
        bestE1RM: 35,
        updatedAt: 0,
      },
    );
    expect(r.state.bestE1RM).toBe(40);
  });
});

describe("التفريغ", () => {
  it("جلسة التفريغ لا تغيّر الأحمال", () => {
    const r = run(
      "dumbbell-bench-press",
      log("dumbbell-bench-press", [[12, 20, 4]], { reps: [6, 12], rir: 4 }),
      {
        exerciseId: "dumbbell-bench-press",
        consecutiveFails: 0,
        nextWeightKg: 25,
        updatedAt: 0,
      },
      profile,
      true,
    );
    expect(r.decision.kind).toBe("none");
    expect(r.state.nextWeightKg).toBe(25);
  });

  const sess = (
    i: number,
    readiness: number,
    sets: [number, number][],
  ): SessionLog => ({
    id: `s${i}`,
    startedAt: i * 1000,
    endedAt: i * 1000 + 500,
    readiness: { sleep: readiness, soreness: readiness, energy: readiness },
    exercises: [
      {
        exerciseId: "dumbbell-bench-press",
        sets: sets.map(([reps, weightKg]) => ({
          reps,
          weightKg,
          rir: 2,
          ts: 0,
        })),
      },
    ],
    volumeKg: 0,
  });

  it("تفريغ مبكر: استعدادٌ منخفض 3 أيام تدريبٍ متتالية", () => {
    const s = [
      sess(1, 2, [[10, 20]]),
      sess(2, 2, [[10, 20]]),
      sess(3, 2, [[10, 20]]),
    ];
    expect(earlyDeloadSignal(s, s)).toBe("readiness");
    const s2 = [
      sess(1, 2, [[10, 20]]),
      sess(2, 4, [[10, 20]]),
      sess(3, 2, [[10, 20]]),
    ];
    expect(earlyDeloadSignal(s2, s2)).toBeNull();
  });

  it("تفريغ مبكر: تراجع الأداء في ≥ 50% من التمارين في جلستين متتاليتين", () => {
    const s = [
      sess(1, 4, [[10, 30]]),
      sess(2, 4, [[8, 30]]),
      sess(3, 4, [[6, 30]]),
    ];
    expect(sessionDecline(s[2], s)).toEqual({ declined: 1, compared: 1 });
    expect(earlyDeloadSignal(s, s)).toBe("performance");
    const ok = [
      sess(1, 4, [[10, 30]]),
      sess(2, 4, [[8, 30]]),
      sess(3, 4, [[9, 30]]),
    ];
    expect(earlyDeloadSignal(ok, ok)).toBeNull();
  });
});
