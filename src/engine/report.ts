/** تقرير الدورة (F5): الالتزام، الحجم، الأرقام القياسية، وتغيّر e1RM لكل تمرين */
import type { Mesocycle, SessionLog } from "../types";
import { completedSessions, totalSessions } from "./cycle";
import { bestE1RM } from "./e1rm";
import { readinessScore } from "./readiness";

export interface CycleReport {
  done: number;
  planned: number;
  adherence: number;
  volumeKg: number;
  sets: number;
  prs: number;
  avgReadiness?: number;
  progress: {
    exerciseId: string;
    first: number;
    last: number;
    delta: number;
  }[];
}

export function cycleReport(
  meso: Mesocycle,
  sessions: SessionLog[],
): CycleReport {
  const done = completedSessions(meso, sessions).sort(
    (a, b) => a.startedAt - b.startedAt,
  );
  const planned = totalSessions(meso);
  const firstLast = new Map<string, { first: number; last: number }>();
  let volumeKg = 0;
  let sets = 0;
  let prs = 0;
  const rs: number[] = [];
  for (const s of done) {
    volumeKg += s.volumeKg;
    prs += s.prs?.length ?? 0;
    if (s.readiness) rs.push(readinessScore(s.readiness));
    for (const e of s.exercises) {
      sets += e.sets.length;
      const v = bestE1RM(e.sets);
      if (v === undefined) continue;
      const cur = firstLast.get(e.exerciseId);
      if (!cur) firstLast.set(e.exerciseId, { first: v, last: v });
      else cur.last = v;
    }
  }
  const progress = [...firstLast.entries()]
    .map(([exerciseId, v]) => ({
      exerciseId,
      first: v.first,
      last: v.last,
      delta: Math.round((v.last - v.first) * 10) / 10,
    }))
    .sort((a, b) => b.delta - a.delta);
  return {
    done: done.length,
    planned,
    adherence: planned ? Math.min(1, done.length / planned) : 0,
    volumeKg: Math.round(volumeKg),
    sets,
    prs,
    avgReadiness: rs.length
      ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10
      : undefined,
    progress,
  };
}
