import { useEffect, type ReactNode } from "react";
import { ar } from "../i18n/ar";
import { goBack } from "../app/router";
import { Icon, type IconName } from "./Icon";
import s from "./Page.module.css";

interface PageProps {
  title: ReactNode;
  /** عنوان نصّي لتبويب المتصفّح إن كان title عنصراً مركّباً */
  docTitle?: string;
  kicker?: string;
  subtitle?: ReactNode;
  /** مسار الرجوع البديل؛ وجوده يُظهر زرّ «رجوع» */
  backTo?: string;
  actions?: ReactNode;
  /** أيقونة تظهر بجانب العنوان */
  icon?: IconName;
  children?: ReactNode;
}

export function Page({
  title,
  docTitle,
  kicker,
  subtitle,
  backTo,
  actions,
  icon,
  children,
}: PageProps) {
  const text = docTitle ?? (typeof title === "string" ? title : undefined);
  useEffect(() => {
    document.title = text ? `${text} — ${ar.app.name}` : ar.app.name;
  }, [text]);

  return (
    <>
      <header className={s.head}>
        {(backTo || actions) && (
          <div className={s.topRow}>
            {backTo && (
              <button
                type="button"
                className={s.back}
                onClick={() => goBack(backTo)}
              >
                <Icon name="back" size={16} />
                {ar.app.back}
              </button>
            )}
            {actions && <div className={s.actions}>{actions}</div>}
          </div>
        )}
        {kicker && <div className={s.kicker}>{kicker}</div>}
        {icon ? (
          <div className={s.titleRow}>
            <span className={s.titleIcon}>
              <Icon name={icon} size={30} />
            </span>
            <h1 className={s.title}>{title}</h1>
          </div>
        ) : (
          <h1 className={s.title}>{title}</h1>
        )}
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </header>
      {children}
    </>
  );
}
