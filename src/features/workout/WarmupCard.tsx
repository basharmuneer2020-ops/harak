import { useState } from "react";
import { buildWarmup, type WarmupItem } from "../../engine/warmup";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import type { SessionLog } from "../../types";
import { Button, Card, SectionTitle } from "../../ui/controls";
import { Icon } from "../../ui/Icon";
import { Ltr, Term } from "../../ui/Term";
import { setWarmupDone } from "./actions";
import { fmtWeight } from "./units";
import s from "./workout.module.css";

/** الإحماء RAMP كقائمة تحقّق في بداية الجلسة */
export function WarmupCard({ session }: { session: SessionLog }) {
  const { byId } = useExercises();
  const profile = useApp((st) => st.profile)!;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(!session.warmupDone);
  const first = session.exercises[0];
  const firstEx = first ? byId[first.exerciseId] : undefined;
  const items = buildWarmup(
    session.exercises
      .map((e) => byId[e.exerciseId]?.pattern)
      .filter((p): p is NonNullable<typeof p> => !!p),
    firstEx,
    first?.target?.weightKg,
    profile.minPlateKg,
  );

  const text = (it: WarmupItem) => {
    if (it.phase === "potentiate") {
      return (
        <>
          <Ltr>{it.percent}%</Ltr> {ar.warmup.rampOf} × <Ltr>{it.reps}</Ltr>
          {it.weightKg ? (
            <>
              {" = "}
              <Ltr>{fmtWeight(it.weightKg, profile.units)}</Ltr>
            </>
          ) : null}
        </>
      );
    }
    return (ar.warmup as Record<string, unknown>)[it.key] as string;
  };

  let lastPhase = "";
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SectionTitle as="h2">
          {ar.warmup.title} <Term>RAMP</Term>
        </SectionTitle>
        <Button
          small
          variant="ghost"
          style={{ marginInlineStart: "auto" }}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? ar.warmup.collapse : ar.warmup.expand}
        </Button>
      </div>
      {session.warmupDone && !open && (
        <p className={s.doneNote}>
          <Icon name="check" size={16} /> {ar.warmup.done}
        </p>
      )}
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it) => {
            const header = it.phase !== lastPhase;
            lastPhase = it.phase;
            return (
              <div key={it.id}>
                {header && (
                  <div className={s.wPhase}>
                    {ar.warmup.phase[it.phase]}
                    {it.phase === "potentiate" && firstEx
                      ? ` · ${ar.warmup.rampOn(firstEx.ar)}`
                      : ""}
                  </div>
                )}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={!!checked[it.id]}
                  className={s.wItem}
                  onClick={() =>
                    setChecked({ ...checked, [it.id]: !checked[it.id] })
                  }
                >
                  <span className={s.wCheck}>
                    <Icon name="check" size={15} />
                  </span>
                  <span className={s.wText}>{text(it)}</span>
                </button>
              </div>
            );
          })}
          <Button
            variant="secondary"
            block
            icon="check"
            onClick={async () => {
              await setWarmupDone(session.id, true);
              setOpen(false);
            }}
          >
            {ar.warmup.done}
          </Button>
        </div>
      )}
    </Card>
  );
}
