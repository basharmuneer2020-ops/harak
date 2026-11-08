import type { ReactElement } from "react";

/** مجموعة الأيقونات الخطّية — موروثة من النموذج الأولي مع إضافات للتطبيق */
const PATHS = {
  hpush: (
    <>
      <line x1="4" y1="5" x2="4" y2="19" />
      <line x1="8" y1="12" x2="20" y2="12" />
      <polyline points="15 7 20 12 15 17" />
    </>
  ),
  vpush: (
    <>
      <line x1="5" y1="20" x2="19" y2="20" />
      <line x1="12" y1="16" x2="12" y2="4" />
      <polyline points="7 9 12 4 17 9" />
    </>
  ),
  hpull: (
    <>
      <line x1="20" y1="5" x2="20" y2="19" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <polyline points="9 7 4 12 9 17" />
    </>
  ),
  vpull: (
    <>
      <line x1="5" y1="4" x2="19" y2="4" />
      <line x1="12" y1="8" x2="12" y2="20" />
      <polyline points="7 15 12 20 17 15" />
    </>
  ),
  squat: (
    <>
      <polyline points="4 8 12 16 20 8" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </>
  ),
  hinge: (
    <>
      <line x1="12" y1="20" x2="12" y2="12" />
      <line x1="12" y1="12" x2="19" y2="8" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),
  lunge: (
    <>
      <line x1="12" y1="5" x2="6" y2="19" />
      <line x1="12" y1="5" x2="18" y2="14" />
      <line x1="4" y1="19" x2="20" y2="19" />
    </>
  ),
  core: (
    <>
      <line x1="12" y1="4" x2="12" y2="15" />
      <line x1="6" y1="9" x2="6" y2="15" />
      <line x1="18" y1="9" x2="18" y2="15" />
      <line x1="9" y1="20" x2="15" y2="20" />
    </>
  ),
  bodyweight: (
    <>
      <circle cx="12" cy="6" r="2.4" />
      <line x1="12" y1="8.4" x2="12" y2="15" />
      <line x1="7.5" y1="11" x2="16.5" y2="11" />
      <line x1="12" y1="15" x2="8.5" y2="20" />
      <line x1="12" y1="15" x2="15.5" y2="20" />
    </>
  ),
  free: (
    <>
      <line x1="3" y1="12" x2="21" y2="12" />
      <rect x="2.5" y="8" width="3.2" height="8" rx="1.2" />
      <rect x="18.3" y="8" width="3.2" height="8" rx="1.2" />
    </>
  ),
  machine: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.2" />
      <line x1="4" y1="11.5" x2="20" y2="11.5" />
      <circle cx="12" cy="15.5" r="2.1" />
    </>
  ),
  arrow: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  back: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  chevron: <polyline points="9 6 15 12 9 18" />,
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none" />
    </>
  ),
  swap: (
    <>
      <polyline points="17 3 21 7 17 11" />
      <path d="M21 7H9a4 4 0 0 0-4 4" />
      <polyline points="7 21 3 17 7 13" />
      <path d="M3 17h12a4 4 0 0 0 4-4" />
    </>
  ),
  refresh: (
    <>
      <polyline points="21 4 21 10 15 10" />
      <path d="M20 14a8 8 0 1 1-1.6-6.5L21 10" />
    </>
  ),
  log: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  minus: <line x1="5" y1="12" x2="19" y2="12" />,
  check: <polyline points="20 6 9 17 4 12" />,
  x: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2.5" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="21.5" y2="12" />
      <line x1="5.3" y1="5.3" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="18.7" y2="18.7" />
      <line x1="5.3" y1="18.7" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="18.7" y2="5.3" />
    </>
  ),
  program: (
    <>
      <polygon points="12 3 21 8 12 13 3 8 12 3" />
      <polyline points="3 12.5 12 17.5 21 12.5" />
      <polyline points="3 17 12 22 21 17" />
    </>
  ),
  library: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  history: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <line x1="3.5" y1="10" x2="20.5" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  me: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <line x1="12" y1="13" x2="12" y2="9" />
      <line x1="9.5" y1="2.5" x2="14.5" y2="2.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.5 20h19L12 3z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H5a3 3 0 0 0 3 4" />
      <path d="M16 6h3a3 3 0 0 1-3 4" />
      <line x1="12" y1="13" x2="12" y2="17" />
      <line x1="8.5" y1="20" x2="15.5" y2="20" />
    </>
  ),
  up: <polyline points="6 15 12 9 18 15" />,
  down: <polyline points="6 9 12 15 18 9" />,
  hold: (
    <>
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </>
  ),
  trash: (
    <>
      <polyline points="4 7 20 7" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M9.5 7V4.5h5V7" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <line x1="13.5" y1="6.5" x2="17.5" y2="10.5" />
    </>
  ),
  download: (
    <>
      <line x1="12" y1="4" x2="12" y2="15" />
      <polyline points="7 10.5 12 15.5 17 10.5" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </>
  ),
  upload: (
    <>
      <line x1="12" y1="15.5" x2="12" y2="4.5" />
      <polyline points="7 9 12 4 17 9" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />
  ),
  flame: (
    <path d="M12 21c-3.6 0-6-2.5-6-5.8 0-3.8 3.3-5.4 3.8-9.2 2.6 1.6 3.4 4 3.2 5.6 1-.6 1.8-1.8 2-3 1.9 1.6 3 3.9 3 6.4 0 3.4-2.4 6-6 6z" />
  ),
  pause: (
    <>
      <line x1="9" y1="6" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="18" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <line x1="20" y1="4" x2="11" y2="13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  muscle: (
    <>
      <path d="M6 15c0-4 2-8 5-9 1.2-.4 2 .4 1.6 1.5L11.5 10c2-1 5-.5 6.5 1.5 1.6 2.2.6 6.5-4 7.5-3.7.8-8-.3-8-4z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <line x1="3.5" y1="10" x2="20.5" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** وصف نصّي للأيقونة إن لم يكن بجوارها نص */
  label?: string;
}

export function Icon({ name, size = 20, className, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
