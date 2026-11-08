import { useMemo, useState } from "react";
import { href } from "../../app/router";
import {
  addDays,
  dayKey,
  performedExercises,
  sessionsInMonth,
  startOfDay,
  streakWeeks,
  WEEK_START_DAY,
  weekStart,
} from "../../engine/analytics";
import { loggedVolume } from "../../engine/volume";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import { Card, Empty, SectionTitle } from "../../ui/controls";
import { Icon } from "../../ui/Icon";
import { Page } from "../../ui/Page";
import { Ltr } from "../../ui/Term";
import { VolumeMap } from "../builder/VolumeMap";
import { fmtShortDate } from "./format";
import { WhoCard } from "./WhoCard";
import s from "./history.module.css";

function MonthCalendar() {
  const sessions = useApp((st) => st.sessions);
  const cardio = useApp((st) => st.cardio);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const marks = useMemo(() => {
    const map = new Map<string, { s: boolean; c: boolean }>();
    for (const x of sessions) {
      if (!x.endedAt) continue;
      const k = dayKey(x.startedAt);
      map.set(k, { s: true, c: map.get(k)?.c ?? false });
    }
    for (const c of cardio) {
      const k = dayKey(c.ts);
      map.set(k, { s: map.get(k)?.s ?? false, c: true });
    }
    return map;
  }, [sessions, cardio]);

  const first = new Date(cursor.y, cursor.m, 1);
  const lead = (first.getDay() - WEEK_START_DAY + 7) % 7;
  const daysIn = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = Array.from({ length: lead + daysIn }, (_, i) =>
    i < lead ? null : new Date(cursor.y, cursor.m, i - lead + 1).getTime(),
  );
  const todayKey = dayKey(Date.now());
  const shift = (d: number) => {
    const n = new Date(cursor.y, cursor.m + d, 1);
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
  };
  const dows = Array.from(
    { length: 7 },
    (_, i) => ar.dates.daysShort[(WEEK_START_DAY + i) % 7],
  );

  return (
    <Card>
      <div className={s.calHead}>
        <button
          type="button"
          className={s.navBtn}
          onClick={() => shift(-1)}
          aria-label={ar.history.prevMonth}
        >
          <Icon name="chevron" size={18} />
        </button>
        <div className={s.calTitle} aria-live="polite">
          {ar.dates.months[cursor.m]} <Ltr>{cursor.y}</Ltr>
        </div>
        <button
          type="button"
          className={s.navBtn}
          onClick={() => shift(1)}
          aria-label={ar.history.nextMonth}
        >
          <Icon name="chevron" size={18} className="flip" />
        </button>
      </div>
      <div className={s.grid}>
        {dows.map((d) => (
          <div key={d} className={s.dow} aria-hidden="true">
            {d}
          </div>
        ))}
        {cells.map((ts, i) => {
          if (ts === null)
            return <span key={`x${i}`} className={s.day} data-out="true" />;
          const k = dayKey(ts);
          const m = marks.get(k);
          const label = `${new Date(ts).getDate()} ${ar.dates.months[cursor.m]}${m?.s ? `، ${ar.history.legendSession}` : ""}${m?.c ? `، ${ar.history.legendCardio}` : ""}`;
          return (
            <a
              key={k}
              href={href(`/history/day/${k}`)}
              className={s.day}
              data-today={k === todayKey}
              data-has={!!m}
              aria-label={label}
            >
              <Ltr>{new Date(ts).getDate()}</Ltr>
              <span className={s.marks} aria-hidden="true">
                {m?.s && <i className={`${s.mark} ${s.markS}`} />}
                {m?.c && <i className={`${s.mark} ${s.markC}`} />}
              </span>
            </a>
          );
        })}
      </div>
      <div className={s.legend} aria-hidden="true">
        <span>
          <i className={`${s.mark} ${s.markS}`} /> {ar.history.legendSession}
        </span>
        <span>
          <i className={`${s.mark} ${s.markC}`} /> {ar.history.legendCardio}
        </span>
      </div>
    </Card>
  );
}

function WeekHeatmap() {
  const sessions = useApp((st) => st.sessions);
  const { byId } = useExercises();
  const [offset, setOffset] = useState(0);
  const from = addDays(weekStart(Date.now()), -7 * offset);
  const to = addDays(from, 7);
  const vol = useMemo(() => {
    const v = loggedVolume(
      sessions.filter((x) => x.endedAt),
      byId,
      from,
      to,
    );
    return Object.fromEntries(
      Object.entries(v).map(([k, n]) => [k, Math.round(n * 10) / 10]),
    );
  }, [sessions, byId, from, to]);
  return (
    <Card>
      <div className={s.calHead}>
        <button
          type="button"
          className={s.navBtn}
          onClick={() => setOffset(offset + 1)}
          aria-label={ar.history.prevWeek}
        >
          <Icon name="chevron" size={18} />
        </button>
        <div className={s.calTitle} style={{ fontSize: 15 }}>
          {ar.history.weekOf(
            `${fmtShortDate(from)} – ${fmtShortDate(addDays(to, -1))}`,
          )}
        </div>
        <button
          type="button"
          className={s.navBtn}
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - 1))}
          aria-label={ar.history.nextWeek}
        >
          <Icon name="chevron" size={18} className="flip" />
        </button>
      </div>
      <VolumeMap volume={vol} />
    </Card>
  );
}

export default function HistoryPage() {
  const sessions = useApp((st) => st.sessions);
  const { byId } = useExercises();
  const now = Date.now();
  const d = new Date(now);
  const streak = streakWeeks(sessions, now);
  const month = sessionsInMonth(sessions, d.getFullYear(), d.getMonth());
  const performed = performedExercises(sessions);
  const any = sessions.some((x) => x.endedAt);

  return (
    <Page title={ar.history.title} subtitle={ar.history.subtitle}>
      <div className={s.stats}>
        <div className={s.stat}>
          <div className={s.statVal}>{ar.history.streakVal(streak)}</div>
          <div className={s.statLbl}>{ar.history.streak}</div>
        </div>
        <div className={s.stat}>
          <div className={s.statVal}>
            <Ltr>{month}</Ltr>
          </div>
          <div className={s.statLbl}>{ar.history.month}</div>
        </div>
      </div>

      <section className={s.section}>
        <WhoCard />
      </section>

      <section className={s.section}>
        <SectionTitle>{ar.history.calendar}</SectionTitle>
        <MonthCalendar />
      </section>

      <section className={s.section}>
        <SectionTitle>{ar.history.heatmap}</SectionTitle>
        <p className={s.hint} style={{ marginTop: 0 }}>
          {ar.history.heatmapHint}
        </p>
        <WeekHeatmap />
      </section>

      <section className={s.section}>
        <SectionTitle>{ar.history.exercises}</SectionTitle>
        {any ? (
          <ul className={s.exList}>
            {performed.map((p) => (
              <li key={p.exerciseId}>
                <a
                  className={s.exLink}
                  href={href(`/history/exercise/${p.exerciseId}`)}
                >
                  <span>
                    <span className={s.exName}>
                      {byId[p.exerciseId]?.ar ?? p.exerciseId}
                    </span>
                    <span className={s.exMeta} style={{ display: "block" }}>
                      {ar.history.times(p.count)} ·{" "}
                      {ar.history.lastDone(fmtShortDate(startOfDay(p.last)))}
                    </span>
                  </span>
                  <Icon name="chevron" size={18} className="flip" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{ar.history.noSessions}</Empty>
        )}
      </section>
    </Page>
  );
}
