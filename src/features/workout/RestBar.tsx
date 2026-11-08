import { useEffect, useState } from "react";
import { ar } from "../../i18n/ar";
import { Icon } from "../../ui/Icon";
import { Ltr } from "../../ui/Term";
import { beep, buzz, useRest } from "./restTimer";
import s from "./workout.module.css";

function mmss(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** شريط مؤقّت الراحة الثابت أسفل الشاشة */
export function RestBar() {
  const { endAt, total, label, add, stop } = useRest();
  const [now, setNow] = useState(() => Date.now());
  const [doneMsg, setDoneMsg] = useState(false);

  useEffect(() => {
    if (!endAt) return;
    setDoneMsg(false);
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= endAt) {
        window.clearInterval(id);
        buzz();
        beep();
        stop();
        setDoneMsg(true);
        window.setTimeout(() => setDoneMsg(false), 4000);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [endAt, stop]);

  if (!endAt) {
    return doneMsg ? (
      <div className={s.restBar} role="status">
        <span className={s.restDone}>
          <Icon name="check" size={18} /> {ar.workout.restDone}
        </span>
      </div>
    ) : null;
  }
  const left = endAt - now;
  const pct = total ? Math.max(0, Math.min(1, left / (total * 1000))) : 0;
  return (
    <div className={s.restBar} role="timer" aria-live="off">
      <div className={s.restProgress} style={{ width: `${pct * 100}%` }} />
      <div className={s.restRow}>
        <div className={s.restInfo}>
          <span className={s.restLbl}>
            <Icon name="timer" size={16} /> {ar.workout.rest}
            {label ? ` · ${label}` : ""}
          </span>
          <span className={s.restTime}>
            <Ltr>{mmss(left)}</Ltr>
          </span>
        </div>
        <button type="button" className={s.restBtn} onClick={() => add(-15)}>
          <Ltr>−15</Ltr>
        </button>
        <button type="button" className={s.restBtn} onClick={() => add(15)}>
          <Ltr>+15</Ltr>
        </button>
        <button type="button" className={s.restSkip} onClick={stop}>
          {ar.workout.restSkip}
        </button>
      </div>
    </div>
  );
}
