import { ar } from "../../i18n/ar";
import type { SessionLog } from "../../types";

/** قرارات التقدّم للجلسة القادمة — تكتمل في M4 */
export function DecisionList({ session }: { session: SessionLog }) {
  if (!session.decisions?.length)
    return <p style={{ color: "var(--text-dim)" }}>{ar.summary.noDecisions}</p>;
  return null;
}
