import { EXERCISES } from "../../data/exercises";
import { buildMesocycle, swapSlotExercise } from "../../engine/builder";
import { completedSessions } from "../../engine/cycle";
import { activeMesocycleOf } from "../../store/selectors";
import { uid, useApp } from "../../store/useApp";
import type { Mesocycle, Split } from "../../types";

function allExercises() {
  return [...EXERCISES, ...useApp.getState().customExercises];
}

/**
 * يولّد دورةً جديدة ويحفظها. الدورة النشطة السابقة تُحذف إن لم تُسجَّل فيها جلسات،
 * وإلا تُغلَق (يبقى سجلّها).
 */
export async function generateMesocycle(
  opts: { split?: Split; regenerate?: boolean } = {},
): Promise<Mesocycle> {
  const st = useApp.getState();
  const profile = st.profile;
  if (!profile) throw new Error("no profile");
  const exercises = allExercises();
  const now = Date.now();
  const id = uid("meso-");

  // التوليد الأول ببذرةٍ ثابتة؛ «أعِد التوليد» يجرّب بذوراً جديدة ويختار الأقل تحذيرات
  const seeds = opts.regenerate
    ? [1, 2, 3].map(() => 2 + Math.floor(Math.random() * 1e6))
    : [1];
  let best: Mesocycle | null = null;
  for (const seed of seeds) {
    const m = buildMesocycle({
      profile,
      exercises,
      split: opts.split,
      seed,
      id,
      now,
    });
    if (!best || m.warnings.length < best.warnings.length) best = m;
    if (!m.warnings.length) break;
  }
  const meso = best as Mesocycle;

  const active = activeMesocycleOf(st.mesocycles);
  if (active) {
    if (completedSessions(active, st.sessions).length === 0) {
      await st.deleteMesocycle(active.id);
    } else {
      await st.saveMesocycle({
        ...active,
        status: "completed",
        completedAt: now,
      });
    }
  }
  await st.saveMesocycle(meso);
  return meso;
}

/** يبدّل تمرين خانةٍ في الدورة النشطة ويحفظها مع إعادة حساب المؤشّرات */
export async function swapInMesocycle(
  meso: Mesocycle,
  templateId: string,
  slotIndex: number,
  exerciseId: string,
): Promise<Mesocycle> {
  const st = useApp.getState();
  const profile = st.profile;
  if (!profile) throw new Error("no profile");
  const exercises = allExercises();
  const exById = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const next = swapSlotExercise(
    meso,
    templateId,
    slotIndex,
    exById[exerciseId],
    profile,
    exById,
  );
  await st.saveMesocycle(next);
  return next;
}
