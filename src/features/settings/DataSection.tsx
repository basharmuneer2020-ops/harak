import { useRef, useState } from "react";
import { ar } from "../../i18n/ar";
import { useApp } from "../../store/useApp";
import type { ExportFile } from "../../types";
import { ConfirmButton } from "../../ui/ConfirmButton";
import { Button, Card, Notice, SectionTitle } from "../../ui/controls";
import { fmtDate } from "../history/format";
import {
  applyImport,
  exportCsv,
  exportJson,
  readImportFile,
} from "./dataActions";

/** محدّد ملف الاستيراد مع معاينةٍ وخيارَي الدمج والاستبدال */
export function ImportPicker({
  restoreOnly = false,
  onDone,
}: {
  restoreOnly?: boolean;
  onDone?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<ExportFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const finish = () => {
    setFile(null);
    setDone(true);
    onDone?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label={ar.data.import}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setDone(false);
          const r = await readImportFile(f);
          if (r.ok) {
            setError(null);
            setFile(r.file);
          } else {
            setFile(null);
            setError(ar.data.invalid(r.error));
          }
        }}
      />
      <Button block icon="upload" onClick={() => input.current?.click()}>
        {restoreOnly ? ar.data.restore : ar.data.import}
      </Button>
      {error && <Notice tone="danger">{error}</Notice>}
      {done && (
        <p role="status" style={{ color: "var(--lime)", fontWeight: 700 }}>
          {ar.data.imported}
        </p>
      )}
      {file && (
        <Card flat>
          <p style={{ fontWeight: 700 }}>
            {ar.data.preview(
              file.sessions.length,
              file.mesocycles.length,
              file.cardio.length,
            )}
          </p>
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: 13.5,
              marginBottom: 10,
            }}
          >
            {ar.data.exportedAt(fmtDate(file.exportedAt))}
          </p>
          {restoreOnly ? (
            <Button
              variant="primary"
              block
              icon="check"
              onClick={async () => {
                await applyImport(file, "replace");
                finish();
              }}
            >
              {ar.data.restore}
            </Button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Button
                variant="primary"
                block
                icon="check"
                onClick={async () => {
                  await applyImport(file, "merge");
                  finish();
                }}
              >
                {ar.data.merge}
              </Button>
              <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
                {ar.data.mergeHint}
              </p>
              <ConfirmButton
                confirmText={ar.data.replaceConfirm}
                icon="refresh"
                onConfirm={async () => {
                  await applyImport(file, "replace");
                  finish();
                }}
              >
                {ar.data.replace}
              </ConfirmButton>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/** قسم البيانات في «أنا»: تصدير JSON وCSV واستيراد بتحقّقٍ ودمجٍ آمن */
export function DataSection() {
  const meta = useApp((st) => st.meta);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <section id="data">
      <SectionTitle>{ar.data.title}</SectionTitle>
      <Card>
        <p style={{ fontSize: 14, marginBottom: 6 }}>{ar.data.hint}</p>
        <p
          style={{ color: "var(--text-dim)", fontSize: 13.5, marginBottom: 12 }}
        >
          {meta.lastExportAt
            ? ar.data.lastExport(fmtDate(meta.lastExportAt))
            : ar.data.neverExported}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button
            variant="primary"
            block
            icon="download"
            onClick={async () => {
              await exportJson();
              setMsg(ar.data.exported);
            }}
          >
            {ar.data.exportJson}
          </Button>
          <Button
            block
            icon="download"
            onClick={() => {
              exportCsv();
              setMsg(ar.data.exported);
            }}
          >
            {ar.data.exportCsv}
          </Button>
          {msg && (
            <p role="status" style={{ color: "var(--lime)", fontWeight: 700 }}>
              {msg}
            </p>
          )}
          <ImportPicker />
        </div>
      </Card>
    </section>
  );
}
