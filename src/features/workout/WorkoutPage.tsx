import { useEffect, useState } from "react";
import { href, navigate } from "../../app/router";
import { ar } from "../../i18n/ar";
import { useActiveMesocycle, useOpenSession } from "../../store/selectors";
import { ConfirmButton } from "../../ui/ConfirmButton";
import { Button, Empty, LinkButton, Notice } from "../../ui/controls";
import { Ltr } from "../../ui/Term";
import { discardSession, finishSession } from "./actions";
import { ExerciseCard } from "./ExerciseCard";
import { RestBar } from "./RestBar";
import { useRest } from "./restTimer";
import { WarmupCard } from "./WarmupCard";
import s from "./workout.module.css";

function clock(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return `${h ? h + ":" : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** الجلسة الحيّة: الإحماء، بطاقات التمارين، مؤقّت الراحة، والإنهاء */
export default function WorkoutPage() {
  const session = useOpenSession();
  const meso = useActiveMesocycle();
  const stopRest = useRest((st) => st.stop);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = `${ar.workout.title} — ${ar.app.name}`;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!session) {
    return (
      <Empty>
        <p>{ar.workout.notFound}</p>
        <LinkButton variant="primary" href={href("/today")}>
          {ar.summary.toToday}
        </LinkButton>
      </Empty>
    );
  }

  const template = meso?.templates.find((t) => t.id === session.templateId);
  const currentIdx = session.exercises.findIndex(
    (e) => e.sets.length < (e.target?.sets ?? 1),
  );

  const finish = async () => {
    setBusy(true);
    stopRest();
    const done = await finishSession(session.id);
    navigate(`/workout/summary/${done.id}`, { replace: true });
  };

  return (
    <>
      <div className={s.top}>
        <div>
          <div className={s.topTitle}>{template?.name ?? ar.workout.title}</div>
          <div className={s.topSub}>
            {session.deload
              ? ar.today.deloadBadge
              : ar.today.weekBadge(session.week ?? 1)}
          </div>
        </div>
        <div className={s.topEnd}>
          <span className={s.clock} aria-label={ar.workout.elapsed}>
            <Ltr>{clock(now - session.startedAt)}</Ltr>
          </span>
          <Button
            small
            variant="primary"
            icon="check"
            disabled={busy}
            onClick={() => void finish()}
          >
            {ar.workout.finish}
          </Button>
        </div>
      </div>

      <div className={s.stack}>
        {session.deload && <Notice tone="info">{ar.workout.deloadNote}</Notice>}
        {session.readinessChoice === "light" && (
          <Notice tone="info">{ar.workout.lightNote}</Notice>
        )}
        {session.readinessChoice === "plus" && (
          <Notice tone="info">{ar.workout.plusNote}</Notice>
        )}
        <WarmupCard session={session} />
        {session.exercises.map((e, i) => (
          <ExerciseCard
            key={`${i}-${e.exerciseId}`}
            session={session}
            index={i}
            current={i === currentIdx}
          />
        ))}
        <Button
          variant="primary"
          block
          icon="check"
          disabled={busy}
          onClick={() => void finish()}
        >
          {ar.workout.finish}
        </Button>
        <ConfirmButton
          confirmText={ar.workout.discardConfirm}
          icon="trash"
          onConfirm={async () => {
            stopRest();
            await discardSession(session.id);
            navigate("/today", { replace: true });
          }}
        >
          {ar.workout.discard}
        </ConfirmButton>
        <div className={s.bottomPad} />
      </div>
      <RestBar />
    </>
  );
}
