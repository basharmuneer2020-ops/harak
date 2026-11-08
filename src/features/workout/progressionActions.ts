import { EXERCISES } from "../../data/exercises";
import { swapSlotExercise } from "../../engine/builder";
import { progress } from "../../engine/progression";
import { useApp } from "../../store/useApp";
import type {
  ExerciseLog,
  ExerciseState,
  ProgressionDecision,
  SessionLog,
} from "../../types";

/**
 * يُشغَّل عند إنهاء كل جلسة (F5): يطبّق التقدّم المزدوج لكل تمرين، ويكتب النتيجة
 * في ExerciseState، وينقل تمارين وزن الجسم في سلّمها لبقية الدورة.
 */
export async function finalizeProgression(s: SessionLog): Promise<SessionLog> {
  const st = useApp.getState();
  const profile = st.profile;
  if (!profile) return s;
  const list = [...EXERCISES, ...st.customExercises];
  const exById = Object.fromEntries(list.map((e) => [e.id, e]));
  const states = Object.fromEntries(st.states.map((x) => [x.exerciseId, x]));

  // دمج سجلّات التمرين نفسه إن تكرّر في الجلسة
  const merged = new Map<string, ExerciseLog>();
  for (const e of s.exercises) {
    if (!e.sets.length) continue;
    const cur = merged.get(e.exerciseId);
    if (cur) cur.sets = [...cur.sets, ...e.sets];
    else merged.set(e.exerciseId, { ...e, sets: [...e.sets] });
  }

  const decisions: ProgressionDecision[] = [];
  const newStates: ExerciseState[] = [];
  const chainMoves: { from: string; to: string }[] = [];
  const now = Date.now();
  for (const log of merged.values()) {
    const ex = exById[log.exerciseId];
    if (!ex) continue;
    const r = progress({
      ex,
      log,
      state: states[ex.id],
      profile,
      exById,
      deload: s.deload,
      now,
    });
    decisions.push(r.decision);
    newStates.push(r.state);
    if (
      (r.decision.kind === "advance" || r.decision.kind === "regress") &&
      r.decision.toExerciseId
    ) {
      chainMoves.push({ from: ex.id, to: r.decision.toExerciseId });
      const to = exById[r.decision.toExerciseId];
      if (!states[to.id]) {
        newStates.push({
          exerciseId: to.id,
          consecutiveFails: 0,
          updatedAt: now,
        });
      }
    }
  }
  if (newStates.length) await st.saveStates(newStates);

  // سلّم التدرّج: الدرجة الجديدة تحلّ محلّ القديمة في قوالب الدورة
  if (chainMoves.length && s.mesocycleId) {
    let meso = useApp.getState().mesocycles.find((m) => m.id === s.mesocycleId);
    if (meso) {
      for (const mv of chainMoves) {
        for (const t of meso.templates) {
          t.slots.forEach((slot, i) => {
            if (slot.exerciseId === mv.from && meso) {
              meso = swapSlotExercise(
                meso,
                t.id,
                i,
                exById[mv.to],
                profile,
                exById,
              );
            }
          });
        }
      }
      await st.saveMesocycle(meso);
    }
  }
  return { ...s, decisions };
}
