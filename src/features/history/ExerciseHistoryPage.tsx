import { href } from "../../app/router";
import { bestSetOf, exerciseSeries } from "../../engine/analytics";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import { Card, Empty, SectionTitle } from "../../ui/controls";
import { LineChart } from "../../ui/LineChart";
import { Page } from "../../ui/Page";
import { Ltr, Term } from "../../ui/Term";
import { fmtNum, toUnit } from "../workout/units";
import { fmtShortDate } from "./format";
import s from "./history.module.css";

/** تقدّم تمرين: رسم e1RM عبر الزمن، ورسم الحجم، وأفضل مجموعة */
export default function ExerciseHistoryPage({ id }: { id: string }) {
  const sessions = useApp((st) => st.sessions);
  const units = useApp((st) => st.profile?.units ?? "kg");
  const { byId } = useExercises();
  const ex = byId[id];
  const series = exerciseSeries(sessions, id);
  const best = bestSetOf(sessions, id);
  const weighted = series.some((p) => p.e1rm !== undefined);
  const strength = series
    .filter((p) => (weighted ? p.e1rm !== undefined : p.bestReps !== undefined))
    .map((p) => ({
      ts: p.ts,
      y: weighted ? toUnit(p.e1rm!, units) : p.bestReps!,
    }));
  const volume = series
    .filter((p) => p.volumeKg > 0)
    .map((p) => ({ ts: p.ts, y: toUnit(p.volumeKg, units) }));
  const name = ex?.ar ?? id;

  return (
    <Page
      title={name}
      backTo="/history"
      subtitle={ex ? <Term>{ex.en}</Term> : undefined}
    >
      {!series.length ? (
        <Empty>{ar.exerciseHistory.none}</Empty>
      ) : (
        <>
          <section className={s.section}>
            <SectionTitle>
              {weighted ? (
                <>
                  {ar.exerciseHistory.e1rm} <Term>e1RM</Term>
                </>
              ) : (
                ar.exerciseHistory.reps
              )}
            </SectionTitle>
            <div className={s.chartCard}>
              <LineChart
                points={strength}
                label={ar.exerciseHistory.chartLabel(name, strength.length)}
                unit={weighted ? units : undefined}
              />
            </div>
          </section>
          {volume.length > 0 && (
            <section className={s.section}>
              <SectionTitle>{ar.exerciseHistory.volume}</SectionTitle>
              <div className={s.chartCard}>
                <LineChart
                  points={volume}
                  label={ar.exerciseHistory.volume}
                  unit={units}
                  color="#5cc7dc"
                  height={170}
                  bars
                />
              </div>
            </section>
          )}
          {best && (
            <section className={s.section}>
              <SectionTitle>{ar.exerciseHistory.best}</SectionTitle>
              <Card flat>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 22,
                    color: "var(--lime)",
                  }}
                >
                  <Ltr>
                    {best.set.reps}
                    {best.set.weightKg > 0
                      ? ` × ${fmtNum(toUnit(best.set.weightKg, units))} ${units}`
                      : ""}
                  </Ltr>
                </span>{" "}
                <span style={{ color: "var(--text-dim)" }}>
                  · {fmtShortDate(best.ts)}
                </span>
              </Card>
            </section>
          )}
          <section className={s.section}>
            <SectionTitle>{ar.exerciseHistory.sessions}</SectionTitle>
            <ul className={s.exList}>
              {[...series].reverse().map((p) => {
                const d = new Date(p.ts);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                return (
                  <li key={p.sessionId}>
                    <a className={s.exLink} href={href(`/history/day/${key}`)}>
                      <span>
                        <span className={s.exName}>{fmtShortDate(p.ts)}</span>
                        <span className={s.exMeta} style={{ display: "block" }}>
                          <Ltr>{p.sets}</Ltr> {ar.summary.sets}
                          {p.e1rm !== undefined && (
                            <>
                              {" · "}
                              <Term>e1RM</Term>{" "}
                              <Ltr>{fmtNum(toUnit(p.e1rm, units))}</Ltr>
                            </>
                          )}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </Page>
  );
}
