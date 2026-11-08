import { useState } from "react";
import { navigate } from "../../app/router";
import { EQUIP_IDS, EQUIP_INFO, JOINT_IDS } from "../../data/equipment";
import { MUSCLES } from "../../data/muscles";
import { PATTERNS, PATTERN_BY_ID } from "../../data/patterns";
import { ar } from "../../i18n/ar";
import { useApp, uid } from "../../store/useApp";
import type {
  Equip,
  Exercise,
  Joint,
  Level,
  MuscleId,
  PatternId,
} from "../../types";
import { Page } from "../../ui/Page";
import { Button, Chip, Chips, Field } from "../../ui/controls";
import { inputClass } from "../../ui/classes";
import s from "./library.module.css";

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function CustomExercisePage() {
  const save = useApp((st) => st.saveCustomExercise);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [pattern, setPattern] = useState<PatternId>("hpush");
  const [equip, setEquip] = useState<Equip>("free");
  const [diff, setDiff] = useState<Level>(1);
  const [primary, setPrimary] = useState<MuscleId[]>(
    PATTERN_BY_ID.hpush.primary,
  );
  const [secondary, setSecondary] = useState<MuscleId[]>(
    PATTERN_BY_ID.hpush.secondary,
  );
  const [joints, setJoints] = useState<Joint[]>([]);
  const [isolation, setIsolation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosePattern = (p: PatternId) => {
    setPattern(p);
    setPrimary(PATTERN_BY_ID[p].primary);
    setSecondary(PATTERN_BY_ID[p].secondary);
  };

  const submit = async () => {
    if (!nameAr.trim()) return setError(ar.custom.needName);
    if (primary.length === 0) return setError(ar.custom.needPrimary);
    const ex: Exercise = {
      id: uid("custom-"),
      ar: nameAr.trim(),
      en: nameEn.trim() || nameAr.trim(),
      pattern,
      equip,
      diff,
      primary,
      secondary: secondary.filter((m) => !primary.includes(m)),
      cues: [],
      mistakes: [],
      joints,
      custom: true,
    };
    if (isolation) ex.isolation = true;
    await save(ex);
    navigate(`/library/exercise/${ex.id}`, { replace: true });
  };

  return (
    <Page
      backTo="/library"
      title={ar.custom.title}
      subtitle={ar.custom.subtitle}
    >
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label={ar.custom.nameAr}>
          <input
            className={inputClass}
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder={ar.custom.nameArPh}
            required
          />
        </Field>
        <Field label={ar.custom.nameEn}>
          <input
            className={inputClass}
            value={nameEn}
            dir="ltr"
            lang="en"
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="incline dumbbell press"
          />
        </Field>

        <div className={s.formGroup}>
          <div className={s.formLbl}>{ar.custom.pattern}</div>
          <Chips label={ar.custom.pattern}>
            {PATTERNS.map((p) => (
              <Chip
                key={p.id}
                icon={p.id}
                on={pattern === p.id}
                onClick={() => choosePattern(p.id)}
              >
                {p.ar}
              </Chip>
            ))}
          </Chips>
        </div>

        <div className={s.formGroup}>
          <div className={s.formLbl}>{ar.custom.equip}</div>
          <Chips label={ar.custom.equip}>
            {EQUIP_IDS.map((k) => (
              <Chip
                key={k}
                k={k}
                icon={EQUIP_INFO[k].icon}
                on={equip === k}
                onClick={() => setEquip(k)}
              >
                {EQUIP_INFO[k].name}
              </Chip>
            ))}
          </Chips>
        </div>

        <div className={s.formGroup}>
          <div className={s.formLbl}>{ar.custom.diff}</div>
          <Chips label={ar.custom.diff}>
            {([1, 2, 3] as Level[]).map((n) => (
              <Chip key={n} on={diff === n} onClick={() => setDiff(n)}>
                {ar.levels[n]}
              </Chip>
            ))}
          </Chips>
        </div>

        <div className={s.formGroup}>
          <div className={s.formLbl}>{ar.custom.primary}</div>
          <p className={s.hint} style={{ marginTop: 0 }}>
            {ar.custom.musclesHint}
          </p>
          <Chips label={ar.custom.primary}>
            {MUSCLES.map((m) => (
              <Chip
                key={m.id}
                on={primary.includes(m.id)}
                onClick={() => {
                  setPrimary(toggle(primary, m.id));
                  setSecondary(secondary.filter((x) => x !== m.id));
                }}
              >
                {m.ar}
              </Chip>
            ))}
          </Chips>
        </div>

        <div className={s.formGroup}>
          <div className={s.formLbl}>{ar.custom.secondary}</div>
          <Chips label={ar.custom.secondary}>
            {MUSCLES.filter((m) => !primary.includes(m.id)).map((m) => (
              <Chip
                key={m.id}
                on={secondary.includes(m.id)}
                onClick={() => setSecondary(toggle(secondary, m.id))}
              >
                {m.ar}
              </Chip>
            ))}
          </Chips>
        </div>

        <div className={s.formGroup}>
          <div className={s.formLbl}>{ar.custom.joints}</div>
          <Chips label={ar.custom.joints}>
            {JOINT_IDS.map((j) => (
              <Chip
                key={j}
                on={joints.includes(j)}
                onClick={() => setJoints(toggle(joints, j))}
              >
                {ar.joints[j]}
              </Chip>
            ))}
          </Chips>
        </div>

        <Chips>
          <Chip on={isolation} onClick={() => setIsolation(!isolation)}>
            {ar.custom.isolation}
          </Chip>
        </Chips>

        {error && (
          <p className={s.err} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" block icon="check">
          {ar.custom.save}
        </Button>
      </form>
    </Page>
  );
}
