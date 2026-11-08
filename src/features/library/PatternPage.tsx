import { href, useRoute } from "../../app/router";
import { EQUIP_IDS, EQUIP_INFO } from "../../data/equipment";
import { PATTERN_BY_ID } from "../../data/patterns";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import type { Exercise, PatternId } from "../../types";
import { Icon } from "../../ui/Icon";
import { Page } from "../../ui/Page";
import { Term } from "../../ui/Term";
import {
  DiffDots,
  Empty,
  ExplainLinks,
  MuscleChip,
  SectionTitle,
  Tag,
} from "../../ui/controls";
import { parseEquip } from "./query";
import s from "./library.module.css";

export function ExerciseRow({ ex }: { ex: Exercise }) {
  return (
    <li className={s.exItem}>
      <div className={s.exRow}>
        <a className={s.exLink} href={href(`/library/exercise/${ex.id}`)}>
          {ex.ar}
        </a>
        <Term>{ex.en}</Term>
        <span className={s.exMeta}>
          {ex.custom && <Tag>{ar.library.custom}</Tag>}
          {ex.isolation && <Tag>{ar.library.isolation}</Tag>}
          {ex.timed && <Tag>{ar.library.timed}</Tag>}
          <DiffDots diff={ex.diff} />
        </span>
      </div>
      <ExplainLinks ex={ex} />
    </li>
  );
}

export default function PatternPage({ id }: { id: string }) {
  const route = useRoute();
  const equip = parseEquip(route.query.get("eq"));
  const { list } = useExercises();
  const p = PATTERN_BY_ID[id as PatternId];
  if (!p) {
    return (
      <Page title={ar.app.notFound} backTo="/library">
        <Empty>{ar.app.notFound}</Empty>
      </Page>
    );
  }
  const lanes = EQUIP_IDS.filter((k) => equip === "all" || equip === k);
  const byEquip = (k: string) =>
    list
      .filter((e) => e.pattern === p.id && e.equip === k)
      .sort((a, b) => a.diff - b.diff);

  return (
    <Page
      backTo="/library"
      docTitle={p.ar}
      icon={p.id}
      title={p.ar}
      subtitle={<Term>{p.en}</Term>}
    >
      <section className={s.sec}>
        <SectionTitle>{ar.library.essence}</SectionTitle>
        <p className={s.essence}>{p.essence}</p>
      </section>
      <section className={s.sec}>
        <SectionTitle>{ar.library.cue}</SectionTitle>
        <div className={s.cue}>{p.cue}</div>
      </section>
      <section className={s.sec}>
        <SectionTitle>{ar.library.targetMuscles}</SectionTitle>
        <div className={s.muscles}>
          {p.primary.map((m) => (
            <a
              key={m}
              href={href(`/library/muscle/${encodeURIComponent(m)}`)}
              style={{ textDecoration: "none" }}
            >
              <MuscleChip id={m} primary />
            </a>
          ))}
          {p.secondary.map((m) => (
            <a
              key={m}
              href={href(`/library/muscle/${encodeURIComponent(m)}`)}
              style={{ textDecoration: "none" }}
            >
              <MuscleChip id={m} primary={false} />
            </a>
          ))}
        </div>
      </section>
      <section className={s.sec}>
        <SectionTitle>
          {ar.library.exercisesAndLinks}
          {equip !== "all"
            ? ` · ${ar.library.onlyEquip(EQUIP_INFO[equip].name)}`
            : ""}
        </SectionTitle>
        {lanes.map((k) => {
          const exs = byEquip(k);
          if (equip === "all" && exs.length === 0) return null;
          return (
            <div key={k} className={s.lane} data-k={k}>
              <div className={s.laneH}>
                <div className={s.laneIc}>
                  <Icon name={EQUIP_INFO[k].icon} size={19} />
                </div>
                <div>
                  <div className={s.laneName}>{EQUIP_INFO[k].name}</div>
                  <div className={s.laneWhere}>{EQUIP_INFO[k].where}</div>
                </div>
              </div>
              {exs.length ? (
                <ul className={s.exList}>
                  {exs.map((e) => (
                    <ExerciseRow key={e.id} ex={e} />
                  ))}
                </ul>
              ) : (
                <p className={s.hint} style={{ padding: "0 15px 12px" }}>
                  {ar.library.noExercisesForEquip}
                </p>
              )}
            </div>
          );
        })}
        <p className={s.hint}>{ar.library.linksHint}</p>
      </section>
    </Page>
  );
}
