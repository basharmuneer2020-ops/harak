import { MINOR_MUSCLES, MUSCLES, REGIONS } from "../../data/muscles";
import { MINOR_MIN, VOLUME_MAX, VOLUME_MIN } from "../../engine/builder";
import { volumeStatus } from "./volumeStatus";
import { ar } from "../../i18n/ar";
import { Ltr } from "../../ui/Term";
import s from "./program.module.css";

const SCALE = 24;

/**
 * خريطة الحجم الأسبوعي لكل عضلة مقابل الهدف [10، 20] (أو ≥ 4 للثانوية):
 * أحمر تحت الهدف، أخضر داخله، برتقالي فوقه.
 */
export function VolumeMap({
  volume,
  frequency,
}: {
  volume: Record<string, number>;
  frequency?: Record<string, number>;
}) {
  const pct = (v: number) => `${(Math.min(v, SCALE) / SCALE) * 100}%`;
  return (
    <div className={s.vmap}>
      {REGIONS.map((r) => (
        <div key={r.id} className={s.vregion}>
          <div className={s.vregionT}>{r.ar}</div>
          {MUSCLES.filter((m) => m.region === r.id).map((m) => {
            const v = volume[m.id] ?? 0;
            const minor = MINOR_MUSCLES.includes(m.id);
            const st = volumeStatus(m.id, v);
            const lo = minor ? MINOR_MIN : VOLUME_MIN;
            const hi = minor ? SCALE : VOLUME_MAX;
            const label = `${m.ar}: ${v} — ${
              st === "low"
                ? ar.program.legendLow
                : st === "high"
                  ? ar.program.legendHigh
                  : ar.program.legendOk
            }`;
            return (
              <div key={m.id} className={s.vrow} role="img" aria-label={label}>
                <span className={s.vname}>{m.ar}</span>
                <span className={s.vtrack}>
                  <span
                    className={s.vzone}
                    style={{
                      insetInlineStart: pct(lo),
                      width: `calc(${pct(hi)} - ${pct(lo)})`,
                    }}
                  />
                  <span
                    className={s.vfill}
                    data-s={st}
                    style={{ width: pct(v) }}
                  />
                </span>
                <span className={s.vval}>
                  <Ltr>{v}</Ltr>
                  {frequency && !minor && (
                    <small>
                      {" · "}
                      <Ltr>{frequency[m.id] ?? 0}×</Ltr>
                    </small>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <div className={s.legend} aria-hidden="true">
        <span>
          <i style={{ background: "var(--red)" }} />
          {ar.program.legendLow}
        </span>
        <span>
          <i style={{ background: "var(--lime)" }} />
          {ar.program.legendOk}
        </span>
        <span>
          <i style={{ background: "var(--amber)" }} />
          {ar.program.legendHigh}
        </span>
      </div>
    </div>
  );
}
