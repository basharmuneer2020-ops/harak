import type { ReactNode } from "react";

/** مصطلح لاتيني داخل نصٍّ عربي: معزول الاتجاه وبخطٍّ أحادي المسافة */
export function Term({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className ? `term ${className}` : "term"}
      lang="en"
      dir="ltr"
    >
      {children}
    </span>
  );
}

/** صيغة رقمية (مثل «3 × 8–12») تُعرض من اليسار لليمين داخل سياقٍ عربي */
export function Ltr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={className ? `ltr num ${className}` : "ltr num"} dir="ltr">
      {children}
    </span>
  );
}
