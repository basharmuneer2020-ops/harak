import { useEffect, useRef, useState, type ReactNode } from "react";
import { ar } from "../i18n/ar";
import { Button } from "./controls";
import type { IconName } from "./Icon";

/**
 * زرّ إجراءٍ خطِر بتأكيدٍ من خطوتين: الضغطة الأولى تسلّحه وتعرض نصّ التأكيد،
 * والثانية (خلال 5 ثوانٍ) تنفّذ. يتجنّب نوافذ الحوار المنبثقة على الجوّال.
 */
export function ConfirmButton({
  children,
  confirmText,
  onConfirm,
  icon,
  small,
  block = true,
}: {
  children: ReactNode;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
  icon?: IconName;
  small?: boolean;
  block?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {armed && confirmText && (
        <p
          role="alert"
          style={{ color: "var(--red)", fontSize: 14, fontWeight: 700 }}
        >
          {confirmText}
        </p>
      )}
      <Button
        variant={armed ? "dangerSolid" : "danger"}
        icon={icon}
        small={small}
        block={block}
        onClick={async () => {
          if (!armed) {
            setArmed(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setArmed(false), 5000);
            return;
          }
          window.clearTimeout(timer.current);
          setArmed(false);
          await onConfirm();
        }}
      >
        {armed ? ar.app.confirm : children}
      </Button>
    </div>
  );
}
