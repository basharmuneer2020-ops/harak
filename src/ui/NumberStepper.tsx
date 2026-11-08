import { useEffect, useId, useState } from "react";
import { Icon } from "./Icon";
import s from "./NumberStepper.module.css";

/** حقلٌ رقمي بزرّي ± كبيرين للّمس، ويقبل الكتابة المباشرة */
export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  unit,
  decimal = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  decimal?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const commit = (raw: string) => {
    const v = Number(raw.replace(",", "."));
    if (Number.isFinite(v)) onChange(clamp(Math.round(v * 100) / 100));
    else setText(String(value));
  };
  const bump = (d: number) =>
    onChange(clamp(Math.round((value + d) * 100) / 100));

  return (
    <div className={s.wrap}>
      <label htmlFor={id} className={s.lbl}>
        {label}
        {unit && (
          <span className={s.unit} lang="en" dir="ltr">
            {unit}
          </span>
        )}
      </label>
      <div className={s.row}>
        <button
          type="button"
          className={s.btn}
          onClick={() => bump(step)}
          aria-label={`${label} +`}
        >
          <Icon name="plus" size={18} />
        </button>
        <input
          id={id}
          className={s.input}
          inputMode={decimal ? "decimal" : "numeric"}
          dir="ltr"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <button
          type="button"
          className={s.btn}
          onClick={() => bump(-step)}
          aria-label={`${label} −`}
        >
          <Icon name="minus" size={18} />
        </button>
      </div>
    </div>
  );
}
