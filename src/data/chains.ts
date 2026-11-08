/**
 * الملحق ب — سلالم التدرّج لتمارين وزن الجسم (من الأسهل إلى الأصعب).
 * الانتقال عند بلوغ high+3 في كل المجموعات، والتراجع عند العجز عن low مرّتين.
 */
export interface Chain {
  id: string;
  ar: string;
  stages: string[];
  /** ملاحظة تدرّج داخل الدرجة نفسها */
  note?: string;
  /** بديلٌ بالأوزان عند بلوغ قمّة السلّم (إن توفّرت الأداة) */
  weightedAlt?: string;
}

export const CHAINS: Chain[] = [
  {
    id: "chain-hpush",
    ar: "سلّم الدفع الأفقي",
    stages: ["incline-push-up", "push-up", "decline-push-up"],
  },
  {
    id: "chain-vpush",
    ar: "سلّم الدفع العمودي",
    stages: ["pike-push-up", "wall-handstand-push-up"],
  },
  {
    id: "chain-hpull",
    ar: "سلّم السحب الأفقي",
    stages: ["inverted-row"],
    note: "ارفع زاوية القدمين لزيادة الصعوبة، وسجّل الزاوية كملاحظة.",
  },
  {
    id: "chain-vpull",
    ar: "سلّم السحب العمودي",
    stages: ["band-assisted-pull-up", "chin-up", "pull-up", "weighted-pull-up"],
  },
  {
    id: "chain-squat",
    ar: "سلّم القرفصاء",
    stages: ["box-squat", "bodyweight-squat", "jump-squat"],
    weightedAlt: "goblet-squat",
  },
  {
    id: "chain-hinge",
    ar: "سلّم ثني الورك",
    stages: ["glute-bridge", "single-leg-hip-thrust", "nordic-hamstring-curl"],
  },
  {
    id: "chain-lunge",
    ar: "سلّم الاندفاع",
    stages: ["step-up", "lunge", "bulgarian-split-squat"],
  },
  {
    id: "chain-core",
    ar: "سلّم الجذع",
    stages: ["dead-bug", "plank", "side-plank", "leg-raise"],
    note: "بالثواني ثم بالتكرارات.",
  },
];

export const CHAIN_BY_ID = Object.fromEntries(
  CHAINS.map((c) => [c.id, c]),
) as Record<string, Chain>;

/** معرّف السلّم لكل تمرين داخل سلّم */
export const CHAIN_OF: Record<string, string> = Object.fromEntries(
  CHAINS.flatMap((c) => c.stages.map((s) => [s, c.id])),
);

/** موقع التمرين في سلّمه (أو null إن لم يكن في سلّم) */
export function chainPosition(
  exerciseId: string,
): { chain: Chain; index: number } | null {
  const chainId = CHAIN_OF[exerciseId];
  if (!chainId) return null;
  const chain = CHAIN_BY_ID[chainId];
  return { chain, index: chain.stages.indexOf(exerciseId) };
}
