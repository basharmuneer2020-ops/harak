import { useEffect, useState } from "react";
import { ar } from "../../i18n/ar";
import { useApp } from "../../store/useApp";
import type { Profile } from "../../types";
import { Page } from "../../ui/Page";
import { Button, Card, Notice, SectionTitle } from "../../ui/controls";
import { DataSection } from "../settings/DataSection";
import {
  EquipFields,
  LevelGoalFields,
  ScheduleFields,
  UnitsField,
} from "./ProfileFields";
import s from "./profile.module.css";

export default function MePage() {
  const profile = useApp((st) => st.profile);
  const saveProfile = useApp((st) => st.saveProfile);
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraft(profile), [profile]);

  if (!draft) return null;
  const set = (patch: Partial<Profile>) => {
    setSaved(false);
    setError(null);
    setDraft({ ...draft, ...patch });
  };
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  return (
    <Page title={ar.me.title} subtitle={ar.me.subtitle}>
      <section style={{ marginBottom: 28 }}>
        <SectionTitle>{ar.me.profile}</SectionTitle>
        <LevelGoalFields p={draft} set={set} />
        <ScheduleFields p={draft} set={set} />
        <EquipFields p={draft} set={set} />
        <UnitsField p={draft} set={set} />
        {dirty && <Notice tone="info">{ar.me.regenHint}</Notice>}
        {error && (
          <p className={s.err} role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" style={{ color: "var(--lime)", fontWeight: 700 }}>
            {ar.me.saved}
          </p>
        )}
        <div style={{ marginTop: 14 }}>
          <Button
            variant="primary"
            block
            icon="check"
            disabled={!dirty}
            onClick={async () => {
              if (!draft.equipment.length) {
                setError(ar.onboarding.needEquip);
                return;
              }
              await saveProfile(draft);
              setSaved(true);
            }}
          >
            {ar.me.save}
          </Button>
        </div>
      </section>

      <DataSection />

      <section style={{ marginTop: 28 }}>
        <SectionTitle>{ar.me.about}</SectionTitle>
        <Card flat>
          <p style={{ fontWeight: 700 }}>
            {ar.app.name} — {ar.app.tagline}
          </p>
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
            {ar.me.version} 1.0.0
          </p>
          <p style={{ marginTop: 10, fontSize: 14 }}>{ar.app.disclaimer}</p>
        </Card>
      </section>
    </Page>
  );
}
