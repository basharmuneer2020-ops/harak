import { useState } from "react";
import { href, navigate } from "../../app/router";
import { PATTERN_BY_ID } from "../../data/patterns";
import { analyzeTemplates, chooseSplit } from "../../engine/builder";
import { cyclePosition } from "../../engine/cycle";
import { ar } from "../../i18n/ar";
import { useActiveMesocycle, useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import type { Exercise, Split } from "../../types";
import { ConfirmButton } from "../../ui/ConfirmButton";
import {
  Button,
  Card,
  Chip,
  Chips,
  EquipBadge,
  Notice,
  SectionTitle,
  Tag,
} from "../../ui/controls";
import { Icon } from "../../ui/Icon";
import { Page } from "../../ui/Page";
import { Ltr, Term } from "../../ui/Term";
import { generateMesocycle, swapInMesocycle } from "./actions";
import { RirChart } from "./RirChart";
import { Rx } from "./Rx";
import { SwapSheet } from "./SwapSheet";
import { VolumeMap } from "./VolumeMap";
import s from "./program.module.css";

const SPLITS: Split[] = ["full", "ul", "ppl"];

export default function ProgramPage() {
  const profile = useApp((st) => st.profile);
  const sessions = useApp((st) => st.sessions);
  const meso = useActiveMesocycle();
  const { byId } = useExercises();
  const [split, setSplit] = useState<Split | "auto">("auto");
  const [busy, setBusy] = useState(false);
  const [swap, setSwap] = useState<{
    templateId: string;
    slotIndex: number;
    ex: Exercise;
  } | null>(null);

  if (!profile) return null;
  const autoSplit = chooseSplit(profile.daysPerWeek);

  const generate = async (regenerate: boolean) => {
    setBusy(true);
    try {
      await generateMesocycle({
        split: split === "auto" ? undefined : split,
        regenerate,
      });
      window.scrollTo(0, 0);
    } finally {
      setBusy(false);
    }
  };

  const splitPicker = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontWeight: 700, color: "var(--text-dim)", fontSize: 14 }}>
        {ar.program.split}
      </div>
      <Chips label={ar.program.split}>
        <Chip
          role="radio"
          on={split === "auto"}
          onClick={() => setSplit("auto")}
        >
          {ar.program.splitAuto(ar.split[autoSplit])}
        </Chip>
        {SPLITS.filter((x) => x !== autoSplit).map((x) => (
          <Chip
            key={x}
            role="radio"
            on={split === x}
            onClick={() => setSplit(x)}
          >
            {ar.split[x]}
          </Chip>
        ))}
      </Chips>
      <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
        {ar.program.splitHint}
      </p>
    </div>
  );

  if (!meso) {
    return (
      <Page title={ar.program.title}>
        <Card className={s.hero}>
          <h2 style={{ fontSize: 22 }}>{ar.program.emptyTitle}</h2>
          <p className={s.heroText}>{ar.program.emptyBody}</p>
          {splitPicker}
          <div style={{ marginTop: 18 }}>
            <Button
              variant="primary"
              block
              icon="sparkle"
              disabled={busy}
              onClick={() => void generate(false)}
            >
              {ar.program.generate}
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  const pos = cyclePosition(meso, sessions);
  const stats = analyzeTemplates(meso.templates, profile.daysPerWeek, byId);
  const perWeek = stats.perWeek;

  return (
    <Page
      title={ar.program.title}
      subtitle={`${ar.split[meso.split]} · ${ar.goals[meso.goal ?? profile.goal]} · ${ar.levels[meso.level ?? profile.level]}`}
    >
      <div className={s.metaRow}>
        <span className={`${s.pill} ${s.pillLime}`}>
          {ar.program.currentWeek(
            pos.deload ? ar.program.deload : ar.program.week(pos.week),
          )}
        </span>
        <span className={s.pill}>
          {ar.program.progress(pos.done, pos.total)}
        </span>
        {stats.ratio !== null && (
          <span className={s.pill}>
            {ar.program.ratio("")}
            <Ltr>{stats.ratio}</Ltr>
          </span>
        )}
      </div>

      {meso.warnings.length > 0 ? (
        <div className={s.section}>
          <SectionTitle>{ar.program.warnings}</SectionTitle>
          <Notice>
            <ul
              style={{
                paddingInlineStart: 18,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {meso.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Notice>
        </div>
      ) : (
        <div className={s.section}>
          <Notice tone="info" icon="check">
            {ar.program.noWarnings}
          </Notice>
        </div>
      )}

      <section className={s.section}>
        <SectionTitle>{ar.program.sessions}</SectionTitle>
        <div className={s.stack}>
          {meso.templates.map((t, ti) => (
            <article key={t.id} className={s.tcard}>
              <div className={s.tHead}>
                <h3 className={s.tName}>{t.name}</h3>
                <span className={s.tMeta}>
                  {ar.program.perWeek(String(Math.round(perWeek * 10) / 10))} ·{" "}
                  {ar.program.minutesEst(stats.sessionMinutes[ti])}
                </span>
              </div>
              {t.slots.map((slot, si) => {
                const ex = byId[slot.exerciseId];
                if (!ex) return null;
                return (
                  <div key={si} className={s.slot}>
                    <div className={s.slotMain}>
                      <div className={s.slotTop}>
                        <span className={s.slotPat}>
                          <Icon name={slot.pattern} size={13} />
                          {PATTERN_BY_ID[slot.pattern].ar}
                        </span>
                        {slot.accessory && <Tag>{ar.program.accessory}</Tag>}
                      </div>
                      <a
                        className={s.slotEx}
                        href={href(`/library/exercise/${ex.id}`)}
                      >
                        {ex.ar}
                      </a>
                      <div className={s.slotRx}>
                        <EquipBadge equip={ex.equip} />
                        <Rx
                          sets={slot.sets}
                          reps={slot.prescription.reps}
                          rir={
                            meso.rirByWeek[Math.min(pos.week, 4) - 1] ??
                            slot.prescription.rir
                          }
                          restSec={slot.prescription.restSec}
                          ex={ex}
                        />
                      </div>
                    </div>
                    <Button
                      small
                      variant="ghost"
                      icon="swap"
                      aria-label={`${ar.program.swap}: ${ex.ar}`}
                      onClick={() =>
                        setSwap({ templateId: t.id, slotIndex: si, ex })
                      }
                    >
                      {ar.program.swap}
                    </Button>
                  </div>
                );
              })}
            </article>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Button
            variant="primary"
            block
            icon="play"
            onClick={() => navigate("/today")}
          >
            {ar.program.startToday}
          </Button>
        </div>
      </section>

      <section className={s.section}>
        <SectionTitle>{ar.program.volumeMap}</SectionTitle>
        <p
          style={{ color: "var(--text-dim)", fontSize: 13.5, marginBottom: 12 }}
        >
          {ar.program.volumeHint}
        </p>
        <Card>
          <VolumeMap
            volume={meso.volumeByMuscle}
            frequency={meso.frequencyByMuscle}
          />
        </Card>
      </section>

      <section className={s.section}>
        <SectionTitle>
          {ar.program.rirChart} <Term>RIR</Term>
        </SectionTitle>
        <Card>
          <RirChart rirByWeek={meso.rirByWeek} currentWeek={pos.week} />
          <p
            style={{ color: "var(--text-dim)", fontSize: 13.5, marginTop: 12 }}
          >
            {ar.program.rirHint}
          </p>
          <p style={{ fontSize: 13.5, marginTop: 6 }}>
            {ar.program.deloadDesc}
          </p>
        </Card>
      </section>

      <section className={s.section}>
        <SectionTitle>{ar.program.regenerate}</SectionTitle>
        <Card>
          {splitPicker}
          <div style={{ marginTop: 16 }}>
            {pos.done > 0 ? (
              <ConfirmButton
                confirmText={ar.program.regenerateConfirm}
                icon="refresh"
                onConfirm={() => generate(true)}
              >
                {ar.program.regenerate}
              </ConfirmButton>
            ) : (
              <Button
                block
                icon="refresh"
                disabled={busy}
                onClick={() => void generate(true)}
              >
                {ar.program.regenerate}
              </Button>
            )}
          </div>
        </Card>
      </section>

      <SwapSheet
        open={!!swap}
        current={swap?.ex ?? null}
        onClose={() => setSwap(null)}
        onPick={async (e) => {
          if (!swap) return;
          await swapInMesocycle(meso, swap.templateId, swap.slotIndex, e.id);
          setSwap(null);
        }}
      />
    </Page>
  );
}
