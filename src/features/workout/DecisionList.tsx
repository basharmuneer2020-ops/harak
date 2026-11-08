import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import type { ProgressionDecision, SessionLog } from "../../types";
import { Icon, type IconName } from "../../ui/Icon";
import { fmtWeight } from "./units";
import s from "./workout.module.css";

const ICON: Record<ProgressionDecision["kind"], IconName> = {
  increase: "up",
  advance: "up",
  reps: "plus",
  decrease: "down",
  regress: "down",
  hold: "hold",
  none: "hold",
};

/** قرارات التقدّم للجلسة القادمة، معروضةً بوضوح */
export function DecisionList({ session }: { session: SessionLog }) {
  const { byId } = useExercises();
  const units = useApp((st) => st.profile?.units ?? "kg");
  if (!session.decisions?.length)
    return <p style={{ color: "var(--text-dim)" }}>{ar.summary.noDecisions}</p>;
  const w = (kg?: number) => (kg !== undefined ? fmtWeight(kg, units) : "");
  const text = (d: ProgressionDecision): string => {
    const p = ar.progression;
    switch (d.kind) {
      case "increase":
        return p.increase(w(d.fromKg), w(d.toKg));
      case "decrease":
        return p.decrease(w(d.fromKg), w(d.toKg));
      case "hold":
        if (d.reason === "noWeight") return p.noWeight;
        if (d.toKg === undefined) return p.holdBw;
        return d.reason === "fail" ? p.holdFail(w(d.toKg)) : p.hold(w(d.toKg));
      case "reps":
        return p.reps(d.reason ?? "");
      case "advance":
        return p.advance(byId[d.toExerciseId ?? ""]?.ar ?? "");
      case "regress":
        return p.regress(byId[d.toExerciseId ?? ""]?.ar ?? "");
      default:
        return d.reason === "deload"
          ? p.deload
          : d.reason === "pain"
            ? p.pain
            : p.none;
    }
  };
  return (
    <ul style={{ listStyle: "none" }}>
      {session.decisions.map((d) => (
        <li key={d.exerciseId} className={s.decision}>
          <span className={s.dIcon} data-k={d.kind}>
            <Icon name={ICON[d.kind]} size={18} />
          </span>
          <span>
            <span className={s.dName}>
              {byId[d.exerciseId]?.ar ?? d.exerciseId}
            </span>
            <span className={s.dText} style={{ display: "block" }}>
              <bdi>{text(d)}</bdi>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
