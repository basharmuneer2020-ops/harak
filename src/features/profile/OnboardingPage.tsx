import { useEffect, useState } from "react";
import { navigate } from "../../app/router";
import { ar } from "../../i18n/ar";
import { useApp } from "../../store/useApp";
import type { Profile } from "../../types";
import { Button } from "../../ui/controls";
import { Icon } from "../../ui/Icon";
import { defaultProfile } from "./defaults";
import { EquipFields, LevelGoalFields, ScheduleFields } from "./ProfileFields";
import s from "./profile.module.css";

const STEPS = 4;

/** الإعداد الأول: أربع شاشات كحدٍّ أقصى، قابلة للتخطّي بقيمٍ افتراضية */
export default function OnboardingPage() {
  const saveProfile = useApp((st) => st.saveProfile);
  const setMeta = useApp((st) => st.setMeta);
  const [step, setStep] = useState(1);
  const [p, setP] = useState<Profile>(() => defaultProfile());
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Profile>) => {
    setError(null);
    setP((cur) => ({ ...cur, ...patch }));
  };

  useEffect(() => {
    document.title = `${ar.onboarding.welcomeTitle} — ${ar.app.name}`;
    window.scrollTo(0, 0);
  }, [step]);

  const finish = async (profile: Profile) => {
    if (!profile.equipment.length) {
      setError(ar.onboarding.needEquip);
      return;
    }
    const now = Date.now();
    await setMeta({ disclaimerAcceptedAt: now });
    await saveProfile({ ...profile, createdAt: now });
    navigate("/program", { replace: true });
  };

  return (
    <div className={s.ob}>
      <div className={s.obTop}>
        {step > 1 && (
          <Button
            small
            variant="ghost"
            icon="back"
            onClick={() => setStep(step - 1)}
          >
            {ar.app.back}
          </Button>
        )}
        <div
          className={s.dots}
          aria-label={ar.onboarding.step(step, STEPS)}
          role="img"
        >
          {Array.from({ length: STEPS }, (_, i) => (
            <i key={i} data-on={i < step} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <>
          <div>
            <h1 className={s.brand}>
              {ar.app.name}
              <span>.</span>
            </h1>
            <p style={{ color: "var(--text-dim)", marginTop: 6 }}>
              {ar.app.tagline}
            </p>
          </div>
          <h2 style={{ fontSize: 22 }}>{ar.onboarding.welcomeTitle}</h2>
          <p>{ar.onboarding.welcomeBody}</p>
          <div className={s.disclaimer} role="note">
            <b>{ar.app.disclaimerTitle}</b>
            {ar.app.disclaimer}
          </div>
          <div className={s.obActions}>
            <Button variant="primary" block onClick={() => setStep(2)}>
              {ar.onboarding.start}
              <Icon name="arrow" size={18} className="flip" />
            </Button>
            <Button
              variant="ghost"
              block
              onClick={() => void finish(defaultProfile())}
            >
              {ar.onboarding.skip}
            </Button>
            <p className={s.skipHint}>{ar.onboarding.skipHint}</p>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontSize: 28 }}>{ar.onboarding.levelTitle}</h1>
          <LevelGoalFields p={p} set={set} />
          <div className={s.obActions}>
            <Button variant="primary" block onClick={() => setStep(3)}>
              {ar.app.next}
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1 style={{ fontSize: 28 }}>{ar.onboarding.scheduleTitle}</h1>
          <ScheduleFields p={p} set={set} />
          <div className={s.obActions}>
            <Button variant="primary" block onClick={() => setStep(4)}>
              {ar.app.next}
            </Button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h1 style={{ fontSize: 28 }}>{ar.onboarding.equipTitle}</h1>
          <EquipFields p={p} set={set} />
          {error && (
            <p className={s.err} role="alert">
              {error}
            </p>
          )}
          <div className={s.obActions}>
            <Button
              variant="primary"
              block
              icon="check"
              onClick={() => void finish(p)}
            >
              {ar.onboarding.finish}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
