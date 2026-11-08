import { useMemo, type ReactNode } from "react";
import { PATTERN_BY_ID } from "../../data/patterns";
import { alternativesFor } from "../../engine/builder";
import { ar } from "../../i18n/ar";
import { useExercises } from "../../store/selectors";
import { useApp } from "../../store/useApp";
import type { Exercise } from "../../types";
import { DiffDots, Empty, EquipBadge } from "../../ui/controls";
import { Sheet } from "../../ui/Sheet";
import { Term } from "../../ui/Term";
import s from "./program.module.css";

/** قائمة بدائل من النمط نفسه لتمرينٍ ما */
export function SwapSheet({
  current,
  open,
  onClose,
  onPick,
  pain,
  title,
  subtitle,
  footer,
}: {
  current: Exercise | null;
  open: boolean;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
  pain?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
}) {
  const profile = useApp((st) => st.profile);
  const { list } = useExercises();
  const alts = useMemo(
    () =>
      current && profile
        ? alternativesFor(current, profile, list, { pain })
        : [],
    [current, profile, list, pain],
  );
  if (!current) return null;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title ?? ar.program.swapTitle}
      subtitle={
        subtitle ?? ar.program.swapSub(PATTERN_BY_ID[current.pattern].ar)
      }
    >
      {footer}
      {alts.length ? (
        alts.map((e) => (
          <button
            key={e.id}
            type="button"
            className={s.alt}
            onClick={() => onPick(e)}
          >
            <span>
              <span className={s.altName}>{e.ar}</span>
              <Term>{e.en}</Term>
            </span>
            <span className={s.altMeta}>
              <EquipBadge equip={e.equip} />
              <DiffDots diff={e.diff} />
            </span>
          </button>
        ))
      ) : (
        <Empty>{ar.program.noAlternatives}</Empty>
      )}
    </Sheet>
  );
}
