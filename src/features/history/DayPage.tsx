import { useState } from "react";
import { addDays, parseDayKey } from "../../engine/analytics";
import { sessionVolumeKg } from "../../engine/session";
import { ar } from "../../i18n/ar";
import { useActiveMesocycle, useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import type { SessionLog } from "../../types";
import { ConfirmButton } from "../../ui/ConfirmButton";
import { Button, Empty, SectionTitle } from "../../ui/controls";
import { Icon } from "../../ui/Icon";
import { NumberStepper } from "../../ui/NumberStepper";
import { Page } from "../../ui/Page";
import { Ltr, Term } from "../../ui/Term";
import { fmtNum, fromUnit, toUnit } from "../workout/units";
import { fmtDate, fmtTime } from "./format";
import s from "./history.module.css";

function SessionBlock({ session }: { session: SessionLog }) {
  const { byId } = useExercises();
  const meso = useActiveMesocycle();
  const mesocycles = useApp((st) => st.mesocycles);
  const profile = useApp((st) => st.profile)!;
  const saveSession = useApp((st) => st.saveSession);
  const deleteSession = useApp((st) => st.deleteSession);
  const [editing, setEditing] = useState(false);
  const units = profile.units;
  const m = mesocycles.find((x) => x.id === session.mesocycleId) ?? meso;
  const name =
    m?.templates.find((t) => t.id === session.templateId)?.name ??
    ar.day.session;
  const minutes = session.endedAt
    ? Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000))
    : 0;

  const patch = async (
    exI: number,
    setI: number,
    p: Partial<{ reps: number; weightKg: number; rir: number }>,
  ) => {
    const next: SessionLog = {
      ...session,
      exercises: session.exercises.map((e, i) =>
        i !== exI
          ? e
          : {
              ...e,
              sets: e.sets.map((x, j) => (j === setI ? { ...x, ...p } : x)),
            },
      ),
    };
    next.volumeKg = sessionVolumeKg(next, byId);
    await saveSession(next);
  };
  const removeSet = async (exI: number, setI: number) => {
    const next: SessionLog = {
      ...session,
      exercises: session.exercises.map((e, i) =>
        i !== exI ? e : { ...e, sets: e.sets.filter((_, j) => j !== setI) },
      ),
    };
    next.volumeKg = sessionVolumeKg(next, byId);
    await saveSession(next);
  };

  return (
    <article className={s.sessCard}>
      <div className={s.sessHead}>
        <h2 className={s.sessName}>{name}</h2>
        <span className={s.sessMeta}>
          <Ltr>{fmtTime(session.startedAt)}</Ltr> · {ar.day.duration(minutes)} ·{" "}
          {ar.day.volume}{" "}
          <Ltr>
            {fmtNum(Math.round(toUnit(session.volumeKg, units)))} {units}
          </Ltr>
        </span>
      </div>
      {session.exercises
        .filter((e) => e.sets.length)
        .map((e) => {
          const exI = session.exercises.indexOf(e);
          const ex = byId[e.exerciseId];
          return (
            <div key={exI} className={s.exBlock}>
              <div style={{ fontWeight: 700 }}>{ex?.ar ?? e.exerciseId}</div>
              {!editing ? (
                <div className={s.setLine}>
                  {e.sets.map((x, j) => (
                    <span key={j}>
                      <Ltr>
                        {x.reps}
                        {ex?.timed ? ` ${ar.program.secondsUnit}` : ""}
                        {x.weightKg > 0
                          ? ` × ${fmtNum(toUnit(x.weightKg, units))} ${units}`
                          : ""}
                      </Ltr>{" "}
                      <Term>RIR {x.rir}</Term>
                    </span>
                  ))}
                </div>
              ) : (
                e.sets.map((x, j) => (
                  <div key={j} className={s.editRow}>
                    <NumberStepper
                      label={ex?.timed ? ar.workout.seconds : ar.workout.reps}
                      value={x.reps}
                      onChange={(v) => void patch(exI, j, { reps: v })}
                    />
                    <NumberStepper
                      label={ar.workout.weight}
                      unit={units}
                      decimal
                      step={profile.minPlateKg}
                      value={toUnit(x.weightKg, units)}
                      onChange={(v) =>
                        void patch(exI, j, { weightKg: fromUnit(v, units) })
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--text-dim)",
                        }}
                      >
                        <Term>RIR</Term>
                        <select
                          className={s.rirSel}
                          value={x.rir}
                          onChange={(ev) =>
                            void patch(exI, j, { rir: Number(ev.target.value) })
                          }
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        small
                        variant="danger"
                        icon="trash"
                        aria-label={ar.workout.remove}
                        onClick={() => void removeSet(exI, j)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 12,
        }}
      >
        <Button
          block
          icon={editing ? "check" : "edit"}
          onClick={() => setEditing(!editing)}
        >
          {editing ? ar.day.doneEditing : ar.day.editSets}
        </Button>
        <ConfirmButton
          confirmText={ar.day.deleteConfirm}
          icon="trash"
          onConfirm={() => deleteSession(session.id)}
        >
          {ar.day.deleteSession}
        </ConfirmButton>
      </div>
    </article>
  );
}

export default function DayPage({ day }: { day: string }) {
  const ts = parseDayKey(day);
  const sessions = useApp((st) => st.sessions);
  const cardio = useApp((st) => st.cardio);
  const deleteCardio = useApp((st) => st.deleteCardio);
  if (ts === null) {
    return (
      <Page title={ar.app.notFound} backTo="/history">
        <Empty>{ar.app.notFound}</Empty>
      </Page>
    );
  }
  const end = addDays(ts, 1);
  const daySessions = sessions
    .filter((x) => x.endedAt && x.startedAt >= ts && x.startedAt < end)
    .sort((a, b) => a.startedAt - b.startedAt);
  const dayCardio = cardio.filter((c) => c.ts >= ts && c.ts < end);

  return (
    <Page title={fmtDate(ts)} backTo="/history">
      {!daySessions.length && !dayCardio.length && (
        <Empty>{ar.day.empty}</Empty>
      )}
      {daySessions.map((x) => (
        <SessionBlock key={x.id} session={x} />
      ))}
      {dayCardio.length > 0 && (
        <section>
          <SectionTitle>{ar.day.cardio}</SectionTitle>
          {dayCardio.map((c) => (
            <div key={c.id} className={s.cardioRow}>
              <Icon name="heart" size={18} />
              <span>
                <strong>
                  {(ar.cardio.types as Record<string, string>)[c.type] ??
                    c.type}
                </strong>{" "}
                · <Ltr>{c.minutes}</Ltr> {ar.onboarding.minutesUnit} ·{" "}
                {c.intensity === "vigorous"
                  ? ar.cardio.vigorous
                  : ar.cardio.moderate}
                {c.note ? ` · ${c.note}` : ""}
              </span>
              <span style={{ marginInlineStart: "auto" }}>
                <ConfirmButton
                  small
                  block={false}
                  onConfirm={() => deleteCardio(c.id)}
                >
                  {ar.day.deleteCardio}
                </ConfirmButton>
              </span>
            </div>
          ))}
        </section>
      )}
    </Page>
  );
}
