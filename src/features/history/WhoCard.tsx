import { useState } from "react";
import {
  WHO_MODERATE_MAX,
  WHO_MODERATE_MIN,
  WHO_STRENGTH_DAYS,
  whoWeek,
} from "../../engine/analytics";
import { ar } from "../../i18n/ar";
import { useApp } from "../../store/useApp";
import { Button, Card, SectionTitle } from "../../ui/controls";
import { Term, Ltr } from "../../ui/Term";
import { CardioSheet } from "../cardio/CardioSheet";
import s from "./history.module.css";

/** مؤشّرا WHO للأسبوع: دقائق الكارديو المكافئة مقابل 150–300، وأيام التقوية مقابل ≥ 2 */
export function WhoCard() {
  const sessions = useApp((st) => st.sessions);
  const cardio = useApp((st) => st.cardio);
  const [open, setOpen] = useState(false);
  const w = whoWeek(sessions, cardio);
  const pct = Math.min(1, w.cardioMinutes / WHO_MODERATE_MAX);
  return (
    <Card>
      <SectionTitle>
        {ar.history.who} <Term>WHO</Term>
      </SectionTitle>
      <div className={s.whoGrid}>
        <div className={s.whoItem}>
          <div className={s.whoLbl}>{ar.history.cardio}</div>
          <div className={s.whoVal} data-ok={w.cardioMet}>
            <Ltr>
              {w.cardioMinutes}/{WHO_MODERATE_MIN}
            </Ltr>
          </div>
          <div className={s.whoBar} aria-hidden="true">
            <span style={{ width: `${pct * 100}%` }} />
            <i
              style={{
                insetInlineStart: `${(WHO_MODERATE_MIN / WHO_MODERATE_MAX) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className={s.whoItem}>
          <div className={s.whoLbl}>{ar.history.strengthDays}</div>
          <div className={s.whoVal} data-ok={w.strengthMet}>
            <Ltr>
              {w.strengthDays}/{WHO_STRENGTH_DAYS}
            </Ltr>
          </div>
        </div>
      </div>
      <p className={s.hint}>{ar.history.whoHint}</p>
      <Button block icon="heart" onClick={() => setOpen(true)}>
        {ar.history.logCardio}
      </Button>
      <CardioSheet open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}
