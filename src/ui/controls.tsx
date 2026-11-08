import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { EQUIP_INFO } from "../data/equipment";
import { ar } from "../i18n/ar";
import type { Equip, Exercise, Level, MuscleId } from "../types";
import { MUSCLE_BY_ID } from "../data/muscles";
import { Icon, type IconName } from "./Icon";
import { explainLinks } from "./links";
import s from "./controls.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dangerSolid";

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  small,
  block,
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  small?: boolean;
  block?: boolean;
  icon?: IconName;
}) {
  return (
    <button
      type="button"
      className={cx(
        s.btn,
        s[variant],
        small && s.small,
        block && s.block,
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={small ? 15 : 18} />}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "secondary",
  small,
  block,
  icon,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  small?: boolean;
  block?: boolean;
  icon?: IconName;
}) {
  return (
    <a
      className={cx(
        s.btn,
        s[variant],
        small && s.small,
        block && s.block,
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={small ? 15 : 18} />}
      {children}
    </a>
  );
}

export function Chip({
  on,
  k,
  icon,
  children,
  onClick,
  role,
}: {
  on: boolean;
  k?: string;
  icon?: IconName;
  children: ReactNode;
  onClick: () => void;
  role?: "radio" | "checkbox";
}) {
  const roleProps = role
    ? { role, "aria-checked": on }
    : { "aria-pressed": on };
  return (
    <button
      type="button"
      className={s.chip}
      data-k={k}
      onClick={onClick}
      {...roleProps}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function Chips({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className={s.chips} role="group" aria-label={label}>
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className={s.seg} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({
  children,
  flat,
  className,
  style,
}: {
  children: ReactNode;
  flat?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cx(flat ? s.cardFlat : s.card, className)} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  as: As = "h2",
}: {
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return <As className={s.secTitle}>{children}</As>;
}

export function EquipBadge({ equip }: { equip: Equip }) {
  return (
    <span className={s.badge} data-k={equip}>
      {EQUIP_INFO[equip].name}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className={s.tag}>{children}</span>;
}

export function DiffDots({ diff }: { diff: Level }) {
  return (
    <span
      className={s.diff}
      role="img"
      aria-label={`${ar.library.difficulty}: ${ar.levels[diff]}`}
      title={ar.levels[diff]}
    >
      {[1, 2, 3].map((n) => (
        <i key={n} data-on={n <= diff} />
      ))}
    </span>
  );
}

export function MuscleChip({
  id,
  primary,
}: {
  id: MuscleId;
  primary: boolean;
}) {
  return (
    <span className={cx(s.muscleChip, primary ? s.muscleP : s.muscleS)}>
      {MUSCLE_BY_ID[id]?.ar ?? id}
    </span>
  );
}

export function ExplainLinks({ ex }: { ex: Pick<Exercise, "en" | "ar"> }) {
  return (
    <div className={s.srcs}>
      {explainLinks(ex).map((l) => (
        <a
          key={l.key}
          className={cx(s.src, l.primary && s.srcPrimary)}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${l.label} — ${ar.library.explainFor} ${ex.ar}`}
        >
          <Icon name="play" size={13} />
          <span lang="en" dir="ltr">
            {l.label}
          </span>
        </a>
      ))}
    </div>
  );
}

export function Notice({
  tone = "warn",
  children,
  icon,
}: {
  tone?: "warn" | "info" | "danger";
  children: ReactNode;
  icon?: IconName;
}) {
  return (
    <div
      className={cx(
        s.notice,
        tone === "info" && s.noticeInfo,
        tone === "danger" && s.noticeDanger,
      )}
      role={tone === "danger" ? "alert" : undefined}
    >
      <Icon name={icon ?? (tone === "info" ? "info" : "alert")} size={18} />
      <div>{children}</div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className={s.empty}>{children}</div>;
}

export function Field({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}
