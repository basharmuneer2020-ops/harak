import type { SessionLog } from "../../types";

/** قرارات التقدّم عند إنهاء الجلسة — يكتمل في M4 */
export async function finalizeProgression(s: SessionLog): Promise<SessionLog> {
  return s;
}
