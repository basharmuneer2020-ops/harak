import { useState } from "react";
import { navigate } from "../../app/router";
import { cycleReport } from "../../engine/report";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import type { Mesocycle } from "../../types";
import { Button, Card, SectionTitle } from "../../ui/controls";
import { Ltr } from "../../ui/Term";
import { generateMesocycle } from "../builder/actions";
import { fmtWeight } from "./units";
import s from "./workout.module.css";

/** تقرير الدورة عند انتهائها، مع توليد الدورة التالية وترحيل الأوزان */
export function CycleReportCard({ meso }: { meso: Mesocycle }) {
  const sessions = useApp((st) => st.sessions);
  const units = useApp((st) => st.profile?.units ?? "kg");
  const { byId } = useExercises();
  const [busy, setBusy] = useState(false);
  const r = cycleReport(meso, sessions);
  return (
    <Card style={{ marginBottom: 16 }}>
      <SectionTitle>{ar.report.title}</SectionTitle>
      <p style={{ color: "var(--text-dim)", marginBottom: 12 }}>
        {ar.report.subtitle}
      </p>
      <div className={s.stats}>
        <div className={s.stat}>
          <div className={s.statVal}>
            <Ltr>
              {r.done}/{r.planned}
            </Ltr>
          </div>
          <div className={s.statLbl}>{ar.report.sessions}</div>
        </div>
        <div className={s.stat}>
          <div className={s.statVal}>
            <Ltr>{Math.round(r.adherence * 100)}%</Ltr>
          </div>
          <div className={s.statLbl}>{ar.report.adherence}</div>
        </div>
        <div className={s.stat}>
          <div className={s.statVal}>
            <Ltr>{r.prs}</Ltr>
          </div>
          <div className={s.statLbl}>{ar.report.prs}</div>
        </div>
      </div>
      <SectionTitle as="h3">{ar.report.progress}</SectionTitle>
      {r.progress.length ? (
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {r.progress.slice(0, 6).map((p) => (
            <li key={p.exerciseId} style={{ display: "flex", gap: 8 }}>
              <span style={{ fontWeight: 700 }}>
                {byId[p.exerciseId]?.ar ?? p.exerciseId}
              </span>
              <span
                style={{
                  marginInlineStart: "auto",
                  color: p.delta >= 0 ? "var(--lime)" : "var(--amber)",
                }}
              >
                <Ltr>
                  {fmtWeight(p.first, units)} → {fmtWeight(p.last, units)}
                </Ltr>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--text-dim)", marginBottom: 14 }}>
          {ar.report.noProgress}
        </p>
      )}
      <Button
        variant="primary"
        block
        icon="sparkle"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await generateMesocycle({ split: meso.split, regenerate: true });
          navigate("/program");
        }}
      >
        {ar.report.next}
      </Button>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 8 }}>
        {ar.report.nextHint}
      </p>
    </Card>
  );
}
