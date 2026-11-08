import { ar } from "../../i18n/ar";
import { SectionTitle } from "../../ui/controls";

/** قسم البيانات (التصدير والاستيراد) — يكتمل في M6 */
export function DataSection() {
  return (
    <section>
      <SectionTitle>{ar.me.data}</SectionTitle>
      <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
        {ar.placeholder.soon}
      </p>
    </section>
  );
}
