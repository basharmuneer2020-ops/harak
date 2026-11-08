import { href, navigate } from "../../app/router";
import { chainPosition } from "../../data/chains";
import { EQUIP_INFO } from "../../data/equipment";
import { musclesOf } from "../../data/exercises";
import { PATTERN_BY_ID } from "../../data/patterns";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import { Icon } from "../../ui/Icon";
import { Page } from "../../ui/Page";
import { Term } from "../../ui/Term";
import { ConfirmButton } from "../../ui/ConfirmButton";
import {
  DiffDots,
  Empty,
  EquipBadge,
  ExplainLinks,
  MuscleChip,
  SectionTitle,
  Tag,
} from "../../ui/controls";
import s from "./library.module.css";

export default function ExercisePage({ id }: { id: string }) {
  const { byId } = useExercises();
  const deleteCustom = useApp((st) => st.deleteCustomExercise);
  const ex = byId[id];
  if (!ex) {
    return (
      <Page title={ar.library.exerciseNotFound} backTo="/library">
        <Empty>{ar.library.exerciseNotFound}</Empty>
      </Page>
    );
  }
  const p = PATTERN_BY_ID[ex.pattern];
  const { primary, secondary } = musclesOf(ex);
  const chain = chainPosition(ex.id);

  return (
    <Page
      backTo={`/library/pattern/${ex.pattern}`}
      docTitle={ex.ar}
      title={ex.ar}
      subtitle={<Term>{ex.en}</Term>}
    >
      <section className={s.sec}>
        <div className={s.metaGrid}>
          <a
            className={s.metaItem}
            href={href(`/library/pattern/${p.id}`)}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className={s.metaLbl}>{ar.library.pattern}</div>
            <div className={s.metaVal}>
              <Icon name={p.id} size={16} />
              {p.ar}
            </div>
          </a>
          <div className={s.metaItem}>
            <div className={s.metaLbl}>{ar.library.equipment}</div>
            <div className={s.metaVal}>
              <EquipBadge equip={ex.equip} />
              <span className="sr-only">{EQUIP_INFO[ex.equip].where}</span>
            </div>
          </div>
          <div className={s.metaItem}>
            <div className={s.metaLbl}>{ar.library.difficulty}</div>
            <div className={s.metaVal}>
              <DiffDots diff={ex.diff} />
              <span>{ar.levels[ex.diff]}</span>
            </div>
          </div>
        </div>
        {(ex.isolation || ex.timed || ex.custom) && (
          <div className={s.muscles} style={{ marginTop: 12, marginBottom: 0 }}>
            {ex.custom && <Tag>{ar.library.custom}</Tag>}
            {ex.isolation && <Tag>{ar.library.isolation}</Tag>}
            {ex.timed && <Tag>{ar.library.timed}</Tag>}
          </div>
        )}
      </section>

      <section className={s.sec}>
        <SectionTitle>{ar.library.explain}</SectionTitle>
        <ExplainLinks ex={ex} />
      </section>

      <section className={s.sec}>
        <SectionTitle>{ar.library.muscles}</SectionTitle>
        <div className={s.muscles}>
          {primary.map((m) => (
            <MuscleChip key={m} id={m} primary />
          ))}
          {secondary.map((m) => (
            <MuscleChip key={m} id={m} primary={false} />
          ))}
        </div>
      </section>

      {ex.cues.length > 0 && (
        <section className={s.sec}>
          <SectionTitle>{ar.library.cues}</SectionTitle>
          <ol className={s.list}>
            {ex.cues.map((c, i) => (
              <li key={i}>
                <span className={s.num}>{i + 1}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {ex.mistakes.length > 0 && (
        <section className={s.sec}>
          <SectionTitle>{ar.library.mistakes}</SectionTitle>
          <ul className={s.list}>
            {ex.mistakes.map((c, i) => (
              <li key={i}>
                <span className={s.xmark}>
                  <Icon name="x" size={13} />
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={s.sec}>
        <SectionTitle>{ar.library.joints}</SectionTitle>
        {ex.joints.length ? (
          <div className={s.muscles}>
            {ex.joints.map((j) => (
              <Tag key={j}>{ar.joints[j]}</Tag>
            ))}
          </div>
        ) : (
          <p className={s.hint} style={{ marginTop: 0 }}>
            {ar.library.noJoints}
          </p>
        )}
      </section>

      {chain && (
        <section className={s.sec}>
          <SectionTitle>
            {ar.library.chain} — {chain.chain.ar}
          </SectionTitle>
          <div className={s.chain}>
            {chain.chain.stages.map((st, i) => (
              <span
                key={st}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {i > 0 && <Icon name="chevron" size={14} className="flip" />}
                <a
                  className={s.chainStep}
                  href={href(`/library/exercise/${st}`)}
                  aria-current={st === ex.id}
                >
                  {byId[st]?.ar ?? st}
                </a>
              </span>
            ))}
          </div>
          <p className={s.hint}>
            {ar.library.chainHint}
            {chain.chain.note ? ` ${chain.chain.note}` : ""}
          </p>
        </section>
      )}

      {ex.custom && (
        <section className={s.sec}>
          <ConfirmButton
            confirmText={ar.library.deleteCustomConfirm}
            icon="trash"
            onConfirm={async () => {
              await deleteCustom(ex.id);
              navigate("/library", { replace: true });
            }}
          >
            {ar.library.deleteCustom}
          </ConfirmButton>
        </section>
      )}
    </Page>
  );
}
