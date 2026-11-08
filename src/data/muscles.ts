import type { Muscle, MuscleId, Region } from "../types";

/** الملحق أ.2 — العضلات الست عشرة كما وردت حرفياً */
export const MUSCLES_SEED = [
  { ar: "الصدر", en: "chest", region: "upper" },
  { ar: "الكتف الأمامي", en: "front delt", region: "upper" },
  { ar: "الكتف الجانبي", en: "side delt", region: "upper" },
  { ar: "الكتف الخلفي", en: "rear delt", region: "upper" },
  { ar: "خلفية الذراع", en: "triceps", region: "upper" },
  { ar: "مقدّمة الذراع", en: "biceps", region: "upper" },
  { ar: "الجناحية", en: "lats", region: "upper" },
  { ar: "أعلى الظهر", en: "upper back", region: "upper" },
  { ar: "القبضة والساعد", en: "grip", region: "upper" },
  { ar: "البطن", en: "abs", region: "core" },
  { ar: "الجانبان", en: "obliques", region: "core" },
  { ar: "أسفل الظهر", en: "lower back", region: "core" },
  { ar: "مقدّمة الفخذ", en: "quads", region: "lower" },
  { ar: "خلفية الفخذ", en: "hamstrings", region: "lower" },
  { ar: "الأرداف", en: "glutes", region: "lower" },
  { ar: "بطّة الساق", en: "calves", region: "lower" },
] as const;

export const MUSCLES: Muscle[] = MUSCLES_SEED.map((m) => ({
  id: m.en as MuscleId,
  ar: m.ar,
  en: m.en,
  region: m.region as Region,
}));

export const MUSCLE_IDS: MuscleId[] = MUSCLES.map((m) => m.id);

/** العضلات الثانوية: ليست أساسيةً في أي نمط، وهدفها ≥ 4 مجموعات مكافئة أسبوعياً */
export const MINOR_MUSCLES: MuscleId[] = ["rear delt", "grip", "calves"];

/** العضلات الرئيسية الـ13: يُلزَم لها [10, 20] مجموعة أسبوعياً وتكرار ≥ 2 */
export const MAJOR_MUSCLES: MuscleId[] = MUSCLE_IDS.filter(
  (id) => !MINOR_MUSCLES.includes(id),
);

export const MUSCLE_BY_ID = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m]),
) as Record<MuscleId, Muscle>;

const ID_BY_AR = Object.fromEntries(MUSCLES.map((m) => [m.ar, m.id])) as Record<
  string,
  MuscleId
>;

/** يحوّل اسم العضلة العربي (كما في بيانات الأنماط) إلى معرّفها */
export function muscleIdFromAr(ar: string): MuscleId {
  const id = ID_BY_AR[ar];
  if (!id) throw new Error(`عضلة غير معروفة: ${ar}`);
  return id;
}

export const REGIONS: { id: Region; ar: string }[] = [
  { id: "upper", ar: "الجزء العلوي" },
  { id: "core", ar: "الجذع" },
  { id: "lower", ar: "الجزء السفلي" },
];

/** وصفٌ قصير لبعض العضلات (من النموذج) */
export const MUSCLE_DESC: Partial<Record<MuscleId, string>> = {
  lats: "العضلة العريضة في جانب الظهر",
  "upper back": "شبه المنحرف والمعيّنات",
  grip: "قوّة الإمساك والساعد",
};

/** ملاحظات العضلات الثانوية — تُبنى بالمساندة وبتمارين العزل المكمّلة */
export const MUSCLE_NOTE: Partial<Record<MuscleId, string>> = {
  calves:
    "تُنشَّط ثانويّاً في القرفصاء والاندفاع. لتطويرها مباشرةً أضِف رفع السمانة واقفاً أو جالساً.",
  grip: "تُبنى تلقائيّاً من السحب والحمل. لتقويةٍ إضافية جرّب التعلّق الثابت على البار.",
  "rear delt":
    "تعمل مساندةً في كل سحب. لعملٍ مباشر أضِف سحب الحبل نحو الوجه بالكيبل.",
};
