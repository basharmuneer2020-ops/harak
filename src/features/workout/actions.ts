import { EXERCISES } from "../../data/exercises";
import { bestE1RM, bestReps } from "../../engine/e1rm";
import { planSession, sessionVolumeKg } from "../../engine/session";
import { uid, useApp } from "../../store/useApp";
import type {
  ExerciseLog,
  Mesocycle,
  ReadinessChoice,
  SessionLog,
  SessionTemplate,
  SetLog,
} from "../../types";
import type { Readiness } from "../../engine/readiness";
import { swapInMesocycle } from "../builder/actions";
import { finalizeProgression } from "./progressionActions";

function exById() {
  const list = [...EXERCISES, ...useApp.getState().customExercises];
  return Object.fromEntries(list.map((e) => [e.id, e]));
}

function getSession(id: string): SessionLog {
  const s = useApp.getState().sessions.find((x) => x.id === id);
  if (!s) throw new Error("session not found");
  return s;
}

async function save(s: SessionLog): Promise<void> {
  await useApp.getState().saveSession(s);
}

/** يبدأ جلسةً من قالبٍ في الدورة ويحفظها فوراً */
export async function startSession(args: {
  meso: Mesocycle;
  template: SessionTemplate;
  index: number;
  week: number;
  readiness: Readiness;
  choice: ReadinessChoice;
}): Promise<SessionLog> {
  const st = useApp.getState();
  const profile = st.profile!;
  const states = Object.fromEntries(st.states.map((x) => [x.exerciseId, x]));
  const exercises = planSession({
    meso: args.meso,
    template: args.template,
    week: args.week,
    exById: exById(),
    states,
    sessions: st.sessions,
    plateKg: profile.minPlateKg,
    choice: args.choice,
  });
  const session: SessionLog = {
    id: uid("s-"),
    mesocycleId: args.meso.id,
    templateId: args.template.id,
    week: args.week,
    index: args.index,
    startedAt: Date.now(),
    readiness: args.readiness,
    readinessChoice: args.choice,
    deload: args.week >= 5,
    exercises,
    volumeKg: 0,
  };
  await save(session);
  return session;
}

function withExercise(
  s: SessionLog,
  i: number,
  fn: (e: ExerciseLog) => ExerciseLog,
): SessionLog {
  return {
    ...s,
    exercises: s.exercises.map((e, j) => (j === i ? fn(e) : e)),
  };
}

/** تسجيل مجموعة — تُحفَظ فور إدخالها */
export async function logSet(
  sessionId: string,
  exIndex: number,
  set: Omit<SetLog, "ts">,
): Promise<void> {
  const s = getSession(sessionId);
  await save(
    withExercise(s, exIndex, (e) => ({
      ...e,
      sets: [...e.sets, { ...set, ts: Date.now() }],
    })),
  );
}

export async function updateSet(
  sessionId: string,
  exIndex: number,
  setIndex: number,
  patch: Partial<SetLog>,
): Promise<void> {
  const s = getSession(sessionId);
  await save(
    withExercise(s, exIndex, (e) => ({
      ...e,
      sets: e.sets.map((x, k) => (k === setIndex ? { ...x, ...patch } : x)),
    })),
  );
}

export async function deleteSet(
  sessionId: string,
  exIndex: number,
  setIndex: number,
): Promise<void> {
  const s = getSession(sessionId);
  await save(
    withExercise(s, exIndex, (e) => ({
      ...e,
      sets: e.sets.filter((_, k) => k !== setIndex),
    })),
  );
}

export async function setWarmupDone(sessionId: string, done: boolean) {
  await save({ ...getSession(sessionId), warmupDone: done });
}

/**
 * يبدّل تمرين خانةٍ أثناء الجلسة. مع الألم تُعلَّم المجموعات السابقة ويُضاف البديل
 * بالمجموعات المتبقّية. «احفظ لبقية الدورة» يعدّل قالب الدورة نفسه.
 */
export async function swapExercise(
  sessionId: string,
  exIndex: number,
  newExerciseId: string,
  opts: { pain?: boolean; keep?: boolean },
): Promise<void> {
  const s = getSession(sessionId);
  const cur = s.exercises[exIndex];
  const targetLeft = cur.target
    ? {
        ...cur.target,
        sets: Math.max(1, cur.target.sets - cur.sets.length),
        weightKg: undefined,
      }
    : undefined;
  let exercises: ExerciseLog[];
  if (cur.sets.length) {
    const replaced: ExerciseLog = {
      exerciseId: newExerciseId,
      sets: [],
      swappedFrom: cur.exerciseId,
      target: targetLeft,
      slotIndex: cur.slotIndex,
    };
    exercises = [
      ...s.exercises.slice(0, exIndex),
      {
        ...cur,
        painFlag: opts.pain || cur.painFlag,
        target: cur.target && { ...cur.target, sets: cur.sets.length },
      },
      replaced,
      ...s.exercises.slice(exIndex + 1),
    ];
  } else {
    exercises = s.exercises.map((e, j) =>
      j === exIndex
        ? {
            ...e,
            exerciseId: newExerciseId,
            swappedFrom: e.swappedFrom ?? e.exerciseId,
            painFlag: opts.pain || undefined,
            target: e.target && { ...e.target, weightKg: undefined },
          }
        : e,
    );
  }
  await save({ ...s, exercises });

  if (
    opts.keep &&
    s.mesocycleId &&
    s.templateId &&
    cur.slotIndex !== undefined
  ) {
    const meso = useApp
      .getState()
      .mesocycles.find((m) => m.id === s.mesocycleId);
    if (meso)
      await swapInMesocycle(meso, s.templateId, cur.slotIndex, newExerciseId);
  }
}

export async function discardSession(sessionId: string): Promise<void> {
  await useApp.getState().deleteSession(sessionId);
}

/** الأرقام القياسية الجديدة مقارنةً بكل الجلسات السابقة */
export function findPRs(session: SessionLog, history: SessionLog[]): string[] {
  const prs: string[] = [];
  const byEx = exById();
  for (const e of session.exercises) {
    if (!e.sets.length) continue;
    const prev = history
      .filter((h) => h.id !== session.id && h.endedAt)
      .flatMap((h) => h.exercises.filter((x) => x.exerciseId === e.exerciseId))
      .flatMap((x) => x.sets);
    if (!prev.length) continue;
    const ex = byEx[e.exerciseId];
    const weighted = e.sets.some((x) => x.weightKg > 0) && !ex?.timed;
    if (weighted) {
      const now = bestE1RM(e.sets);
      const before = bestE1RM(prev);
      if (now !== undefined && (before === undefined || now > before))
        prs.push(e.exerciseId);
    } else {
      const now = bestReps(e.sets) ?? 0;
      const before = bestReps(prev) ?? 0;
      if (now > before) prs.push(e.exerciseId);
    }
  }
  return [...new Set(prs)];
}

/** إنهاء الجلسة: المدّة والحجم والأرقام القياسية وقرارات التقدّم */
export async function finishSession(sessionId: string): Promise<SessionLog> {
  const st = useApp.getState();
  const s = getSession(sessionId);
  const ended: SessionLog = {
    ...s,
    endedAt: Date.now(),
    volumeKg: sessionVolumeKg(s, exById()),
    prs: findPRs(s, st.sessions),
  };
  const final = await finalizeProgression(ended);
  await save(final);
  return final;
}
