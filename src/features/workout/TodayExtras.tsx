import { useMemo } from "react";
import { completedSessions, cyclePosition } from "../../engine/cycle";
import { earlyDeloadSignal } from "../../engine/progression";
import { ar } from "../../i18n/ar";
import { useActiveMesocycle } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import { Button, Notice } from "../../ui/controls";
import { CycleReportCard } from "./CycleReportCard";
import { WhoCard } from "../history/WhoCard";
import { backupDue } from "../../store/exportImport";
import { navigate } from "../../app/router";

/**
 * إضافات صفحة «اليوم»: اقتراح التفريغ المبكر وتقرير الدورة (أعلى الصفحة)،
 * ومؤشّرات WHO مع تسجيل الكارديو (أسفلها).
 */
export function TodayExtras({ top = false }: { top?: boolean }) {
  const meso = useActiveMesocycle();
  const sessions = useApp((st) => st.sessions);
  const saveMesocycle = useApp((st) => st.saveMesocycle);
  const setMeta = useApp((st) => st.setMeta);
  const meta = useApp((st) => st.meta);
  const profile = useApp((st) => st.profile);

  const signal = useMemo(() => {
    if (!meso) return null;
    const pos = cyclePosition(meso, sessions);
    if (pos.deload || pos.complete) return null;
    if (meso.deloadDismissedAt === pos.done) return null;
    return earlyDeloadSignal(completedSessions(meso, sessions), sessions);
  }, [meso, sessions]);

  if (!top) {
    return (
      <div style={{ marginTop: 16 }}>
        <WhoCard />
      </div>
    );
  }
  const due =
    !!profile &&
    backupDue(
      meta,
      sessions.filter((x) => x.endedAt).length,
      profile.createdAt,
    );
  const reminder = due ? (
    <div style={{ marginBottom: 16 }}>
      <Notice tone="info" icon="download">
        <strong style={{ display: "block", marginBottom: 4 }}>
          {ar.data.reminderTitle}
        </strong>
        <span>{ar.data.reminder}</span>
        <span
          style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}
        >
          <Button small variant="primary" onClick={() => navigate("/me")}>
            {ar.data.reminderGo}
          </Button>
          <Button
            small
            variant="ghost"
            onClick={() => void setMeta({ backupSnoozedAt: Date.now() })}
          >
            {ar.data.reminderLater}
          </Button>
        </span>
      </Notice>
    </div>
  ) : null;
  if (!meso) return reminder;
  const pos = cyclePosition(meso, sessions);
  if (pos.complete)
    return (
      <>
        {reminder}
        <CycleReportCard meso={meso} />
      </>
    );
  if (!signal) return reminder;
  return (
    <div style={{ marginBottom: 16 }}>
      {reminder}
      <Notice>
        <strong style={{ display: "block", marginBottom: 4 }}>
          {ar.deload.title}
        </strong>
        <span>{ar.deload[signal]}</span>
        <span
          style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}
        >
          <Button
            small
            variant="primary"
            onClick={() =>
              void saveMesocycle({ ...meso, earlyDeloadAt: pos.done })
            }
          >
            {ar.deload.accept}
          </Button>
          <Button
            small
            variant="ghost"
            onClick={() =>
              void saveMesocycle({ ...meso, deloadDismissedAt: pos.done })
            }
          >
            {ar.deload.dismiss}
          </Button>
        </span>
      </Notice>
    </div>
  );
}
