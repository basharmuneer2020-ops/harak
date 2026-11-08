/**
 * محرّك التقدّم (قسم 2.5) — التقدّم المزدوج (double progression):
 * 1) مجال تكرارات [low, high] من الوصف.
 * 2) بلوغ high في كل المجموعات مع RIR ≥ المستهدف → ارفع الحِمل: +2.5 كغ للعلوي،
 *    +5 كغ للسفلي (أو أقرب قفزة متاحة)؛ ولوزن الجسم: الدرجة التالية في السلّم عند
 *    high+3، وإلا أضف تكراراً.
 * 3) العجز عن low في جلستين متتاليتين → خفّض 10% أو تراجع درجة («تراجع تكتيكي»).
 * 4) غير ذلك → ثبّت الحِمل وحاول زيادة التكرارات.
 * ويرصد شروط التفريغ المبكر (2.6). دوالّ صِرفة.
 */
import { chainPosition } from "../data/chains";
import type {
  Exercise,
  ExerciseLog,
  ExerciseState,
  Profile,
  ProgressionDecision,
  SessionLog,
  SetLog,
} from "../types";
import { bestE1RM, bestReps } from "./e1rm";
import { roundToPlate } from "./load";
import { isUpperBody } from "./prescription";
import { LOW_READINESS_STREAK, lowReadinessStreak } from "./readiness";

export { bestE1RM, epley, setE1RM, E1RM_MAX_REPS } from "./e1rm";

export const UPPER_INCREMENT_KG = 2.5;
export const LOWER_INCREMENT_KG = 5;
export const RETREAT_FACTOR = 0.9;
export const FAILS_TO_RETREAT = 2;
/** تمارين وزن الجسم تنتقل للدرجة التالية عند high + 3 */
export const CHAIN_BONUS_REPS = 3;
/** ما يقابل «3 تكرارات» في التمارين الموقوتة (ثوانٍ) */
export const CHAIN_BONUS_SECONDS = 15;

/** قفزة الحِمل: 2.5 للعلوي و5 للسفلي، مقرّبةً لأقرب قفزة أوزان متاحة */
export function loadIncrement(
  ex: Pick<Exercise, "pattern">,
  plateKg: number,
): number {
  const base = isUpperBody(ex) ? UPPER_INCREMENT_KG : LOWER_INCREMENT_KG;
  return Math.max(plateKg, roundToPlate(base, plateKg));
}

function workingWeight(sets: SetLog[], target?: number): number {
  const w = Math.max(0, ...sets.map((s) => s.weightKg));
  return w > 0 ? w : (target ?? 0);
}

/** هل التمرين يتقدّم بالوزن الخارجي (لا بالسلّم/التكرارات)؟ */
/** وزن التراجع: −10% لأقرب قفزة متاحة، مع خفضٍ بقفزةٍ واحدة على الأقل */
export function retreatWeight(kg: number, plateKg: number): number {
  const near = roundToPlate(kg * RETREAT_FACTOR, plateKg);
  return Math.max(0, Math.min(near, Math.round((kg - plateKg) * 100) / 100));
}

export function isLoaded(ex: Exercise, sets: SetLog[]): boolean {
  if (ex.equip !== "bodyweight") return true;
  return sets.some((s) => s.weightKg > 0);
}

export interface ProgressionInput {
  ex: Exercise;
  log: ExerciseLog;
  state?: ExerciseState;
  profile: Pick<Profile, "minPlateKg" | "equipment" | "sensitiveJoints">;
  exById: Record<string, Exercise>;
  /** جلسة تفريغ: لا تغيير في الأحمال */
  deload?: boolean;
  now?: number;
}

export interface ProgressionResult {
  decision: ProgressionDecision;
  state: ExerciseState;
}

/** درجةٌ مجاورة في السلّم صالحة للمستخدم (أداة متاحة، لا مفصل حسّاس) */
function chainNeighbour(
  ex: Exercise,
  dir: 1 | -1,
  input: ProgressionInput,
): Exercise | null {
  const pos = chainPosition(ex.id);
  if (!pos) return null;
  const ok = (e?: Exercise): e is Exercise =>
    !!e &&
    input.profile.equipment.includes(e.equip) &&
    !e.joints.some((j) => input.profile.sensitiveJoints.includes(j));
  const cand = input.exById[pos.chain.stages[pos.index + dir] ?? ""];
  if (ok(cand)) return cand;
  // صعوداً: إن تعذّرت الدرجة التالية فالبديل بالأوزان إن وُجد (مثل قرفصاء الكأس)
  if (dir === 1 && pos.chain.weightedAlt) {
    const alt = input.exById[pos.chain.weightedAlt];
    if (ok(alt)) return alt;
  }
  return null;
}

export function progress(input: ProgressionInput): ProgressionResult {
  const { ex, log, profile } = input;
  const now = input.now ?? Date.now();
  const prev: ExerciseState = input.state ?? {
    exerciseId: ex.id,
    consecutiveFails: 0,
    updatedAt: now,
  };
  const sets = log.sets;
  const target = log.target;
  const e1 = bestE1RM(sets);
  const br = bestReps(sets);
  const base: ExerciseState = {
    ...prev,
    exerciseId: ex.id,
    updatedAt: now,
    bestE1RM:
      e1 !== undefined ? Math.max(prev.bestE1RM ?? 0, e1) : prev.bestE1RM,
    bestReps:
      br !== undefined ? Math.max(prev.bestReps ?? 0, br) : prev.bestReps,
  };
  const pos = chainPosition(ex.id);
  if (pos) base.chainStage = pos.index;

  const decide = (
    d: Omit<ProgressionDecision, "exerciseId">,
    patch: Partial<ExerciseState> = {},
  ): ProgressionResult => ({
    decision: { exerciseId: ex.id, ...d },
    state: { ...base, ...patch, lastDecision: d.kind },
  });

  if (!sets.length || !target) return decide({ kind: "none" });
  if (log.painFlag) return decide({ kind: "none", reason: "pain" });
  if (input.deload) return decide({ kind: "none", reason: "deload" });

  const [low, high] = target.reps;
  const loaded = isLoaded(ex, sets);
  const weight = workingWeight(sets, target.weightKg);
  const allHigh = sets.every((s) => s.reps >= high);
  const rirOk = sets.every((s) => s.rir >= target.rir);
  const failed = sets.some((s) => s.reps < low);
  // تمرين بأوزان سُجّل بلا وزن: لا قرار حِمل حتى يُسجَّل الوزن
  if (ex.equip !== "bodyweight" && weight <= 0) {
    return decide({ kind: "hold", reason: "noWeight" });
  }
  const bonus = ex.timed ? CHAIN_BONUS_SECONDS : CHAIN_BONUS_REPS;

  // 2) نجاح: كل المجموعات بلغت high بجهدٍ ضمن المستهدف
  if (allHigh && rirOk) {
    if (loaded) {
      const to =
        Math.round((weight + loadIncrement(ex, profile.minPlateKg)) * 100) /
        100;
      return decide(
        { kind: "increase", fromKg: weight, toKg: to },
        { nextWeightKg: to, consecutiveFails: 0, nextReps: undefined },
      );
    }
    // وزن الجسم: الدرجة التالية عند high+3 في كل المجموعات، وإلا أضف تكراراً
    if (sets.every((s) => s.reps >= high + bonus)) {
      const next = chainNeighbour(ex, 1, input);
      if (next) {
        return decide(
          { kind: "advance", toExerciseId: next.id },
          { consecutiveFails: 0, nextReps: undefined },
        );
      }
    }
    const best = br ?? high;
    const nextReps = Math.min(high + bonus, best + (ex.timed ? 5 : 1));
    return decide(
      { kind: "reps", reason: String(nextReps) },
      { consecutiveFails: 0, nextReps },
    );
  }

  // 3) إخفاق: لم يبلغ low — بعد جلستين متتاليتين تراجعٌ تكتيكي
  if (failed) {
    const fails = prev.consecutiveFails + 1;
    if (fails >= FAILS_TO_RETREAT) {
      if (loaded && weight > 0) {
        const to = retreatWeight(weight, profile.minPlateKg);
        return decide(
          { kind: "decrease", fromKg: weight, toKg: to, reason: "retreat" },
          { nextWeightKg: to, consecutiveFails: 0 },
        );
      }
      const prevStage = chainNeighbour(ex, -1, input);
      if (prevStage) {
        return decide(
          { kind: "regress", toExerciseId: prevStage.id, reason: "retreat" },
          { consecutiveFails: 0, nextReps: undefined },
        );
      }
    }
    return decide(
      {
        kind: "hold",
        fromKg: loaded ? weight : undefined,
        toKg: loaded ? weight : undefined,
        reason: "fail",
      },
      {
        consecutiveFails: fails,
        nextWeightKg: loaded ? weight : prev.nextWeightKg,
      },
    );
  }

  // 4) غير ذلك: ثبّت الحِمل وحاول زيادة التكرارات
  return decide(
    {
      kind: "hold",
      fromKg: loaded ? weight : undefined,
      toKg: loaded ? weight : undefined,
    },
    { consecutiveFails: 0, nextWeightKg: loaded ? weight : prev.nextWeightKg },
  );
}

// ───────────── التفريغ المبكر (2.6) ─────────────

/** مقياس الأداء لتمرينٍ في جلسة: أفضل e1RM، أو أفضل تكرارات/ثوانٍ لوزن الجسم */
export function performanceOf(sets: SetLog[]): number | undefined {
  return bestE1RM(sets) ?? bestReps(sets);
}

/** في جلسةٍ ما: كم تمريناً تراجع أداؤه مقارنةً بآخر مرّة أُدّي فيها */
export function sessionDecline(
  session: SessionLog,
  history: SessionLog[],
): { declined: number; compared: number } {
  let declined = 0;
  let compared = 0;
  const earlier = history
    .filter((h) => h.endedAt && h.startedAt < session.startedAt)
    .sort((a, b) => b.startedAt - a.startedAt);
  for (const e of session.exercises) {
    if (!e.sets.length || e.painFlag) continue;
    const now = performanceOf(e.sets);
    if (now === undefined) continue;
    const prevLog = earlier
      .flatMap((h) => h.exercises)
      .find((x) => x.exerciseId === e.exerciseId && x.sets.length);
    if (!prevLog) continue;
    const before = performanceOf(prevLog.sets);
    if (before === undefined) continue;
    compared++;
    if (now < before * 0.995) declined++;
  }
  return { declined, compared };
}

export type DeloadSignal = "readiness" | "performance" | null;

/**
 * يقترح تفريغاً مبكراً إذا: الاستعداد منخفض 3 أيام تدريبٍ متتالية،
 * أو تراجع الأداء في ≥ 50% من التمارين في جلستين متتاليتين.
 */
export function earlyDeloadSignal(
  mesoSessions: SessionLog[],
  allSessions: SessionLog[],
): DeloadSignal {
  const done = mesoSessions
    .filter((s) => s.endedAt && !s.deload)
    .sort((a, b) => a.startedAt - b.startedAt);
  if (lowReadinessStreak(done) >= LOW_READINESS_STREAK) return "readiness";
  const last2 = done.slice(-2);
  if (last2.length === 2) {
    const ok = last2.every((s) => {
      const d = sessionDecline(s, allSessions);
      return d.compared > 0 && d.declined / d.compared >= 0.5;
    });
    if (ok) return "performance";
  }
  return null;
}
