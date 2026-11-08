import { href } from "../../app/router";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import { Card, Empty, LinkButton, SectionTitle } from "../../ui/controls";
import { Icon } from "../../ui/Icon";
import { Page } from "../../ui/Page";
import { Ltr } from "../../ui/Term";
import { DecisionList } from "./DecisionList";
import { fmtNum, toUnit } from "./units";
import s from "./workout.module.css";

/** ملخّص الجلسة: المدّة، الحجم، الأرقام القياسية، وقرارات التقدّم */
export default function SummaryPage({ id }: { id: string }) {
  const session = useApp((st) => st.sessions.find((x) => x.id === id));
  const profile = useApp((st) => st.profile)!;
  const { byId } = useExercises();
  if (!session) {
    return (
      <Page title={ar.summary.title}>
        <Empty>{ar.workout.notFound}</Empty>
      </Page>
    );
  }
  const minutes = Math.max(
    1,
    Math.round(((session.endedAt ?? Date.now()) - session.startedAt) / 60000),
  );
  const sets = session.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <Page title={ar.summary.title}>
      <div className={s.stats}>
        <div className={s.stat}>
          <div className={s.statVal}>
            <Ltr>{minutes}</Ltr>
          </div>
          <div className={s.statLbl}>{ar.summary.duration}</div>
        </div>
        <div className={s.stat}>
          <div className={s.statVal}>
            <Ltr>
              {fmtNum(Math.round(toUnit(session.volumeKg, profile.units)))}
            </Ltr>
          </div>
          <div className={s.statLbl}>
            {ar.summary.volume} · <span lang="en">{profile.units}</span>
          </div>
        </div>
        <div className={s.stat}>
          <div className={s.statVal}>
            <Ltr>{sets}</Ltr>
          </div>
          <div className={s.statLbl}>{ar.summary.sets}</div>
        </div>
      </div>

      <section style={{ marginBottom: 24 }}>
        <SectionTitle>{ar.summary.prs}</SectionTitle>
        <Card flat>
          {session.prs?.length ? (
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {session.prs.map((p) => (
                <li
                  key={p}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontWeight: 700,
                  }}
                >
                  <Icon name="trophy" size={18} className="pr" />
                  {byId[p]?.ar ?? p}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--text-dim)" }}>{ar.summary.noPrs}</p>
          )}
        </Card>
      </section>

      <section style={{ marginBottom: 24 }}>
        <SectionTitle>{ar.summary.decisions}</SectionTitle>
        <Card flat>
          <DecisionList session={session} />
        </Card>
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <LinkButton variant="primary" block href={href("/today")}>
          {ar.summary.toToday}
        </LinkButton>
        <LinkButton block href={href("/history")}>
          {ar.summary.toHistory}
        </LinkButton>
      </div>
    </Page>
  );
}
