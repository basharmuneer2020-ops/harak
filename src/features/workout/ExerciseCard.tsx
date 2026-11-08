import { useMemo, useState } from "react";
import { href } from "../../app/router";
import { PATTERN_BY_ID } from "../../data/patterns";
import { lastSetsFor } from "../../engine/session";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import type { ExerciseLog, SessionLog } from "../../types";
import { Button, EquipBadge, ExplainLinks, Tag } from "../../ui/controls";
import { Icon } from "../../ui/Icon";
import { NumberStepper } from "../../ui/NumberStepper";
import { Ltr, Term } from "../../ui/Term";
import { Rx } from "../builder/Rx";
import { SwapSheet } from "../builder/SwapSheet";
import { deleteSet, logSet, swapExercise, updateSet } from "./actions";
import { useRest } from "./restTimer";
import { fmtNum, fromUnit, toUnit, weightStep } from "./units";
import s from "./workout.module.css";

const RIRS = [0, 1, 2, 3, 4, 5];

/** بطاقة التمرين في الجلسة الحيّة: الهدف، الإرشادات، الشرح، تسجيل المجموعات */
export function ExerciseCard({
  session,
  index,
  current,
}: {
  session: SessionLog;
  index: number;
  current: boolean;
}) {
  const log: ExerciseLog = session.exercises[index];
  const { byId } = useExercises();
  const profile = useApp((st) => st.profile)!;
  const sessions = useApp((st) => st.sessions);
  const startRest = useRest((st) => st.start);
  const ex = byId[log.exerciseId];
  const target = log.target;
  const units = profile.units;
  const timed = !!ex?.timed;

  const prev = useMemo(
    () => lastSetsFor(log.exerciseId, sessions, session.id),
    [log.exerciseId, sessions, session.id],
  );
  const nextIdx = log.sets.length;
  const lastHere = log.sets[log.sets.length - 1];
  const defReps =
    lastHere?.reps ??
    prev[nextIdx]?.reps ??
    prev[0]?.reps ??
    (target ? Math.round((target.reps[0] + target.reps[1]) / 2) : 10);
  const defKg =
    lastHere?.weightKg ?? target?.weightKg ?? prev[0]?.weightKg ?? 0;

  const [reps, setReps] = useState<number | null>(null);
  const [kg, setKg] = useState<number | null>(null);
  const [rir, setRir] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [extra, setExtra] = useState(false);
  const [swapMode, setSwapMode] = useState<null | "swap" | "pain">(null);
  const [keep, setKeep] = useState(false);

  if (!ex) return null;
  const vReps = reps ?? defReps;
  const vKg = kg ?? defKg;
  const vRir = rir ?? target?.rir ?? 2;
  const planned = target?.sets ?? 3;
  const complete = log.sets.length >= planned;
  const showEditor = editing !== null || !complete || extra;

  const submit = async () => {
    const set = { reps: vReps, weightKg: Math.max(0, vKg), rir: vRir };
    if (editing !== null) {
      await updateSet(session.id, index, editing, set);
      setEditing(null);
    } else {
      await logSet(session.id, index, set);
      setExtra(false);
      if (target) startRest(target.restSec, ex.ar);
    }
  };

  return (
    <article
      className={s.ecard}
      data-current={current}
      data-done={complete}
      id={`ex-${index}`}
      aria-label={ex.ar}
    >
      <div className={s.eHead}>
        <span className={s.eNum}>
          {complete ? <Icon name="check" size={16} /> : index + 1}
        </span>
        <div style={{ minWidth: 0 }}>
          <a className={s.eName} href={href(`/library/exercise/${ex.id}`)}>
            {ex.ar}
          </a>
          <div className={s.eMeta}>
            <span>{PATTERN_BY_ID[ex.pattern].ar}</span>
            <EquipBadge equip={ex.equip} />
            {log.swappedFrom && byId[log.swappedFrom] && (
              <Tag>{ar.workout.swappedFrom(byId[log.swappedFrom].ar)}</Tag>
            )}
            {log.painFlag && <Tag>{ar.workout.painFlag}</Tag>}
          </div>
        </div>
      </div>

      {target && (
        <div className={s.target}>
          <div className={s.tItem}>
            <div className={s.tLbl}>{ar.workout.target}</div>
            <div className={s.tVal}>
              <Rx
                sets={target.sets}
                reps={target.reps}
                rir={target.rir}
                ex={ex}
              />
            </div>
          </div>
          <div className={s.tItem}>
            <div className={s.tLbl}>{ar.workout.suggested}</div>
            <div className={s.tVal}>
              {target.weightKg !== undefined && target.weightKg > 0 ? (
                <Ltr>
                  {fmtNum(toUnit(target.weightKg, units))} {units}
                </Ltr>
              ) : (
                <span style={{ fontWeight: 500, fontSize: 13.5 }}>
                  {ex.equip === "bodyweight"
                    ? ar.equip.bodyweight.name
                    : ar.workout.noSuggestion}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <details className={s.details}>
        <summary>
          <Icon name="info" size={16} /> {ar.workout.cues}
        </summary>
        {ex.cues.length > 0 && (
          <ol>
            {ex.cues.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        )}
        <ExplainLinks ex={ex} />
      </details>

      {log.sets.length > 0 && (
        <ol className={s.setsList} aria-label={ar.workout.sets}>
          {log.sets.map((st, i) => (
            <li key={i} className={s.setRow}>
              <span className={s.setIdx}>{i + 1}</span>
              <span className={s.setText}>
                <Ltr>
                  {st.reps}
                  {timed ? ` ${ar.program.secondsUnit}` : ""}
                  {st.weightKg > 0
                    ? ` × ${fmtNum(toUnit(st.weightKg, units))} ${units}`
                    : ""}
                </Ltr>
              </span>
              <span className={s.setRir}>
                <Term>RIR {st.rir}</Term>
              </span>
              <span className={s.setActions}>
                <button
                  type="button"
                  className={s.iconBtn}
                  aria-label={`${ar.workout.edit} ${ar.workout.set(i + 1)}`}
                  onClick={() => {
                    setEditing(i);
                    setReps(st.reps);
                    setKg(st.weightKg);
                    setRir(st.rir);
                  }}
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  type="button"
                  className={s.iconBtn}
                  aria-label={`${ar.workout.remove} ${ar.workout.set(i + 1)}`}
                  onClick={() => void deleteSet(session.id, index, i)}
                >
                  <Icon name="trash" size={16} />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {showEditor ? (
        <div className={s.editor}>
          <div className={s.editorTitle}>
            {editing !== null
              ? `${ar.workout.edit} · ${ar.workout.set(editing + 1)}`
              : ar.workout.set(nextIdx + 1)}
          </div>
          <div className={s.fields}>
            <NumberStepper
              label={timed ? ar.workout.seconds : ar.workout.reps}
              value={vReps}
              onChange={setReps}
              step={timed ? 5 : 1}
              min={0}
              max={timed ? 600 : 100}
            />
            <NumberStepper
              label={ar.workout.weight}
              unit={units}
              value={toUnit(vKg, units)}
              onChange={(v) => setKg(fromUnit(v, units))}
              step={weightStep(profile.minPlateKg, units)}
              min={0}
              max={1000}
              decimal
            />
          </div>
          <div
            className={s.rirRow}
            role="radiogroup"
            aria-label={ar.workout.rirHelp}
          >
            <span className={s.rirLbl}>
              <Term>RIR</Term> — {ar.workout.rirHelp}
            </span>
            <div className={s.rirBtns}>
              {RIRS.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={vRir === n}
                  aria-label={`RIR ${n}`}
                  className={s.rirBtn}
                  onClick={() => setRir(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {ex.equip === "bodyweight" && !timed && (
            <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
              {ar.workout.bodyweightHint}
            </p>
          )}
          <Button
            variant="primary"
            block
            icon="check"
            onClick={() => void submit()}
          >
            {editing !== null ? ar.app.save : ar.workout.log}
          </Button>
          {editing !== null && (
            <Button variant="ghost" block onClick={() => setEditing(null)}>
              {ar.app.cancel}
            </Button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span className={s.doneNote}>
            <Icon name="check" size={16} /> {ar.workout.allDone}
          </span>
          <Button
            small
            variant="ghost"
            icon="plus"
            onClick={() => setExtra(true)}
          >
            {ar.workout.extraSet}
          </Button>
        </div>
      )}

      <div className={s.eActions}>
        <Button
          small
          variant="ghost"
          icon="swap"
          onClick={() => setSwapMode("swap")}
        >
          {ar.workout.swap}
        </Button>
        <Button
          small
          variant="danger"
          icon="alert"
          onClick={() => setSwapMode("pain")}
        >
          {ar.workout.pain}
        </Button>
      </div>

      <SwapSheet
        open={swapMode !== null}
        current={ex}
        pain={swapMode === "pain"}
        title={swapMode === "pain" ? ar.workout.painTitle : undefined}
        subtitle={swapMode === "pain" ? ar.workout.painSub : undefined}
        onClose={() => setSwapMode(null)}
        footer={
          session.mesocycleId ? (
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                minHeight: 44,
              }}
            >
              <input
                type="checkbox"
                checked={keep}
                onChange={(e) => setKeep(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "var(--lime)" }}
              />
              <span>{ar.workout.keepSwap}</span>
            </label>
          ) : undefined
        }
        onPick={async (e) => {
          await swapExercise(session.id, index, e.id, {
            pain: swapMode === "pain",
            keep,
          });
          setSwapMode(null);
          setReps(null);
          setKg(null);
          setRir(null);
        }}
      />
    </article>
  );
}
