import { EQUIP_IDS, EQUIP_INFO, JOINT_IDS } from "../../data/equipment";
import { ar } from "../../i18n/ar";
import type {
  DaysPerWeek,
  Goal,
  Level,
  PlateKg,
  Profile,
  SessionMinutes,
} from "../../types";
import { Chip, Chips } from "../../ui/controls";
import { Ltr, Term } from "../../ui/Term";
import s from "./profile.module.css";

const GOALS: Goal[] = ["strength", "hypertrophy", "general", "endurance"];
const DAYS: DaysPerWeek[] = [2, 3, 4, 5, 6];
const MINUTES: SessionMinutes[] = [30, 45, 60, 75];
const PLATES: PlateKg[] = [1.25, 2.5, 5];

type Patch = (p: Partial<Profile>) => void;

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function LevelGoalFields({ p, set }: { p: Profile; set: Patch }) {
  return (
    <>
      <fieldset className={s.group}>
        <legend className={s.lbl}>{ar.onboarding.level}</legend>
        <div className={s.options}>
          {([1, 2, 3] as Level[]).map((l) => (
            <button
              key={l}
              type="button"
              className={s.option}
              role="radio"
              aria-checked={p.level === l}
              onClick={() => set({ level: l })}
            >
              <span className={s.optTitle}>{ar.levels[l]}</span>
              <span className={s.optHint}>{ar.onboarding.levelHint[l]}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className={s.group}>
        <legend className={s.lbl}>{ar.onboarding.goal}</legend>
        <div className={s.options}>
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              className={s.option}
              role="radio"
              aria-checked={p.goal === g}
              onClick={() => set({ goal: g })}
            >
              <span className={s.optTitle}>{ar.goals[g]}</span>
              <span className={s.optHint}>{ar.onboarding.goalHint[g]}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}

export function ScheduleFields({ p, set }: { p: Profile; set: Patch }) {
  return (
    <>
      <fieldset className={s.group}>
        <legend className={s.lbl}>{ar.onboarding.days}</legend>
        <Chips>
          {DAYS.map((d) => (
            <Chip
              key={d}
              role="radio"
              on={p.daysPerWeek === d}
              onClick={() => set({ daysPerWeek: d })}
            >
              <Ltr>{d}</Ltr>
            </Chip>
          ))}
        </Chips>
      </fieldset>
      <fieldset className={s.group}>
        <legend className={s.lbl}>{ar.onboarding.minutes}</legend>
        <Chips>
          {MINUTES.map((m) => (
            <Chip
              key={m}
              role="radio"
              on={p.sessionMinutes === m}
              onClick={() => set({ sessionMinutes: m })}
            >
              <Ltr>{m}</Ltr> {ar.onboarding.minutesUnit}
            </Chip>
          ))}
        </Chips>
      </fieldset>
    </>
  );
}

export function EquipFields({ p, set }: { p: Profile; set: Patch }) {
  return (
    <>
      <fieldset className={s.group}>
        <legend className={s.lbl}>{ar.onboarding.equipment}</legend>
        <Chips>
          {EQUIP_IDS.map((k) => (
            <Chip
              key={k}
              k={k}
              role="checkbox"
              icon={EQUIP_INFO[k].icon}
              on={p.equipment.includes(k)}
              onClick={() => set({ equipment: toggle(p.equipment, k) })}
            >
              {EQUIP_INFO[k].name}
            </Chip>
          ))}
        </Chips>
      </fieldset>
      <fieldset className={s.group}>
        <legend className={s.lbl}>{ar.onboarding.joints}</legend>
        <Chips>
          {JOINT_IDS.map((j) => (
            <Chip
              key={j}
              role="checkbox"
              on={p.sensitiveJoints.includes(j)}
              onClick={() =>
                set({ sensitiveJoints: toggle(p.sensitiveJoints, j) })
              }
            >
              {ar.joints[j]}
            </Chip>
          ))}
        </Chips>
      </fieldset>
      <fieldset className={s.group}>
        <legend className={s.lbl}>{ar.onboarding.plate}</legend>
        <Chips>
          {PLATES.map((k) => (
            <Chip
              key={k}
              role="radio"
              on={p.minPlateKg === k}
              onClick={() => set({ minPlateKg: k })}
            >
              <Ltr>{k}</Ltr> <Term>kg</Term>
            </Chip>
          ))}
        </Chips>
      </fieldset>
    </>
  );
}

export function UnitsField({ p, set }: { p: Profile; set: Patch }) {
  return (
    <fieldset className={s.group}>
      <legend className={s.lbl}>{ar.me.units}</legend>
      <Chips>
        {(["kg", "lb"] as const).map((u) => (
          <Chip
            key={u}
            role="radio"
            on={p.units === u}
            onClick={() => set({ units: u })}
          >
            <Term>{u}</Term>
          </Chip>
        ))}
      </Chips>
    </fieldset>
  );
}
