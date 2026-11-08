import type { Exercise, Joint, MuscleId } from "../types";
import { CHAIN_OF } from "./chains";
import { EXERCISE_TEXT } from "./exerciseText";
import { PATTERN_BY_ID } from "./patterns";

/** الملحق أ.3 — التمارين الثمانية والخمسون كما وردت حرفياً */
export const EXERCISES_SEED = [
  {
    id: "push-up",
    ar: "تمرين الضغط",
    en: "push-up",
    pattern: "hpush",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "incline-push-up",
    ar: "الضغط المائل (أسهل)",
    en: "incline push-up",
    pattern: "hpush",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "decline-push-up",
    ar: "الضغط المنحدر (أصعب)",
    en: "decline push-up",
    pattern: "hpush",
    equip: "bodyweight",
    diff: 3,
  },
  {
    id: "dumbbell-bench-press",
    ar: "ضغط الدمبل على بنش",
    en: "dumbbell bench press",
    pattern: "hpush",
    equip: "free",
    diff: 2,
  },
  {
    id: "dumbbell-floor-press",
    ar: "ضغط الدمبل على الأرض",
    en: "dumbbell floor press",
    pattern: "hpush",
    equip: "free",
    diff: 1,
  },
  {
    id: "barbell-bench-press",
    ar: "ضغط البار المسطّح",
    en: "barbell bench press",
    pattern: "hpush",
    equip: "free",
    diff: 2,
  },
  {
    id: "chest-press-machine",
    ar: "ماكينة دفع الصدر",
    en: "chest press machine",
    pattern: "hpush",
    equip: "machine",
    diff: 1,
  },
  {
    id: "cable-chest-fly",
    ar: "تجميع الصدر بالكيبل",
    en: "cable chest fly",
    pattern: "hpush",
    equip: "machine",
    diff: 2,
  },
  {
    id: "pike-push-up",
    ar: "ضغط الهابط",
    en: "pike push-up",
    pattern: "vpush",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "wall-handstand-push-up",
    ar: "الضغط على الحائط (متقدّم)",
    en: "wall handstand push-up",
    pattern: "vpush",
    equip: "bodyweight",
    diff: 3,
  },
  {
    id: "dumbbell-overhead-press",
    ar: "ضغط الكتف بالدمبل فوق الرأس",
    en: "dumbbell overhead press",
    pattern: "vpush",
    equip: "free",
    diff: 2,
  },
  {
    id: "barbell-overhead-press",
    ar: "الضغط العسكري بالبار",
    en: "barbell overhead press",
    pattern: "vpush",
    equip: "free",
    diff: 2,
  },
  {
    id: "arnold-press",
    ar: "ضغط أرنولد",
    en: "arnold press",
    pattern: "vpush",
    equip: "free",
    diff: 2,
  },
  {
    id: "shoulder-press-machine",
    ar: "ماكينة ضغط الكتف",
    en: "shoulder press machine",
    pattern: "vpush",
    equip: "machine",
    diff: 1,
  },
  {
    id: "inverted-row",
    ar: "السحب المقلوب تحت بار أو طاولة",
    en: "inverted row",
    pattern: "hpull",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "one-arm-dumbbell-row",
    ar: "تجديف بالدمبل بذراع واحدة",
    en: "one-arm dumbbell row",
    pattern: "hpull",
    equip: "free",
    diff: 1,
  },
  {
    id: "bent-over-barbell-row",
    ar: "تجديف منحنٍ بالبار",
    en: "bent-over barbell row",
    pattern: "hpull",
    equip: "free",
    diff: 2,
  },
  {
    id: "seated-cable-row",
    ar: "تجديف جالس بالكيبل",
    en: "seated cable row",
    pattern: "hpull",
    equip: "machine",
    diff: 1,
  },
  {
    id: "chest-supported-row",
    ar: "تجديف مسنود الصدر",
    en: "chest-supported row",
    pattern: "hpull",
    equip: "machine",
    diff: 1,
  },
  {
    id: "pull-up",
    ar: "العقلة",
    en: "pull-up",
    pattern: "vpull",
    equip: "bodyweight",
    diff: 3,
  },
  {
    id: "chin-up",
    ar: "العقلة بقبضة معكوسة (أسهل)",
    en: "chin-up",
    pattern: "vpull",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "band-assisted-pull-up",
    ar: "عقلة بمساعدة مطّاط",
    en: "band-assisted pull-up",
    pattern: "vpull",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "weighted-pull-up",
    ar: "عقلة مُثقّلة بحزام (متقدّم)",
    en: "weighted pull-up",
    pattern: "vpull",
    equip: "free",
    diff: 3,
  },
  {
    id: "lat-pulldown",
    ar: "السحب الأمامي بالكيبل",
    en: "lat pulldown",
    pattern: "vpull",
    equip: "machine",
    diff: 1,
  },
  {
    id: "assisted-pull-up-machine",
    ar: "ماكينة العقلة المساعِدة",
    en: "assisted pull-up machine",
    pattern: "vpull",
    equip: "machine",
    diff: 1,
  },
  {
    id: "bodyweight-squat",
    ar: "قرفصاء بوزن الجسم",
    en: "bodyweight squat",
    pattern: "squat",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "box-squat",
    ar: "قرفصاء إلى كرسي",
    en: "box squat",
    pattern: "squat",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "jump-squat",
    ar: "قرفصاء قفز (قوّة وتفجير)",
    en: "jump squat",
    pattern: "squat",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "goblet-squat",
    ar: "قرفصاء الكأس بالدمبل",
    en: "goblet squat",
    pattern: "squat",
    equip: "free",
    diff: 1,
  },
  {
    id: "back-squat",
    ar: "القرفصاء الخلفي بالبار",
    en: "back squat",
    pattern: "squat",
    equip: "free",
    diff: 2,
  },
  {
    id: "front-squat",
    ar: "القرفصاء الأمامي بالبار",
    en: "front squat",
    pattern: "squat",
    equip: "free",
    diff: 3,
  },
  {
    id: "leg-press",
    ar: "ضغط الأرجل",
    en: "leg press",
    pattern: "squat",
    equip: "machine",
    diff: 1,
  },
  {
    id: "hack-squat",
    ar: "قرفصاء هاك",
    en: "hack squat",
    pattern: "squat",
    equip: "machine",
    diff: 2,
  },
  {
    id: "leg-extension",
    ar: "تمديد الركبة (عزل)",
    en: "leg extension",
    pattern: "squat",
    equip: "machine",
    diff: 1,
  },
  {
    id: "glute-bridge",
    ar: "جسر الأرداف",
    en: "glute bridge",
    pattern: "hinge",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "single-leg-hip-thrust",
    ar: "رفعة الورك بساق واحدة",
    en: "single-leg hip thrust",
    pattern: "hinge",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "nordic-hamstring-curl",
    ar: "انثناء نوردي (متقدّم)",
    en: "nordic hamstring curl",
    pattern: "hinge",
    equip: "bodyweight",
    diff: 3,
  },
  {
    id: "deadlift",
    ar: "الرفعة الميتة",
    en: "deadlift",
    pattern: "hinge",
    equip: "free",
    diff: 2,
  },
  {
    id: "romanian-deadlift",
    ar: "الرفعة الرومانية",
    en: "romanian deadlift",
    pattern: "hinge",
    equip: "free",
    diff: 2,
  },
  {
    id: "kettlebell-swing",
    ar: "أرجحة الكِتل",
    en: "kettlebell swing",
    pattern: "hinge",
    equip: "free",
    diff: 2,
  },
  {
    id: "leg-curl",
    ar: "انثناء خلفية الفخذ",
    en: "leg curl",
    pattern: "hinge",
    equip: "machine",
    diff: 1,
  },
  {
    id: "back-extension",
    ar: "تمديد الظهر",
    en: "back extension",
    pattern: "hinge",
    equip: "machine",
    diff: 1,
  },
  {
    id: "lunge",
    ar: "الطعنة",
    en: "lunge",
    pattern: "lunge",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "bulgarian-split-squat",
    ar: "القرفصاء البلغارية",
    en: "bulgarian split squat",
    pattern: "lunge",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "step-up",
    ar: "الصعود على صندوق",
    en: "step-up",
    pattern: "lunge",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "dumbbell-lunge",
    ar: "طعنة بالدمبل",
    en: "dumbbell lunge",
    pattern: "lunge",
    equip: "free",
    diff: 2,
  },
  {
    id: "dumbbell-bulgarian-split-squat",
    ar: "بلغارية بالدمبل",
    en: "dumbbell bulgarian split squat",
    pattern: "lunge",
    equip: "free",
    diff: 2,
  },
  {
    id: "weighted-step-up",
    ar: "صعود مُثقّل",
    en: "weighted step-up",
    pattern: "lunge",
    equip: "free",
    diff: 2,
  },
  {
    id: "smith-machine-lunge",
    ar: "طعنة على سميث",
    en: "smith machine lunge",
    pattern: "lunge",
    equip: "machine",
    diff: 2,
  },
  {
    id: "plank",
    ar: "البلانك",
    en: "plank",
    pattern: "core",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "side-plank",
    ar: "البلانك الجانبي",
    en: "side plank",
    pattern: "core",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "leg-raise",
    ar: "رفع الساقين",
    en: "leg raise",
    pattern: "core",
    equip: "bodyweight",
    diff: 2,
  },
  {
    id: "dead-bug",
    ar: "الحشرة الميتة",
    en: "dead bug",
    pattern: "core",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "farmer-s-carry",
    ar: "مشية المزارع",
    en: "farmer's carry",
    pattern: "core",
    equip: "free",
    diff: 1,
  },
  {
    id: "suitcase-carry",
    ar: "الحمل بجانب واحد",
    en: "suitcase carry",
    pattern: "core",
    equip: "free",
    diff: 1,
  },
  {
    id: "russian-twist",
    ar: "اللفّة الروسية المُثقّلة",
    en: "russian twist",
    pattern: "core",
    equip: "free",
    diff: 2,
  },
  {
    id: "cable-woodchopper",
    ar: "قطع الحطب بالكيبل",
    en: "cable woodchopper",
    pattern: "core",
    equip: "machine",
    diff: 2,
  },
  {
    id: "ab-crunch-machine",
    ar: "ماكينة البطن",
    en: "ab crunch machine",
    pattern: "core",
    equip: "machine",
    diff: 1,
  },
] as const;

/**
 * قسم 5 — تمارين مضافة تسدّ ثغرات العضلات الثانوية (بطّة الساق، القبضة، الكتف الخلفي)،
 * ورفرفتان جانبيتان للكتف الجانبي (العضلة الرئيسية الوحيدة التي لا يدرّبها إلا نمطٌ واحد).
 */
export const EXTRA_EXERCISES_SEED = [
  {
    id: "standing-calf-raise",
    ar: "رفع السمانة واقفاً",
    en: "standing calf raise",
    pattern: "squat",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "seated-calf-raise",
    ar: "رفع السمانة جالساً",
    en: "seated calf raise",
    pattern: "squat",
    equip: "machine",
    diff: 1,
  },
  {
    id: "dead-hang",
    ar: "التعلّق الثابت على البار",
    en: "dead hang",
    pattern: "vpull",
    equip: "bodyweight",
    diff: 1,
  },
  {
    id: "face-pull",
    ar: "سحب الحبل نحو الوجه",
    en: "face pull",
    pattern: "hpull",
    equip: "machine",
    diff: 1,
  },
  {
    id: "dumbbell-lateral-raise",
    ar: "الرفرفة الجانبية بالدمبل",
    en: "dumbbell lateral raise",
    pattern: "vpush",
    equip: "free",
    diff: 1,
  },
  {
    id: "cable-lateral-raise",
    ar: "الرفرفة الجانبية بالكيبل",
    en: "cable lateral raise",
    pattern: "vpush",
    equip: "machine",
    diff: 2,
  },
] as const;

interface Traits {
  joints?: Joint[];
  isolation?: boolean;
  timed?: boolean;
  primary?: MuscleId[];
  secondary?: MuscleId[];
}

/**
 * خصائص كل تمرين: المفاصل المُجهَدة، العزل، التوقيت، وتجاوز عضلات النمط حيث يختلف
 * التمرين فعلاً عن نمطه (مثلاً: الضغط على بنش لا يُجهد البطن لأن الجذع مسنود).
 */
const TRAITS: Record<string, Traits> = {
  // الدفع الأفقي — الدفع بوزن الجسم على الكفّين يُجهد المعصم
  "push-up": { joints: ["wrist"] },
  "incline-push-up": { joints: ["wrist"] },
  "decline-push-up": { joints: ["wrist", "shoulder"] },
  "dumbbell-bench-press": { secondary: [] },
  "dumbbell-floor-press": { secondary: [] },
  "barbell-bench-press": { joints: ["shoulder"], secondary: [] },
  "chest-press-machine": { secondary: [] },
  "cable-chest-fly": {
    isolation: true,
    joints: ["shoulder"],
    primary: ["chest"],
    secondary: ["front delt"],
  },
  // الدفع العمودي — كله يُجهد الكتف
  "pike-push-up": { joints: ["shoulder", "wrist"] },
  "wall-handstand-push-up": { joints: ["shoulder", "wrist"] },
  "dumbbell-overhead-press": { joints: ["shoulder"] },
  "barbell-overhead-press": { joints: ["shoulder", "lower_back"] },
  "arnold-press": { joints: ["shoulder"] },
  "shoulder-press-machine": { joints: ["shoulder"], secondary: ["chest"] },
  "dumbbell-lateral-raise": {
    isolation: true,
    joints: ["shoulder"],
    primary: ["side delt"],
    secondary: [],
  },
  "cable-lateral-raise": {
    isolation: true,
    joints: ["shoulder"],
    primary: ["side delt"],
    secondary: [],
  },
  // السحب الأفقي
  // التجديف والسحب بمقبضٍ تحت حِمل يدرّب القبضة مساندةً
  "inverted-row": { secondary: ["rear delt", "lats", "grip"] },
  "one-arm-dumbbell-row": { secondary: ["rear delt", "lats", "grip"] },
  "bent-over-barbell-row": {
    joints: ["lower_back"],
    secondary: ["rear delt", "lats", "lower back", "grip"],
  },
  "seated-cable-row": { secondary: ["rear delt", "lats", "grip"] },
  "chest-supported-row": { secondary: ["rear delt", "lats", "grip"] },
  "face-pull": {
    isolation: true,
    primary: ["rear delt"],
    secondary: ["upper back"],
  },
  // السحب العمودي — التعلّق بالبار يدرّب القبضة مساندةً
  "pull-up": {
    joints: ["shoulder"],
    secondary: ["upper back", "rear delt", "grip"],
  },
  "chin-up": {
    joints: ["elbow"],
    secondary: ["upper back", "rear delt", "grip"],
  },
  "band-assisted-pull-up": {
    secondary: ["upper back", "rear delt", "grip"],
  },
  "weighted-pull-up": {
    joints: ["shoulder", "elbow"],
    secondary: ["upper back", "rear delt", "grip"],
  },
  "lat-pulldown": { secondary: ["upper back", "rear delt", "grip"] },
  "assisted-pull-up-machine": {
    secondary: ["upper back", "rear delt", "grip"],
  },
  "dead-hang": {
    isolation: true,
    timed: true,
    joints: ["shoulder"],
    primary: ["grip"],
    secondary: [],
  },
  // القرفصاء
  "jump-squat": { joints: ["knee"] },
  "back-squat": {
    joints: ["lower_back"],
    secondary: ["hamstrings", "abs", "calves", "lower back"],
  },
  "front-squat": {
    joints: ["knee", "wrist"],
    secondary: ["hamstrings", "abs", "calves", "lower back"],
  },
  "leg-press": { secondary: ["hamstrings"] },
  "hack-squat": { joints: ["knee"], secondary: ["hamstrings"] },
  "leg-extension": {
    isolation: true,
    joints: ["knee"],
    primary: ["quads"],
    secondary: [],
  },
  "standing-calf-raise": {
    isolation: true,
    primary: ["calves"],
    secondary: [],
  },
  "seated-calf-raise": { isolation: true, primary: ["calves"], secondary: [] },
  // ثني الورك
  "glute-bridge": {
    primary: ["glutes", "hamstrings"],
    secondary: ["lower back"],
  },
  "single-leg-hip-thrust": {
    primary: ["glutes", "hamstrings"],
    secondary: ["lower back"],
  },
  "nordic-hamstring-curl": {
    joints: ["knee"],
    primary: ["hamstrings"],
    secondary: ["glutes"],
  },
  deadlift: {
    joints: ["lower_back"],
    secondary: ["upper back", "grip", "quads"],
  },
  "romanian-deadlift": { joints: ["lower_back"] },
  "kettlebell-swing": { joints: ["lower_back"] },
  "leg-curl": {
    isolation: true,
    primary: ["hamstrings"],
    secondary: ["calves"],
  },
  "back-extension": { isolation: true, joints: ["lower_back"], secondary: [] },
  // الاندفاع — الاندفاع العميق يُجهد الركبة؛ الصعود المضبوط أرفق بها
  lunge: { joints: ["knee"] },
  "bulgarian-split-squat": { joints: ["knee"] },
  "dumbbell-lunge": { joints: ["knee"] },
  "dumbbell-bulgarian-split-squat": { joints: ["knee"] },
  "smith-machine-lunge": { joints: ["knee"] },
  // الجذع والحمل
  plank: {
    isolation: true,
    timed: true,
    primary: ["abs"],
    secondary: ["obliques"],
  },
  "side-plank": {
    isolation: true,
    timed: true,
    primary: ["obliques"],
    secondary: ["abs"],
  },
  "leg-raise": {
    isolation: true,
    joints: ["lower_back"],
    primary: ["abs"],
    secondary: ["obliques"],
  },
  "dead-bug": { isolation: true, primary: ["abs"], secondary: ["obliques"] },
  "farmer-s-carry": {
    timed: true,
    primary: ["grip", "obliques"],
    secondary: ["abs", "upper back"],
  },
  "suitcase-carry": {
    timed: true,
    primary: ["obliques"],
    secondary: ["abs", "grip"],
  },
  "russian-twist": {
    isolation: true,
    joints: ["lower_back"],
    primary: ["abs", "obliques"],
    secondary: [],
  },
  "cable-woodchopper": {
    isolation: true,
    primary: ["obliques"],
    secondary: ["abs"],
  },
  "ab-crunch-machine": {
    isolation: true,
    primary: ["abs"],
    secondary: ["obliques"],
  },
};

function build(seed: {
  id: string;
  ar: string;
  en: string;
  pattern: string;
  equip: string;
  diff: number;
}): Exercise {
  const t = TRAITS[seed.id] ?? {};
  const text = EXERCISE_TEXT[seed.id];
  if (!text) throw new Error(`لا توجد إرشادات للتمرين ${seed.id}`);
  const ex: Exercise = {
    id: seed.id,
    ar: seed.ar,
    en: seed.en,
    pattern: seed.pattern as Exercise["pattern"],
    equip: seed.equip as Exercise["equip"],
    diff: seed.diff as Exercise["diff"],
    cues: [...text.cues],
    mistakes: [...text.mistakes],
    joints: t.joints ?? [],
  };
  if (t.primary) ex.primary = t.primary;
  if (t.secondary) ex.secondary = t.secondary;
  if (t.isolation) ex.isolation = true;
  if (t.timed) ex.timed = true;
  const chain = CHAIN_OF[seed.id];
  if (chain) ex.progressionChain = chain;
  return ex;
}

/** مكتبة التمارين الأساسية (64 = 58 من الملحق + 6 مضافة) */
export const EXERCISES: Exercise[] = [
  ...EXERCISES_SEED,
  ...EXTRA_EXERCISES_SEED,
].map(build);

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

/** عضلات التمرين الفعلية: تجاوزه إن وُجد، وإلا عضلات نمطه */
export function musclesOf(ex: Exercise): {
  primary: MuscleId[];
  secondary: MuscleId[];
} {
  const p = PATTERN_BY_ID[ex.pattern];
  const primary = ex.primary ?? p.primary;
  const secondary = (ex.secondary ?? p.secondary).filter(
    (m) => !primary.includes(m),
  );
  return { primary, secondary };
}
