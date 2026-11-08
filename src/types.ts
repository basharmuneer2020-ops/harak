/**
 * نموذج البيانات — مطابق لقسم 4.3 من التكليف مع تدقيقٍ إضافي في الأنواع
 * (معرّفات العضلات محدّدة بدل string، وحقول اختيارية موثّقة).
 */

export type Equip = "bodyweight" | "free" | "machine";
export type PatternId =
  "hpush" | "vpush" | "hpull" | "vpull" | "squat" | "hinge" | "lunge" | "core";
export type Goal = "strength" | "hypertrophy" | "general" | "endurance";
export type Level = 1 | 2 | 3;
export type Joint =
  "shoulder" | "knee" | "lower_back" | "wrist" | "elbow" | "hip";
export type Region = "upper" | "core" | "lower";

/** المعرّف الداخلي للعضلة هو اسمها الإنجليزي (الملحق أ.2) */
export type MuscleId =
  | "chest"
  | "front delt"
  | "side delt"
  | "rear delt"
  | "triceps"
  | "biceps"
  | "lats"
  | "upper back"
  | "grip"
  | "abs"
  | "obliques"
  | "lower back"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export interface Muscle {
  id: MuscleId;
  ar: string;
  en: string;
  region: Region;
}

export interface Pattern {
  id: PatternId;
  ar: string;
  en: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  essence: string;
  cue: string;
}

export interface Exercise {
  id: string;
  ar: string;
  en: string;
  pattern: PatternId;
  equip: Equip;
  diff: Level;
  /** تجاوز اختياري لعضلات النمط */
  primary?: MuscleId[];
  secondary?: MuscleId[];
  cues: string[];
  mistakes: string[];
  joints: Joint[];
  /** عزل: راحة أقصر، ولا يُختار لخانةٍ رئيسية إن وُجد مركّب */
  isolation?: boolean;
  /** يُوصف بالثواني (ثبات أو حمل) بدل التكرارات */
  timed?: boolean;
  /** معرّف سلّم التدرّج (وزن الجسم) */
  progressionChain?: string;
  custom?: boolean;
}

export type DaysPerWeek = 2 | 3 | 4 | 5 | 6;
export type SessionMinutes = 30 | 45 | 60 | 75;
export type PlateKg = 1.25 | 2.5 | 5;

export interface Profile {
  level: Level;
  goal: Goal;
  daysPerWeek: DaysPerWeek;
  sessionMinutes: SessionMinutes;
  equipment: Equip[];
  sensitiveJoints: Joint[];
  minPlateKg: PlateKg;
  units: "kg" | "lb";
  createdAt: number;
}

export interface SetPrescription {
  /** مجال التكرارات (أو الثواني للتمارين الموقوتة) */
  reps: [number, number];
  rir: number;
  restSec: number;
}

export interface Slot {
  pattern: PatternId;
  exerciseId: string;
  sets: number;
  prescription: SetPrescription;
  /** خانة مكمّلة أضافها المولّد لسدّ نقص حجمٍ أو تكرار */
  accessory?: boolean;
}

export interface SessionTemplate {
  id: string;
  name: string;
  slots: Slot[];
}

export type Split = "full" | "ul" | "ppl";

export type PlanIssueKind =
  | "volume-low"
  | "volume-high"
  | "frequency"
  | "minor-low"
  | "ratio"
  | "no-exercise"
  | "squat-hinge"
  | "duration";

export interface PlanIssue {
  kind: PlanIssueKind;
  muscle?: MuscleId;
  pattern?: PatternId;
  value?: number;
  templateId?: string;
}

export interface Mesocycle {
  id: string;
  createdAt: number;
  split: Split;
  weeks: 4;
  deloadWeek: true;
  templates: SessionTemplate[];
  /** مثل [3,2,2,1] */
  rirByWeek: number[];
  /** مجموعات أسبوعية محسوبة لكل عضلة */
  volumeByMuscle: Record<string, number>;
  warnings: string[];
  // —— إضافات ——
  /** عدد مرّات تدريب كل عضلة أسبوعياً (عمل مباشر) */
  frequencyByMuscle?: Record<string, number>;
  issues?: PlanIssue[];
  daysPerWeek?: DaysPerWeek;
  goal?: Goal;
  level?: Level;
  sessionMinutes?: SessionMinutes;
  status?: "active" | "completed";
  /** فهرس الجلسة التي بدأ عندها التفريغ المبكر (إن قُبِل) */
  earlyDeloadAt?: number;
  completedAt?: number;
}

export interface SetLog {
  /** تكرارات، أو ثوانٍ في التمارين الموقوتة */
  reps: number;
  weightKg: number;
  rir: number;
  ts: number;
}

export interface ExerciseTarget {
  sets: number;
  reps: [number, number];
  rir: number;
  restSec: number;
  weightKg?: number;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  swappedFrom?: string;
  painFlag?: boolean;
  // —— إضافات ——
  /** الوصف المستهدف وقت الجلسة (يحتاجه محرّك التقدّم) */
  target?: ExerciseTarget;
  slotIndex?: number;
}

export type ReadinessChoice = "normal" | "plus" | "light";

export interface ProgressionDecision {
  exerciseId: string;
  kind:
    "increase" | "decrease" | "hold" | "reps" | "advance" | "regress" | "none";
  fromKg?: number;
  toKg?: number;
  toExerciseId?: string;
  reason?: string;
}

export interface SessionLog {
  id: string;
  mesocycleId?: string;
  templateId?: string;
  week?: number;
  startedAt: number;
  endedAt?: number;
  readiness?: { sleep: number; soreness: number; energy: number };
  exercises: ExerciseLog[];
  notes?: string;
  volumeKg: number;
  // —— إضافات ——
  /** ترتيب الجلسة داخل الدورة (0..) */
  index?: number;
  deload?: boolean;
  readinessChoice?: ReadinessChoice;
  warmupDone?: boolean;
  decisions?: ProgressionDecision[];
  prs?: string[];
}

/** ما يقرّره محرّك التقدّم */
export interface ExerciseState {
  exerciseId: string;
  nextWeightKg?: number;
  chainStage?: number;
  consecutiveFails: number;
  bestE1RM?: number;
  updatedAt: number;
  // —— إضافات ——
  /** هدف التكرارات القادم لتمارين وزن الجسم (حتى high+3) */
  nextReps?: number;
  bestReps?: number;
  lastDecision?: ProgressionDecision["kind"];
}

export interface CardioLog {
  id: string;
  ts: number;
  type: string;
  minutes: number;
  intensity: "moderate" | "vigorous";
  note?: string;
}

export interface Meta {
  disclaimerAcceptedAt?: number;
  lastExportAt?: number;
  sessionsAtLastExport?: number;
  backupSnoozedAt?: number;
}

export interface ExportFile {
  schemaVersion: 1;
  exportedAt: number;
  profile: Profile;
  mesocycles: Mesocycle[];
  sessions: SessionLog[];
  states: ExerciseState[];
  cardio: CardioLog[];
  customExercises: Exercise[];
  meta?: Meta;
}
