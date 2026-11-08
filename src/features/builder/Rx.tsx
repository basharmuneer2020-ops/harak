import { ar } from "../../i18n/ar";
import type { Exercise } from "../../types";
import { Ltr, Term } from "../../ui/Term";

/** نصّ الوصف: «3 × 6–12 · RIR 2 · راحة 2 د» (الثواني للتمارين الموقوتة) */
export function Rx({
  sets,
  reps,
  rir,
  restSec,
  ex,
}: {
  sets: number;
  reps: [number, number];
  rir: number;
  restSec?: number;
  ex?: Pick<Exercise, "timed">;
}) {
  return (
    <>
      <Ltr>
        {sets} × {reps[0]}–{reps[1]}
        {ex?.timed ? ` ${ar.program.secondsUnit}` : ""}
      </Ltr>
      <Term>RIR {rir}</Term>
      {restSec !== undefined && <span>{ar.program.rest(restSec)}</span>}
    </>
  );
}
