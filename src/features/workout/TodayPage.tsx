import { useState } from "react";
import { href, navigate } from "../../app/router";
import { cyclePosition } from "../../engine/cycle";
import { weekTarget } from "../../engine/prescription";
import { ar } from "../../i18n/ar";
import {
  useActiveMesocycle,
  useExercises,
  useOpenSession,
} from "../../store/selectors";
import { useApp } from "../../store/useApp";
import {
  Button,
  Card,
  Chip,
  Chips,
  Empty,
  LinkButton,
} from "../../ui/controls";
import { Page } from "../../ui/Page";
import { Ltr } from "../../ui/Term";
import { startSession } from "./actions";
import { ReadinessSheet } from "./ReadinessSheet";
import { TodayExtras } from "./TodayExtras";
import s from "./workout.module.css";

export default function TodayPage() {
  const meso = useActiveMesocycle();
  const open = useOpenSession();
  const sessions = useApp((st) => st.sessions);
  const { byId } = useExercises();
  const [pick, setPick] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const header = {
    kicker: ar.app.kicker,
    title: ar.app.name,
    docTitle: ar.tabs.today,
    subtitle: ar.app.tagline,
  };

  if (open) {
    const done = open.exercises.reduce((n, e) => n + e.sets.length, 0);
    const t = meso?.templates.find((x) => x.id === open.templateId);
    return (
      <Page {...header}>
        <Card>
          <div className={s.badges}>
            <span className={`${s.badge} ${s.badgeLime}`}>
              {ar.today.resumeTitle}
            </span>
          </div>
          <div className={s.nextName}>{t?.name ?? ar.workout.title}</div>
          <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>
            {ar.today.resumeHint(done)}
          </p>
          <LinkButton
            variant="primary"
            block
            icon="play"
            href={href("/workout")}
          >
            {ar.today.resume}
          </LinkButton>
        </Card>
        <TodayExtras />
      </Page>
    );
  }

  if (!meso) {
    return (
      <Page {...header}>
        <Empty>
          <p>{ar.today.noProgram}</p>
          <LinkButton variant="primary" href={href("/program")} icon="program">
            {ar.today.toProgram}
          </LinkButton>
        </Empty>
        <TodayExtras />
      </Page>
    );
  }

  const pos = cyclePosition(meso, sessions);
  const template = meso.templates.find((t) => t.id === pick) ?? pos.template;

  if (pos.complete) {
    return (
      <Page {...header}>
        <TodayExtras top />
        <TodayExtras />
      </Page>
    );
  }

  return (
    <Page {...header}>
      <TodayExtras top />
      <Card>
        <div className={s.badges}>
          <span
            className={`${s.badge} ${pos.deload ? s.badgeCyan : s.badgeLime}`}
          >
            {pos.deload ? ar.today.deloadBadge : ar.today.weekBadge(pos.week)}
          </span>
          <span className={s.badge}>
            {ar.program.progress(pos.done, pos.total)}
          </span>
        </div>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          {ar.today.next}
        </p>
        <h2 className={s.nextName}>{template.name}</h2>
        <ul className={s.exList}>
          {template.slots.map((slot, i) => {
            const ex = byId[slot.exerciseId];
            const wt = weekTarget(slot, meso.rirByWeek, pos.week);
            return (
              <li key={i}>
                <span className={s.dot} />
                <span>{ex?.ar ?? slot.exerciseId}</span>
                <span>
                  <Ltr>
                    {wt.sets} × {wt.reps[0]}–{wt.reps[1]}
                  </Ltr>
                </span>
              </li>
            );
          })}
        </ul>
        <Button
          variant="primary"
          block
          icon="play"
          onClick={() => setReady(true)}
        >
          {ar.today.start}
        </Button>
        {meso.templates.length > 1 && (
          <div style={{ marginTop: 16 }}>
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: 13.5,
                marginBottom: 8,
              }}
            >
              {ar.today.other}
            </p>
            <Chips label={ar.today.other}>
              {meso.templates.map((t) => (
                <Chip
                  key={t.id}
                  role="radio"
                  on={template.id === t.id}
                  onClick={() => setPick(t.id)}
                >
                  {t.name}
                </Chip>
              ))}
            </Chips>
          </div>
        )}
      </Card>
      <TodayExtras />
      <ReadinessSheet
        open={ready}
        onClose={() => setReady(false)}
        onStart={async (r, choice) => {
          await startSession({
            meso,
            template,
            index: pos.index,
            week: pos.week,
            readiness: r,
            choice,
          });
          setReady(false);
          navigate("/workout");
        }}
      />
    </Page>
  );
}
