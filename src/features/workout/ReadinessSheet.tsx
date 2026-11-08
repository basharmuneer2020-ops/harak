import { useState } from "react";
import {
  readinessLevel,
  readinessOptions,
  readinessScore,
  type Readiness,
} from "../../engine/readiness";
import { ar } from "../../i18n/ar";
import type { ReadinessChoice } from "../../types";
import { Button, Chip, Chips } from "../../ui/controls";
import { Sheet } from "../../ui/Sheet";
import { Ltr } from "../../ui/Term";
import s from "./workout.module.css";

function Scale({
  label,
  lo,
  hi,
  value,
  onChange,
}: {
  label: string;
  lo: string;
  hi: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={s.scale} role="radiogroup" aria-label={label}>
      <div className={s.scaleHead}>
        <span>{label}</span>
        <span className={s.scaleEnds}>
          1 {lo} · 5 {hi}
        </span>
      </div>
      <div className={s.scaleBtns}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${label}: ${n}`}
            className={s.scaleBtn}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** الاستعداد اليومي قبل الجلسة (2.8) وتطبيق أثره بضغطة */
export function ReadinessSheet({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (r: Readiness, choice: ReadinessChoice) => void;
}) {
  const [r, setR] = useState<Readiness>({ sleep: 3, soreness: 3, energy: 3 });
  const [choice, setChoice] = useState<ReadinessChoice | null>(null);
  const [skipped, setSkipped] = useState(false);
  const score = readinessScore(r);
  const level = readinessLevel(score);
  const options = readinessOptions(level);
  const current = choice && options.includes(choice) ? choice : options[0];
  const set = (patch: Partial<Readiness>) => {
    setR({ ...r, ...patch });
    setChoice(null);
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setSkipped(false);
        onClose();
      }}
      title={ar.readiness.title}
      subtitle={ar.readiness.subtitle}
    >
      {skipped ? (
        <>
          <p>{ar.readiness.skipped}</p>
          <Button block onClick={onClose}>
            {ar.app.close}
          </Button>
        </>
      ) : (
        <>
          <Scale
            label={ar.readiness.sleep}
            lo={ar.readiness.sleepLo}
            hi={ar.readiness.sleepHi}
            value={r.sleep}
            onChange={(v) => set({ sleep: v })}
          />
          <Scale
            label={ar.readiness.soreness}
            lo={ar.readiness.sorenessLo}
            hi={ar.readiness.sorenessHi}
            value={r.soreness}
            onChange={(v) => set({ soreness: v })}
          />
          <Scale
            label={ar.readiness.energy}
            lo={ar.readiness.energyLo}
            hi={ar.readiness.energyHi}
            value={r.energy}
            onChange={(v) => set({ energy: v })}
          />
          <div className={s.result} data-l={level} role="status">
            <div className={s.resultT}>
              {ar.readiness[level]} · <Ltr>{score.toFixed(1)}</Ltr>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-dim)" }}>
              {ar.readiness[`${level}Hint`]}
            </p>
          </div>
          {options.length > 1 && (
            <Chips label={ar.readiness.title}>
              {options.map((o) => (
                <Chip
                  key={o}
                  role="radio"
                  on={current === o}
                  onClick={() => setChoice(o)}
                >
                  {ar.readiness.choice[o]}
                </Chip>
              ))}
            </Chips>
          )}
          <Button
            variant="primary"
            block
            icon="play"
            onClick={() => onStart(r, current)}
          >
            {ar.readiness.go}
          </Button>
          {level === "low" && (
            <Button variant="ghost" block onClick={() => setSkipped(true)}>
              {ar.readiness.skipDay}
            </Button>
          )}
        </>
      )}
    </Sheet>
  );
}
