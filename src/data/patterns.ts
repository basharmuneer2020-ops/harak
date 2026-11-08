import type { MuscleId, Pattern, PatternId } from "../types";
import { muscleIdFromAr } from "./muscles";

/** الملحق أ.1 — الأنماط الثمانية كما وردت حرفياً (العضلات بأسمائها العربية) */
export const PATTERNS_SEED = [
  {
    id: "hpush",
    ar: "الدفع الأفقي",
    en: "horizontal push",
    primary: ["الصدر", "الكتف الأمامي", "خلفية الذراع"],
    secondary: ["البطن"],
    essence:
      "تدفع حِملاً بعيداً عن صدرك أفقيّاً، أو تدفع جسمك بعيداً عن الأرض.",
    cue: "اشبك لوحَي الكتف للخلف وثبّت الجذع، واجعل المرفقين يميلان قطريّاً لا منفرجين بزاوية قائمة.",
  },
  {
    id: "vpush",
    ar: "الدفع العمودي",
    en: "vertical push",
    primary: ["الكتف الأمامي", "الكتف الجانبي", "خلفية الذراع"],
    secondary: ["الصدر", "البطن"],
    essence: "تدفع حِملاً فوق رأسك للأعلى، أو ترفع جسمك في خطٍّ شبه عمودي.",
    cue: "اعصر الأرداف والبطن كي لا يتقوّس أسفل الظهر، واجعل البار أو الدمبل يمرّ قرب الوجه لا أمامه.",
  },
  {
    id: "hpull",
    ar: "السحب الأفقي",
    en: "horizontal pull",
    primary: ["أعلى الظهر", "مقدّمة الذراع"],
    secondary: ["الكتف الخلفي", "الجناحية"],
    essence:
      "تسحب حِملاً نحو بطنك أو صدرك أفقيّاً، أو تسحب جسمك نحو بارٍ ثابت.",
    cue: "ابدأ السحب من لوحَي الكتف لا من اليدين، ولا تهزّ الجذع لاكتساب الزخم.",
  },
  {
    id: "vpull",
    ar: "السحب العمودي",
    en: "vertical pull",
    primary: ["الجناحية", "مقدّمة الذراع"],
    secondary: ["أعلى الظهر", "الكتف الخلفي"],
    essence: "تسحب جسمك للأعلى نحو بار، أو تسحب حِملاً من فوق رأسك للأسفل.",
    cue: "ابدأ بإنزال لوحَي الكتف، ثم اسحب المرفقين للأسفل والخلف نحو جانبيك.",
  },
  {
    id: "squat",
    ar: "القرفصاء",
    en: "squat",
    primary: ["مقدّمة الفخذ", "الأرداف"],
    secondary: ["خلفية الفخذ", "البطن", "بطّة الساق"],
    essence:
      "تثني الركبتين والوركين معاً وتنزل بجذعٍ شبه منتصب ثم تقف — حركة الركبة هي الغالبة.",
    cue: "ادفع الركبتين للخارج باتجاه أصابع القدم، وانزل حتى يوازي الفخذ الأرض إن أمكن، والكعبان ثابتان.",
  },
  {
    id: "hinge",
    ar: "ثني الورك",
    en: "hinge",
    primary: ["خلفية الفخذ", "الأرداف", "أسفل الظهر"],
    secondary: ["أعلى الظهر", "القبضة والساعد"],
    essence:
      "تدفع الوركين للخلف بظهرٍ مستقيم ثم تعيدهما للأمام — حركة الورك هي الغالبة والركبة شبه ثابتة.",
    cue: "الانحناء من مفصل الورك لا من الظهر؛ حافظ على استقامة العمود واشعر بشدّ خلفية الفخذ.",
  },
  {
    id: "lunge",
    ar: "الاندفاع لساقٍ واحدة",
    en: "lunge",
    primary: ["مقدّمة الفخذ", "الأرداف"],
    secondary: ["خلفية الفخذ", "بطّة الساق"],
    essence:
      "تحمل جسمك على ساقٍ واحدة غالباً، فتبني القوّة والتوازن وتعالج فروق الجانبين.",
    cue: "أنزل الركبة الخلفية نحو الأرض عموديّاً، واجعل الركبة الأمامية فوق القدم لا متجاوزةً لها كثيراً.",
  },
  {
    id: "core",
    ar: "الجذع والحمل",
    en: "core + carry",
    primary: ["البطن", "الجانبان"],
    secondary: ["أسفل الظهر", "القبضة والساعد"],
    essence:
      "تثبّت جذعك ضدّ الانحناء والدوران، وتحمل ثقلاً وأنت تمشي — أساس نقل القوّة وحماية الظهر.",
    cue: "اشدّ البطن كأنك ستُلكَم وتنفّس دون أن يرتخي الثبات، وفي الحمل أبقِ الكتفين للخلف والظهر مستقيماً.",
  },
] as const;

export const PATTERNS: Pattern[] = PATTERNS_SEED.map((p) => ({
  id: p.id as PatternId,
  ar: p.ar,
  en: p.en,
  primary: p.primary.map(muscleIdFromAr),
  secondary: p.secondary.map(muscleIdFromAr),
  essence: p.essence,
  cue: p.cue,
}));

export const PATTERN_IDS: PatternId[] = PATTERNS.map((p) => p.id);

export const PATTERN_BY_ID = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p]),
) as Record<PatternId, Pattern>;

export const PUSH_PATTERNS: PatternId[] = ["hpush", "vpush"];
export const PULL_PATTERNS: PatternId[] = ["hpull", "vpull"];
export const UPPER_PATTERNS: PatternId[] = ["hpush", "vpush", "hpull", "vpull"];
export const LOWER_PATTERNS: PatternId[] = ["squat", "hinge", "lunge"];

/** الأنماط التي تدرّب عضلةً بعينها: أساسية ومساندة */
export function patternsForMuscle(m: MuscleId): {
  primary: Pattern[];
  secondary: Pattern[];
} {
  return {
    primary: PATTERNS.filter((p) => p.primary.includes(m)),
    secondary: PATTERNS.filter(
      (p) => !p.primary.includes(m) && p.secondary.includes(m),
    ),
  };
}
