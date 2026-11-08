import { EXERCISES } from "../../data/exercises";
import { useApp } from "../../store/useApp";
import {
  exportFileName,
  fileToSnapshot,
  mergeSnapshots,
  parseExportFile,
  sessionsToCsv,
  toExportFile,
} from "../../store/exportImport";
import type { ExportFile } from "../../types";

function download(name: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function snapshot() {
  const st = useApp.getState();
  return {
    profile: st.profile,
    mesocycles: st.mesocycles,
    sessions: st.sessions,
    states: st.states,
    cardio: st.cardio,
    customExercises: st.customExercises,
    meta: st.meta,
  };
}

/** يصدّر كل البيانات ملفَّ JSON واحداً ويسجّل وقت التصدير (لتذكير النسخ) */
export async function exportJson(): Promise<void> {
  const st = useApp.getState();
  const now = Date.now();
  const finished = st.sessions.filter((s) => s.endedAt).length;
  await st.setMeta({
    lastExportAt: now,
    sessionsAtLastExport: finished,
    backupSnoozedAt: undefined,
  });
  const file = toExportFile(snapshot(), now);
  download(
    exportFileName(now),
    JSON.stringify(file, null, 2),
    "application/json",
  );
}

export function exportCsv(): void {
  const st = useApp.getState();
  const list = [...EXERCISES, ...st.customExercises];
  const csv = sessionsToCsv(
    st.sessions,
    Object.fromEntries(list.map((e) => [e.id, e])),
  );
  download(
    exportFileName().replace(".json", ".csv"),
    csv,
    "text/csv;charset=utf-8",
  );
}

export async function readImportFile(
  file: File,
): Promise<{ ok: true; file: ExportFile } | { ok: false; error: string }> {
  const text = await file.text();
  return parseExportFile(text);
}

/** يطبّق الاستيراد: دمجٌ آمن أو استبدالٌ كامل (بعد تأكيد المستخدم) */
export async function applyImport(
  file: ExportFile,
  mode: "merge" | "replace",
): Promise<void> {
  const incoming = fileToSnapshot(file);
  const merged = mergeSnapshots(snapshot(), incoming, mode);
  await useApp.getState().replaceAll(merged);
}
