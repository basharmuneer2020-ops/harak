import { useState } from "react";
import { ar } from "../../i18n/ar";
import { uid, useApp } from "../../store/useApp";
import type { CardioLog } from "../../types";
import { Button, Chip, Chips, Field } from "../../ui/controls";
import { inputClass } from "../../ui/classes";
import { NumberStepper } from "../../ui/NumberStepper";
import { Sheet } from "../../ui/Sheet";

const TYPES = ["walk", "run", "bike", "swim", "other"] as const;

/** تسجيل كارديو سريع (F7): النوع، الدقائق، الشدّة، ملاحظة */
export function CardioSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const save = useApp((st) => st.saveCardio);
  const [type, setType] = useState<(typeof TYPES)[number]>("walk");
  const [minutes, setMinutes] = useState(30);
  const [intensity, setIntensity] =
    useState<CardioLog["intensity"]>("moderate");
  const [note, setNote] = useState("");

  return (
    <Sheet open={open} onClose={onClose} title={ar.cardio.title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dim)" }}
        >
          {ar.cardio.type}
        </span>
        <Chips label={ar.cardio.type}>
          {TYPES.map((t) => (
            <Chip
              key={t}
              role="radio"
              on={type === t}
              onClick={() => setType(t)}
            >
              {ar.cardio.types[t]}
            </Chip>
          ))}
        </Chips>
      </div>
      <NumberStepper
        label={ar.cardio.minutes}
        value={minutes}
        onChange={setMinutes}
        step={5}
        min={1}
        max={600}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dim)" }}
        >
          {ar.cardio.intensity}
        </span>
        <Chips label={ar.cardio.intensity}>
          <Chip
            role="radio"
            on={intensity === "moderate"}
            onClick={() => setIntensity("moderate")}
          >
            {ar.cardio.moderate}
          </Chip>
          <Chip
            role="radio"
            on={intensity === "vigorous"}
            onClick={() => setIntensity("vigorous")}
          >
            {ar.cardio.vigorous}
          </Chip>
        </Chips>
        <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
          {ar.cardio.intensityHint}
        </p>
      </div>
      <Field label={ar.cardio.note}>
        <input
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <Button
        variant="primary"
        block
        icon="check"
        onClick={async () => {
          const log: CardioLog = {
            id: uid("c-"),
            ts: Date.now(),
            type,
            minutes,
            intensity,
          };
          if (note.trim()) log.note = note.trim();
          await save(log);
          setNote("");
          onClose();
        }}
      >
        {ar.cardio.save}
      </Button>
    </Sheet>
  );
}
