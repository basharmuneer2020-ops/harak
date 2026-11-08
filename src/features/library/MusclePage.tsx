import { href, useRoute } from "../../app/router";
import { musclesOf } from "../../data/exercises";
import { MINOR_MUSCLES, MUSCLE_BY_ID, MUSCLE_NOTE } from "../../data/muscles";
import { patternsForMuscle } from "../../data/patterns";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import type { MuscleId, Pattern } from "../../types";
import { Icon } from "../../ui/Icon";
import { Page } from "../../ui/Page";
import { Term } from "../../ui/Term";
import { Empty, Notice, SectionTitle } from "../../ui/controls";
import { parseEquip } from "./query";
import { ExerciseRow } from "./PatternPage";
import s from "./library.module.css";

export default function MusclePage({ id }: { id: string }) {
  const route = useRoute();
  const equip = parseEquip(route.query.get("eq"));
  const { list } = useExercises();
  const m = MUSCLE_BY_ID[id as MuscleId];
  if (!m) {
    return (
      <Page title={ar.app.notFound} backTo="/library?v=muscle">
        <Empty>{ar.app.notFound}</Empty>
      </Page>
    );
  }
  const minor = MINOR_MUSCLES.includes(m.id);
  const { primary, secondary } = patternsForMuscle(m.id);
  const direct = list
    .filter((e) => musclesOf(e).primary.includes(m.id))
    .filter((e) => equip === "all" || e.equip === equip)
    .sort((a, b) => a.pattern.localeCompare(b.pattern) || a.diff - b.diff);

  const link = (p: Pattern, role: "pr" | "se") => (
    <a key={p.id} className={s.plink} href={href(`/library/pattern/${p.id}`)}>
      <span className={s.pic}>
        <Icon name={p.id} size={20} />
      </span>
      <span>
        <span style={{ fontWeight: 700, display: "block" }}>{p.ar}</span>
        <Term>{p.en}</Term>
      </span>
      <span className={`${s.role} ${role === "pr" ? s.rolePr : s.roleSe}`}>
        {role === "pr" ? ar.library.primary : ar.library.secondary}
      </span>
    </a>
  );

  return (
    <Page
      backTo="/library?v=muscle"
      docTitle={m.ar}
      title={m.ar}
      subtitle={<Term>{m.en}</Term>}
    >
      <section className={s.sec}>
        <SectionTitle>{ar.library.weeklyTarget}</SectionTitle>
        <p>{minor ? ar.library.minorTarget : ar.library.majorTarget}</p>
      </section>
      <section className={s.sec}>
        <SectionTitle>{ar.library.trainedBy}</SectionTitle>
        {primary.length ? (
          primary.map((p) => link(p, "pr"))
        ) : (
          <p className={s.hint}>{ar.library.noPrimaryPattern}</p>
        )}
        {secondary.map((p) => link(p, "se"))}
      </section>
      {MUSCLE_NOTE[m.id] && (
        <section className={s.sec}>
          <Notice tone="info">{MUSCLE_NOTE[m.id]}</Notice>
        </section>
      )}
      <section className={s.sec}>
        <SectionTitle>{ar.library.directExercises}</SectionTitle>
        <ul className={s.exList} style={{ padding: 0 }}>
          {direct.map((e) => (
            <ExerciseRow key={e.id} ex={e} />
          ))}
        </ul>
      </section>
    </Page>
  );
}
