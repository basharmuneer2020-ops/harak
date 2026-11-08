import { create } from "zustand";

/**
 * مؤقّت الراحة: يبدأ تلقائياً بعد تسجيل المجموعة، ويحسب المتبقّي من وقت الانتهاء
 * (لا يتأثّر بإطفاء الشاشة)، ويهتزّ ويُصدر صوتاً عند الانتهاء إن سمح المتصفّح.
 */
interface RestState {
  endAt: number | null;
  total: number;
  label: string;
  start(sec: number, label?: string): void;
  add(sec: number): void;
  stop(): void;
}

export const useRest = create<RestState>((set, get) => ({
  endAt: null,
  total: 0,
  label: "",
  start(sec, label = "") {
    primeAudio();
    set({ endAt: Date.now() + sec * 1000, total: sec, label });
  },
  add(sec) {
    const { endAt, total } = get();
    if (!endAt) return;
    const next = Math.max(Date.now() + 1000, endAt + sec * 1000);
    set({ endAt: next, total: Math.max(1, total + sec) });
  },
  stop() {
    set({ endAt: null, total: 0, label: "" });
  },
}));

let audio: AudioContext | null = null;

/** يُهيّئ الصوت ضمن لمسة المستخدم (شرط المتصفّحات) */
export function primeAudio(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    audio ??= new Ctor();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    /* الصوت غير متاح */
  }
}

export function beep(): void {
  try {
    if (!audio) return;
    const now = audio.currentTime;
    for (const [i, f] of [880, 1175].entries()) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = now + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.22);
    }
  } catch {
    /* تجاهل */
  }
}

export function buzz(): void {
  try {
    navigator.vibrate?.([220, 120, 220]);
  } catch {
    /* تجاهل */
  }
}
