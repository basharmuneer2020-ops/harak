import type { ReactNode } from "react";
import { ar } from "../i18n/ar";
import { Icon, type IconName } from "../ui/Icon";
import { href } from "./router";
import s from "./Shell.module.css";

export type TabId = "today" | "program" | "library" | "history" | "me";

const TABS: { id: TabId; icon: IconName; label: string }[] = [
  { id: "today", icon: "today", label: ar.tabs.today },
  { id: "program", icon: "program", label: ar.tabs.program },
  { id: "library", icon: "library", label: ar.tabs.library },
  { id: "history", icon: "history", label: ar.tabs.history },
  { id: "me", icon: "me", label: ar.tabs.me },
];

export function Shell({
  active,
  hideTabs = false,
  children,
}: {
  active: TabId | null;
  hideTabs?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={s.shell}>
      <main
        id="main"
        className={hideTabs ? `${s.main} ${s.mainNoTabs}` : s.main}
      >
        {children}
      </main>
      {!hideTabs && (
        <nav className={s.tabbar} aria-label={ar.tabs.navLabel}>
          <ul className={s.tabs}>
            {TABS.map((t) => (
              <li key={t.id}>
                <a
                  href={href("/" + t.id)}
                  className={
                    active === t.id ? `${s.tab} ${s.tabActive}` : s.tab
                  }
                  aria-current={active === t.id ? "page" : undefined}
                >
                  <Icon name={t.icon} size={22} />
                  <span>{t.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
