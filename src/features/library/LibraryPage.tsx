import { useMemo } from "react";
import { navigate, href, useRoute } from "../../app/router";
import { EQUIP_IDS, EQUIP_INFO } from "../../data/equipment";
import {
  MINOR_MUSCLES,
  MUSCLES,
  MUSCLE_DESC,
  REGIONS,
} from "../../data/muscles";
import { PATTERNS, patternsForMuscle } from "../../data/patterns";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import type { Equip } from "../../types";
import { Icon } from "../../ui/Icon";
import { Page } from "../../ui/Page";
import { Term } from "../../ui/Term";
import {
  Chip,
  Chips,
  LinkButton,
  MuscleChip,
  SectionTitle,
  Segmented,
} from "../../ui/controls";
import { parseEquip } from "./query";
import s from "./library.module.css";

type View = "movement" | "muscle";

export default function LibraryPage() {
  const route = useRoute();
  const view: View = route.query.get("v") === "muscle" ? "muscle" : "movement";
  const equip = parseEquip(route.query.get("eq"));
  const { list } = useExercises();

  const setQuery = (v: View, eq: Equip | "all") => {
    const q = new URLSearchParams();
    if (v !== "movement") q.set("v", v);
    if (eq !== "all") q.set("eq", eq);
    const qs = q.toString();
    navigate("/library" + (qs ? "?" + qs : ""), { replace: true });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of list) {
      if (equip !== "all" && e.equip !== equip) continue;
      c[e.pattern] = (c[e.pattern] ?? 0) + 1;
    }
    return c;
  }, [list, equip]);

  const eqQuery = equip !== "all" ? `?eq=${equip}` : "";

  return (
    <Page
      title={ar.library.title}
      subtitle={ar.library.subtitle}
      actions={
        <LinkButton
          href={href("/library/new")}
          small
          icon="plus"
          variant="ghost"
        >
          {ar.library.addCustom}
        </LinkButton>
      }
    >
      <div className={s.controls}>
        <Segmented
          label={ar.library.viewLabel}
          value={view}
          onChange={(v) => setQuery(v, equip)}
          options={[
            { value: "movement", label: ar.library.byMovement },
            { value: "muscle", label: ar.library.byMuscle },
          ]}
        />
        <div className={s.filterRow}>
          <span className={s.filterLbl}>{ar.library.equipFilter}:</span>
          <Chips label={ar.library.equipFilter}>
            <Chip
              k="all"
              on={equip === "all"}
              onClick={() => setQuery(view, "all")}
            >
              {ar.library.all}
            </Chip>
            {EQUIP_IDS.map((k) => (
              <Chip
                key={k}
                k={k}
                icon={EQUIP_INFO[k].icon}
                on={equip === k}
                onClick={() => setQuery(view, k)}
              >
                {EQUIP_INFO[k].name}
              </Chip>
            ))}
          </Chips>
        </div>
      </div>

      {view === "movement" ? (
        <div className={s.grid}>
          {PATTERNS.map((p, i) => (
            <a
              key={p.id}
              href={href(`/library/pattern/${p.id}${eqQuery}`)}
              className={s.pcard}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={s.ptop}>
                <div className={s.ic}>
                  <Icon name={p.id} size={24} />
                </div>
                <div>
                  <div className={s.pname}>{p.ar}</div>
                  <Term>{p.en}</Term>
                </div>
              </div>
              <div className={s.muscles}>
                {p.primary.map((m) => (
                  <MuscleChip key={m} id={m} primary />
                ))}
              </div>
              <div className={s.pfoot}>
                <span>
                  <b>{counts[p.id] ?? 0}</b> {ar.library.exerciseWord}
                  {equip !== "all" ? ` · ${EQUIP_INFO[equip].name}` : ""}
                </span>
                <span className={s.go}>
                  {ar.library.view} <Icon name="arrow" size={15} />
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div>
          <p className={s.hint} style={{ marginBottom: 20, marginTop: 0 }}>
            {ar.library.muscleIntro}
          </p>
          {REGIONS.map((r) => (
            <section key={r.id} className={s.region}>
              <SectionTitle>{r.ar}</SectionTitle>
              <div className={s.mgrid}>
                {MUSCLES.filter((m) => m.region === r.id).map((m) => {
                  const pp = patternsForMuscle(m.id);
                  const minor = MINOR_MUSCLES.includes(m.id);
                  return (
                    <a
                      key={m.id}
                      href={href(
                        `/library/muscle/${encodeURIComponent(m.id)}${eqQuery}`,
                      )}
                      className={s.mcard}
                    >
                      <div className={s.mn}>
                        {m.ar}
                        {minor && <span className={s.minorMark}> ·</span>}
                      </div>
                      <div className={s.mt}>
                        {MUSCLE_DESC[m.id] ??
                          `${ar.library.primaryPatterns(pp.primary.length)} · ${ar.library.secondaryPatterns(pp.secondary.length)}`}
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
