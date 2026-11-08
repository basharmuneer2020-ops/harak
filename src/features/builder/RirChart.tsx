import { DELOAD } from "../../engine/prescription";
import { ar } from "../../i18n/ar";
import { Term } from "../../ui/Term";
import s from "./program.module.css";

/** مخطّط الـRIR لأسابيع التراكم الأربعة + أسبوع التفريغ (الأعمدة الأطول = جهدٌ أعلى) */
export function RirChart({
  rirByWeek,
  currentWeek,
}: {
  rirByWeek: number[];
  currentWeek?: number;
}) {
  const cols = [
    ...rirByWeek.map((r, i) => ({
      rir: r,
      label: String(i + 1),
      deload: false,
    })),
    { rir: DELOAD.rir, label: ar.program.deload, deload: true },
  ];
  return (
    <div
      className={s.rir}
      role="img"
      aria-label={cols
        .map((c, i) =>
          c.deload
            ? `${c.label}: RIR ${c.rir}`
            : `${ar.program.week(i + 1)}: RIR ${c.rir}`,
        )
        .join("، ")}
    >
      {cols.map((c, i) => (
        <div key={i} className={s.rirCol} data-current={currentWeek === i + 1}>
          <div
            className={s.rirBar}
            data-deload={c.deload}
            style={{ height: `${Math.max(18, ((5 - c.rir) / 5) * 100)}%` }}
          >
            {c.rir}
          </div>
          <span className={s.rirLbl}>
            {c.deload ? c.label : ar.program.week(i + 1)}
          </span>
        </div>
      ))}
      <span className="sr-only">
        <Term>RIR</Term>
      </span>
    </div>
  );
}
