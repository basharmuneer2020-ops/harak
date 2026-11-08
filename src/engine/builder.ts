/**
 * مولّد الدورة المتوسطة (F3) — القلب.
 *
 * 1) يختار التقسيم من أيام التدريب، ويبني قوالب الجلسات بخانات الأنماط.
 * 2) يملأ كل خانة بتمرينٍ من أدوات المستخدم، صعوبته ≤ مستواه (الأقرب أولاً)،
 *    ولا يمسّ مفاصله الحسّاسة، مع تنويعٍ بين الجلسات.
 * 3) يضبط المجموعات ببحثٍ محلّي (hill-climbing) يقلّل دالة عقوبات تمثّل قواعد
 *    القسم 2: الحجم [10، 20] لكل عضلةٍ رئيسية، التكرار ≥ 2، العضلات الثانوية ≥ 4،
 *    نسبة الدفع/السحب 0.8–1.25، مدّة الجلسة (3 دقائق للمجموعة)، وسقف 8 مجموعات
 *    مباشرة للعضلة في الجلسة — ويضيف خاناتٍ مكمّلة عند الحاجة.
 * 4) يتحقّق ويُخرج تحذيراتٍ صريحة لما تعذّر تحقيقه.
 *
 * دوالّ صِرفة: لا React ولا تخزين.
 */
import { musclesOf } from "../data/exercises";
import {
  MAJOR_MUSCLES,
  MINOR_MUSCLES,
  MUSCLE_BY_ID,
  MUSCLE_IDS,
} from "../data/muscles";
import { PATTERN_BY_ID, PULL_PATTERNS, PUSH_PATTERNS } from "../data/patterns";
import { ar } from "../i18n/ar";
import type {
  DaysPerWeek,
  Exercise,
  Mesocycle,
  MuscleId,
  PatternId,
  PlanIssue,
  Profile,
  SessionTemplate,
  Slot,
  Split,
} from "../types";
import { basePrescription, defaultSets, rirByWeek } from "./prescription";
import {
  directSets,
  round1,
  weeklyFrequency,
  weeklyVolume,
  type MuscleMap,
} from "./volume";

export const VOLUME_MIN = 10;
export const VOLUME_MAX = 20;
export const MINOR_MIN = 4;
export const FREQ_MIN = 2;
export const SESSION_DIRECT_CAP = 8;
export const MINUTES_PER_SET = 3;
export const RATIO_MIN = 0.8;
export const RATIO_MAX = 1.25;

const MAX_ACCESSORIES = 2;
const MAX_SETS_MAIN = 6;
const MAX_SETS_ACC = 4;
const MIN_SETS = 1;
const ACC_START_SETS = 2;
const MAX_ITERATIONS = 400;
const MAX_KICKS = 12;
const KICK_ITERATIONS = 60;

/** أوزان دالة العقوبات: القيود العلمية أثقل بكثير من التفضيلات */
const W = {
  vol: 10,
  freq: 10,
  minor: 6,
  ratio: 10,
  hard: 100,
  diff: 1,
  isoMain: 2,
  acc: 1.5,
  setDev: 0.3,
  dup: 3,
  accCompound: 1,
  accDup: 2,
};

// ───────────────────────── التقسيم والقوالب ─────────────────────────

export function chooseSplit(days: number): Split {
  if (days <= 3) return "full";
  if (days === 4) return "ul";
  return "ppl";
}

export interface Skeleton {
  key: string;
  name: string;
  patterns: PatternId[];
}

const FULL_A: PatternId[] = [
  "squat",
  "hinge",
  "hpush",
  "hpull",
  "vpush",
  "core",
];
const FULL_B: PatternId[] = [
  "lunge",
  "hinge",
  "hpush",
  "hpull",
  "vpull",
  "core",
];
const UPPER: PatternId[] = ["hpush", "vpush", "hpull", "vpull", "core"];
const LOWER: PatternId[] = ["squat", "hinge", "lunge", "core"];
const PUSH: PatternId[] = ["hpush", "vpush", "core"];
const PULL: PatternId[] = ["hpull", "vpull", "core"];
const LEGS: PatternId[] = ["squat", "hinge", "lunge", "core"];

/** قوالب الجلسات لكل تقسيم (F3.2) */
export function splitSkeletons(split: Split, days: number): Skeleton[] {
  const t = ar.split;
  switch (split) {
    case "full":
      return [
        { key: "A", name: t.fullA, patterns: FULL_A },
        { key: "B", name: t.fullB, patterns: FULL_B },
      ];
    case "ul":
      return [
        { key: "UA", name: t.upperA, patterns: UPPER },
        { key: "LA", name: t.lowerA, patterns: LOWER },
        { key: "UB", name: t.upperB, patterns: UPPER },
        { key: "LB", name: t.lowerB, patterns: LOWER },
      ];
    case "ppl":
      if (days === 6) {
        return [
          { key: "PA", name: t.pushA, patterns: PUSH },
          { key: "QA", name: t.pullA, patterns: PULL },
          { key: "GA", name: t.legsA, patterns: LEGS },
          { key: "PB", name: t.pushB, patterns: PUSH },
          { key: "QB", name: t.pullB, patterns: PULL },
          { key: "GB", name: t.legsB, patterns: LEGS },
        ];
      }
      if (days === 5) {
        // خمسة أيام: دفع/سحب/أرجل + علوي/سفلي حتى تُدرَّب كل عضلة مرّتين (قرار D-14)
        return [
          { key: "P", name: t.push, patterns: PUSH },
          { key: "Q", name: t.pull, patterns: PULL },
          { key: "G", name: t.legs, patterns: LEGS },
          { key: "U", name: t.upper, patterns: UPPER },
          { key: "L", name: t.lower, patterns: LOWER },
        ];
      }
      return [
        { key: "P", name: t.push, patterns: PUSH },
        { key: "Q", name: t.pull, patterns: PULL },
        { key: "G", name: t.legs, patterns: LEGS },
      ];
  }
}

/** كم مرّة يتكرّر كل قالب أسبوعياً (قد يكون كسرياً عند التناوب) */
export function perWeekOf(days: number, templateCount: number): number {
  return templateCount > 0 ? days / templateCount : 0;
}

export function sessionSetCap(minutes: number): number {
  return Math.floor(minutes / MINUTES_PER_SET);
}

// ───────────────────────── اختيار التمارين ─────────────────────────

/** التمرين متاحٌ للمستخدم: أداته متوفّرة، صعوبته ≤ مستواه، ولا يمسّ مفصلاً حسّاساً */
export function isAllowed(ex: Exercise, profile: Profile): boolean {
  return (
    profile.equipment.includes(ex.equip) &&
    ex.diff <= profile.level &&
    !ex.joints.some((j) => profile.sensitiveJoints.includes(j))
  );
}

/** مرشّحو الخانة الرئيسية: من النمط نفسه ويدرّبون عضلةً أساسية من عضلاته */
export function mainCandidates(
  pattern: PatternId,
  profile: Profile,
  exercises: Exercise[],
): Exercise[] {
  const pp = PATTERN_BY_ID[pattern].primary;
  const all = exercises.filter(
    (e) =>
      e.pattern === pattern &&
      isAllowed(e, profile) &&
      musclesOf(e).primary.some((m) => pp.includes(m)),
  );
  if (pattern === "core") return all;
  const compounds = all.filter((e) => !e.isolation);
  return compounds.length ? compounds : all;
}

/** بدائل تمرينٍ من النمط نفسه (زرّ «بدّل»)؛ مع الألم تُقدَّم أداةٌ أخرى أو درجةٌ أسهل */
export function alternativesFor(
  current: Exercise,
  profile: Profile,
  exercises: Exercise[],
  opts: { pain?: boolean } = {},
): Exercise[] {
  const pp = PATTERN_BY_ID[current.pattern].primary;
  const curPrimary = musclesOf(current).primary;
  const targetsSame = (e: Exercise) => {
    const p = musclesOf(e).primary;
    // خانة رئيسية → تمرينٌ يدرّب عضلات النمط؛ خانة مكمّلة → يدرّب العضلة نفسها
    return curPrimary.some((m) => pp.includes(m))
      ? p.some((m) => pp.includes(m))
      : p.some((m) => curPrimary.includes(m));
  };
  const list = exercises.filter(
    (e) =>
      e.id !== current.id &&
      e.pattern === current.pattern &&
      isAllowed(e, profile) &&
      targetsSame(e),
  );
  const score = (e: Exercise) => {
    let sc = Math.abs(profile.level - e.diff);
    if (!!e.isolation !== !!current.isolation) sc += 2;
    if (opts.pain) {
      const easier = e.diff < current.diff;
      const otherEquip = e.equip !== current.equip;
      const sharesJoint = e.joints.some((j) => current.joints.includes(j));
      sc += (easier || otherEquip ? 0 : 3) + (sharesJoint ? 2 : 0);
    }
    return sc;
  };
  return list.sort((a, b) => score(a) - score(b) || a.diff - b.diff);
}

// ───────────────────────── المحسِّن ─────────────────────────

const NM = MUSCLE_IDS.length;
const MI = Object.fromEntries(MUSCLE_IDS.map((m, i) => [m, i])) as Record<
  MuscleId,
  number
>;
const MAJOR_IDX = MAJOR_MUSCLES.map((m) => MI[m]);
const MINOR_IDX = MINOR_MUSCLES.map((m) => MI[m]);

interface Info {
  coef: Float64Array;
  prim: Uint8Array;
  primIds: MuscleId[];
  push: boolean;
  pull: boolean;
}

const infoCache = new WeakMap<Exercise, Info>();
function infoOf(ex: Exercise): Info {
  let inf = infoCache.get(ex);
  if (inf) return inf;
  const { primary, secondary } = musclesOf(ex);
  const coef = new Float64Array(NM);
  const prim = new Uint8Array(NM);
  for (const m of secondary) coef[MI[m]] = 0.5;
  for (const m of primary) {
    coef[MI[m]] = 1;
    prim[MI[m]] = 1;
  }
  inf = {
    coef,
    prim,
    primIds: primary,
    push: PUSH_PATTERNS.includes(ex.pattern),
    // التعلّق الثابت تمرين قبضة لا يُحسب في توازن السحب
    pull: PULL_PATTERNS.includes(ex.pattern) && !ex.timed,
  };
  infoCache.set(ex, inf);
  return inf;
}

interface OSlot {
  pattern: PatternId;
  ex: Exercise;
  sets: number;
  accessory: boolean;
}

interface OTemplate {
  key: string;
  name: string;
  slots: OSlot[];
}

interface Ctx {
  profile: Profile;
  perWeek: number;
  cap: number;
  mainCand: Record<string, Exercise[]>;
  accPool: Exercise[];
  hasCompound: Record<string, boolean>;
  /** خاناتٌ مقفلة على تمرينها أثناء «الركلة» */
  locked: Set<OSlot>;
  // مخازن مؤقتة لتسريع التقييم
  vol: Float64Array;
  freq: Float64Array;
  direct: Float64Array;
}

function maxSets(s: OSlot): number {
  return s.accessory ? MAX_SETS_ACC : MAX_SETS_MAIN;
}

function prefSets(s: OSlot, ctx: Ctx): number {
  return s.accessory ? ACC_START_SETS : defaultSets(s.ex, ctx.profile.goal);
}

/** تجميع الإحصاءات الأسبوعية في المخازن المؤقتة، ويُرجع عقوبات الجلسات */
function accumulate(
  T: OTemplate[],
  ctx: Ctx,
): {
  sessionPen: number;
  push: number;
  pull: number;
} {
  const { vol, freq, direct, perWeek, cap } = ctx;
  vol.fill(0);
  freq.fill(0);
  let push = 0;
  let pull = 0;
  let sessionPen = 0;
  for (const t of T) {
    direct.fill(0);
    let sets = 0;
    for (const s of t.slots) {
      const inf = infoOf(s.ex);
      sets += s.sets;
      const k = perWeek * s.sets;
      for (let m = 0; m < NM; m++) {
        const c = inf.coef[m];
        if (c) vol[m] += k * c;
        if (inf.prim[m]) direct[m] += s.sets;
      }
      if (inf.push) push += k;
      if (inf.pull) pull += k;
    }
    for (let m = 0; m < NM; m++) {
      if (direct[m] > 0) freq[m] += perWeek;
      if (direct[m] > SESSION_DIRECT_CAP)
        sessionPen += (direct[m] - SESSION_DIRECT_CAP) * W.hard;
    }
    if (sets > cap) sessionPen += (sets - cap) * W.hard;
  }
  return { sessionPen, push, pull };
}

function ratioPenalty(push: number, pull: number): number {
  if (push === 0 && pull === 0) return 0;
  if (push > RATIO_MAX * pull) return (push - RATIO_MAX * pull) * W.ratio;
  if (push < RATIO_MIN * pull) return (RATIO_MIN * pull - push) * W.ratio;
  return 0;
}

function constraintPenalty(T: OTemplate[], ctx: Ctx): number {
  const { sessionPen, push, pull } = accumulate(T, ctx);
  let pen = sessionPen + ratioPenalty(push, pull);
  for (const m of MAJOR_IDX) {
    const v = ctx.vol[m];
    if (v < VOLUME_MIN) pen += (VOLUME_MIN - v) * W.vol;
    else if (v > VOLUME_MAX) pen += (v - VOLUME_MAX) * W.vol;
    const f = ctx.freq[m];
    if (f < FREQ_MIN) pen += (FREQ_MIN - f) * W.freq;
  }
  for (const m of MINOR_IDX) {
    const v = ctx.vol[m];
    if (v < MINOR_MIN) pen += (MINOR_MIN - v) * W.minor;
  }
  return pen;
}

const PATTERN_ORDER: PatternId[] = [
  "hpush",
  "vpush",
  "hpull",
  "vpull",
  "squat",
  "hinge",
  "lunge",
  "core",
];
const PI = Object.fromEntries(PATTERN_ORDER.map((p, i) => [p, i])) as Record<
  PatternId,
  number
>;
const patCount = new Int32Array(PATTERN_ORDER.length);
const patDistinct = new Int32Array(PATTERN_ORDER.length);

function preferencePenalty(T: OTemplate[], ctx: Ctx): number {
  let pen = 0;
  patCount.fill(0);
  patDistinct.fill(0);
  for (let a = 0; a < T.length; a++) {
    const t = T[a];
    for (const s of t.slots) {
      pen += Math.abs(s.sets - prefSets(s, ctx)) * W.setDev;
      if (s.accessory) {
        pen += W.acc;
        if (!s.ex.isolation) {
          pen += W.accCompound;
          if (t.slots.some((o) => !o.accessory && o.pattern === s.pattern))
            pen += W.accDup;
        }
        continue;
      }
      pen += Math.abs(ctx.profile.level - s.ex.diff) * W.diff;
      if (s.ex.isolation && s.pattern !== "core" && ctx.hasCompound[s.pattern])
        pen += W.isoMain;
      const pi = PI[s.pattern];
      patCount[pi]++;
      let seen = false;
      for (let b = 0; b < a && !seen; b++) {
        for (const o of T[b].slots) {
          if (!o.accessory && o.ex === s.ex) {
            seen = true;
            break;
          }
        }
      }
      if (!seen) patDistinct[pi]++;
    }
  }
  // التنويع: لا يتكرّر تمرينٌ بعينه في النمط نفسه بين الجلسات إن وُجد بديل
  for (let pi = 0; pi < PATTERN_ORDER.length; pi++) {
    if (!patCount[pi]) continue;
    const cands = ctx.mainCand[PATTERN_ORDER[pi]]?.length ?? 0;
    const possible = Math.min(patCount[pi], cands);
    if (possible > patDistinct[pi]) pen += (possible - patDistinct[pi]) * W.dup;
  }
  return pen;
}

function score(T: OTemplate[], ctx: Ctx): number {
  return constraintPenalty(T, ctx) + preferencePenalty(T, ctx);
}

/** العضلات الناقصة حالياً (لتوجيه الخانات المكمّلة) */
function deficits(
  T: OTemplate[],
  ctx: Ctx,
): {
  muscles: Set<MuscleId>;
  needPush: boolean;
  needPull: boolean;
} {
  const { push, pull } = accumulate(T, ctx);
  const muscles = new Set<MuscleId>();
  for (const m of MAJOR_IDX) {
    if (ctx.vol[m] < VOLUME_MIN || ctx.freq[m] < FREQ_MIN)
      muscles.add(MUSCLE_IDS[m]);
  }
  for (const m of MINOR_IDX) {
    if (ctx.vol[m] < MINOR_MIN) muscles.add(MUSCLE_IDS[m]);
  }
  return {
    muscles,
    needPush: push < RATIO_MIN * pull,
    needPull: push > RATIO_MAX * pull,
  };
}

function removalTie(s: OSlot): number {
  // عند تجاوز المدّة: انقص من الجذع أولاً ثم من العزل
  if (s.pattern === "core") return 2;
  if (s.ex.isolation || s.accessory) return 1;
  return 0;
}

function optimize(
  T: OTemplate[],
  ctx: Ctx,
  maxIterations = MAX_ITERATIONS,
): number {
  let current = score(T, ctx);
  for (let iter = 0; iter < maxIterations; iter++) {
    let bestScore = current - 1e-9;
    let bestTie = -1;
    let bestCommit: (() => void) | null = null;

    const consider = (
      apply: () => void,
      revert: () => void,
      tie: number,
    ): void => {
      apply();
      const sc = score(T, ctx);
      revert();
      if (
        sc < bestScore - 1e-9 ||
        (sc <= bestScore + 1e-9 && bestCommit !== null && tie > bestTie)
      ) {
        bestScore = Math.min(sc, bestScore);
        bestTie = tie;
        bestCommit = apply;
      }
    };

    for (const t of T) {
      const slots = t.slots;
      // زيادة مجموعةٍ في جلسةٍ ممتلئة لا تُحسّن أبداً (عقوبة المدّة أكبر من أي مكسب)
      const full = slots.reduce((n, x) => n + x.sets, 0) >= ctx.cap;
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (!full && s.sets < maxSets(s)) {
          consider(
            () => s.sets++,
            () => s.sets--,
            0,
          );
        }
        if (s.sets > MIN_SETS) {
          consider(
            () => s.sets--,
            () => s.sets++,
            removalTie(s),
          );
        } else if (s.accessory) {
          const idx = i;
          consider(
            () => slots.splice(idx, 1),
            () => slots.splice(idx, 0, s),
            removalTie(s),
          );
        }
        if (s.sets > MIN_SETS) {
          for (let j = 0; j < slots.length; j++) {
            const o = slots[j];
            if (j === i || o.sets >= maxSets(o)) continue;
            consider(
              () => {
                s.sets--;
                o.sets++;
              },
              () => {
                s.sets++;
                o.sets--;
              },
              0,
            );
          }
        }
        const pool = ctx.locked.has(s)
          ? []
          : s.accessory
            ? ctx.accPool
            : (ctx.mainCand[s.pattern] ?? []);
        for (const e of pool) {
          if (e.id === s.ex.id || slots.some((x) => x.ex.id === e.id)) continue;
          const prevEx = s.ex;
          const prevPattern = s.pattern;
          consider(
            () => {
              s.ex = e;
              if (s.accessory) s.pattern = e.pattern;
            },
            () => {
              s.ex = prevEx;
              s.pattern = prevPattern;
            },
            0,
          );
        }
      }
    }

    // خانات مكمّلة موجّهة نحو العضلات الناقصة
    const d = deficits(T, ctx);
    if (d.muscles.size || d.needPush || d.needPull) {
      const targeted = ctx.accPool.filter((e) => {
        const inf = infoOf(e);
        return (
          inf.primIds.some((m) => d.muscles.has(m)) ||
          (d.needPush && inf.push) ||
          (d.needPull && inf.pull)
        );
      });
      for (const t of T) {
        if (t.slots.filter((x) => x.accessory).length >= MAX_ACCESSORIES)
          continue;
        const total = t.slots.reduce((n, x) => n + x.sets, 0);
        for (const e of targeted) {
          if (t.slots.some((x) => x.ex.id === e.id)) continue;
          for (const sets of [1, ACC_START_SETS]) {
            const slot: OSlot = {
              pattern: e.pattern,
              ex: e,
              sets,
              accessory: true,
            };
            if (total + sets <= ctx.cap) {
              consider(
                () => t.slots.push(slot),
                () => t.slots.pop(),
                0,
              );
            }
            // عند امتلاء الجلسة: أضِف المكمّل وانقص مجموعاتٍ من خانةٍ أخرى في خطوةٍ واحدة
            if (total + sets > ctx.cap) {
              for (const o of t.slots) {
                if (o.sets - sets < MIN_SETS) continue;
                consider(
                  () => {
                    t.slots.push(slot);
                    o.sets -= sets;
                  },
                  () => {
                    t.slots.pop();
                    o.sets += sets;
                  },
                  0,
                );
              }
            }
          }
        }
      }
    }

    if (!bestCommit) break;
    (bestCommit as () => void)();
    current = score(T, ctx);
  }
  return current;
}

/**
 * «ركلة»: حين يبقى نقصٌ يمكن سدّه بتبديل تمرين، يُجرَّب كل تبديلٍ مرشّح مع إعادة
 * ضبط المجموعات حوله (خطوةٌ مركّبة لا يبلغها البحث المحلّي البسيط).
 */
function kick(T: OTemplate[], ctx: Ctx): boolean {
  const base = score(T, ctx);
  const d = deficits(T, ctx);
  if (!d.muscles.size) return false;
  let best: OTemplate[] | null = null;
  let bestScore = base - 1e-6;
  let tries = 0;
  for (let ti = 0; ti < T.length; ti++) {
    const slots = T[ti].slots;
    for (let si = 0; si < slots.length; si++) {
      const s = slots[si];
      if (s.accessory) continue;
      for (const e of ctx.mainCand[s.pattern] ?? []) {
        if (e.id === s.ex.id || slots.some((x) => x.ex.id === e.id)) continue;
        if (!infoOf(e).primIds.some((m) => d.muscles.has(m))) continue;
        if (++tries > MAX_KICKS) break;
        const T2 = cloneTemplates(T);
        const target = T2[ti].slots[si];
        target.ex = e;
        // نقفل الخانة المركولة كي لا يعيدها البحث فوراً إلى تمرينها السابق
        ctx.locked.add(target);
        const sc = optimize(T2, ctx, KICK_ITERATIONS);
        ctx.locked.delete(target);
        if (sc < bestScore) {
          bestScore = sc;
          best = T2;
        }
      }
    }
  }
  if (!best) return false;
  T.splice(0, T.length, ...best);
  return true;
}

/** مولّد أرقام عشوائية ثابت البذرة (للتنويع عند «أعِد التوليد») */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initialTemplates(
  skeletons: Skeleton[],
  ctx: Ctx,
  rnd: () => number,
): OTemplate[] {
  const usedByPattern: Record<string, Set<string>> = {};
  return skeletons.map((sk) => {
    const slots: OSlot[] = [];
    for (const pattern of sk.patterns) {
      const cands = ctx.mainCand[pattern] ?? [];
      if (!cands.length) continue;
      const used = (usedByPattern[pattern] ??= new Set());
      // الأقرب لمستوى المستخدم أولاً، والمركّب قبل العزل، ثم ترتيبٌ عشوائي ثابت البذرة
      const ranked = cands
        .map((e) => ({
          e,
          k:
            Math.abs(ctx.profile.level - e.diff) * 10 +
            (e.isolation && pattern !== "core" ? 5 : 0) +
            rnd(),
        }))
        .sort((a, b) => a.k - b.k)
        .map((x) => x.e);
      const pick =
        ranked.find(
          (e) => !used.has(e.id) && !slots.some((s) => s.ex.id === e.id),
        ) ??
        ranked.find((e) => !slots.some((s) => s.ex.id === e.id)) ??
        ranked[0];
      used.add(pick.id);
      slots.push({
        pattern,
        ex: pick,
        sets: defaultSets(pick, ctx.profile.goal),
        accessory: false,
      });
    }
    return { key: sk.key, name: sk.name, slots };
  });
}

function cloneTemplates(T: OTemplate[]): OTemplate[] {
  return T.map((t) => ({ ...t, slots: t.slots.map((s) => ({ ...s })) }));
}

// ───────────────────────── التحليل والتحقّق ─────────────────────────

export interface PlanStats {
  volume: MuscleMap;
  frequency: MuscleMap;
  /** مجموعات كل قالب */
  sessionSets: number[];
  /** الدقائق المقدّرة لكل قالب (3 دقائق للمجموعة) */
  sessionMinutes: number[];
  /** أعلى مجموعات مباشرة لعضلةٍ في جلسة */
  maxDirect: number;
  pushSets: number;
  pullSets: number;
  ratio: number | null;
  perWeek: number;
}

export function analyzeTemplates(
  templates: {
    slots: { exerciseId: string; sets: number; pattern?: PatternId }[];
  }[],
  daysPerWeek: number,
  exById: Record<string, Exercise>,
): PlanStats {
  const perWeek = perWeekOf(daysPerWeek, templates.length);
  const volume = weeklyVolume(templates, perWeek, exById);
  const frequency = weeklyFrequency(templates, perWeek, exById);
  let pushSets = 0;
  let pullSets = 0;
  let maxDirect = 0;
  const sessionSets: number[] = [];
  for (const t of templates) {
    let n = 0;
    for (const s of t.slots) {
      n += s.sets;
      const ex = exById[s.exerciseId];
      if (!ex) continue;
      if (PUSH_PATTERNS.includes(ex.pattern)) pushSets += s.sets * perWeek;
      if (PULL_PATTERNS.includes(ex.pattern) && !ex.timed)
        pullSets += s.sets * perWeek;
    }
    sessionSets.push(n);
    const d = directSets(t.slots, exById);
    for (const m of MUSCLE_IDS) maxDirect = Math.max(maxDirect, d[m]);
  }
  return {
    volume,
    frequency,
    sessionSets,
    sessionMinutes: sessionSets.map((n) => n * MINUTES_PER_SET),
    maxDirect,
    pushSets: round1(pushSets),
    pullSets: round1(pullSets),
    ratio: pullSets > 0 ? Math.round((pushSets / pullSets) * 100) / 100 : null,
    perWeek,
  };
}

/** التحقّق الإلزامي (F3.5) — يُرجع قائمة المشكلات المتبقّية */
export function planIssues(
  templates: SessionTemplate[],
  profile: Profile,
  exById: Record<string, Exercise>,
  missingPatterns: PatternId[] = [],
): PlanIssue[] {
  const st = analyzeTemplates(templates, profile.daysPerWeek, exById);
  const issues: PlanIssue[] = [];
  for (const p of missingPatterns)
    issues.push({ kind: "no-exercise", pattern: p });
  for (const m of MAJOR_MUSCLES) {
    const v = round1(st.volume[m]);
    if (v < VOLUME_MIN)
      issues.push({ kind: "volume-low", muscle: m, value: v });
    else if (v > VOLUME_MAX)
      issues.push({ kind: "volume-high", muscle: m, value: v });
    const f = round1(st.frequency[m]);
    if (f < FREQ_MIN) issues.push({ kind: "frequency", muscle: m, value: f });
  }
  for (const m of MINOR_MUSCLES) {
    const v = round1(st.volume[m]);
    if (v < MINOR_MIN) issues.push({ kind: "minor-low", muscle: m, value: v });
  }
  if (
    st.ratio !== null &&
    (st.ratio < RATIO_MIN - 1e-9 || st.ratio > RATIO_MAX + 1e-9)
  ) {
    issues.push({ kind: "ratio", value: st.ratio });
  }
  const patterns = new Set(
    templates.flatMap((t) => t.slots.map((s) => exById[s.exerciseId]?.pattern)),
  );
  if (!patterns.has("squat") || !patterns.has("hinge"))
    issues.push({ kind: "squat-hinge" });
  templates.forEach((t, i) => {
    if (st.sessionMinutes[i] > profile.sessionMinutes * 1.1)
      issues.push({
        kind: "duration",
        templateId: t.id,
        value: st.sessionMinutes[i],
      });
  });
  return issues;
}

export function formatIssue(
  i: PlanIssue,
  templates: SessionTemplate[] = [],
): string {
  const mName = i.muscle ? MUSCLE_BY_ID[i.muscle].ar : "";
  const v = i.value !== undefined ? String(i.value) : "";
  switch (i.kind) {
    case "volume-low":
      return ar.issues.volumeLow(mName, v);
    case "volume-high":
      return ar.issues.volumeHigh(mName, v);
    case "frequency":
      return ar.issues.frequency(mName, v);
    case "minor-low":
      return ar.issues.minorLow(mName, v);
    case "ratio":
      return ar.issues.ratio(v);
    case "no-exercise":
      return ar.issues.noExercise(i.pattern ? PATTERN_BY_ID[i.pattern].ar : "");
    case "squat-hinge":
      return ar.issues.squatHinge;
    case "duration":
      return ar.issues.duration(
        templates.find((t) => t.id === i.templateId)?.name ?? "",
        i.value ?? 0,
      );
  }
}

// ───────────────────────── الواجهة العامة ─────────────────────────

export interface BuildInput {
  profile: Profile;
  exercises: Exercise[];
  /** تجاوز يدوي لاختيار التقسيم */
  split?: Split;
  /** بذرة التنويع («أعِد التوليد» يمرّر بذرةً جديدة) */
  seed?: number;
  id?: string;
  now?: number;
}

function toSlots(t: OTemplate, profile: Profile): Slot[] {
  const main = t.slots.filter((s) => !s.accessory && s.pattern !== "core");
  const acc = t.slots.filter((s) => s.accessory);
  const core = t.slots.filter((s) => !s.accessory && s.pattern === "core");
  return [...main, ...acc, ...core].map((s) => {
    const slot: Slot = {
      pattern: s.pattern,
      exerciseId: s.ex.id,
      sets: s.sets,
      prescription: basePrescription(s.ex, profile.goal, profile.level),
    };
    if (s.accessory) slot.accessory = true;
    return slot;
  });
}

/** يبني دورةً متوسطة كاملة: 4 أسابيع تراكم + أسبوع تفريغ */
export function buildMesocycle(input: BuildInput): Mesocycle {
  const { profile, exercises } = input;
  const exById = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const split = input.split ?? chooseSplit(profile.daysPerWeek);
  const skeletons = splitSkeletons(split, profile.daysPerWeek);
  const allowed = exercises.filter((e) => isAllowed(e, profile));

  const mainCand: Record<string, Exercise[]> = {};
  const hasCompound: Record<string, boolean> = {};
  const missing = new Set<PatternId>();
  for (const sk of skeletons) {
    for (const p of sk.patterns) {
      if (mainCand[p]) continue;
      mainCand[p] = mainCandidates(p, profile, exercises);
      hasCompound[p] = mainCand[p].some((e) => !e.isolation);
      if (!mainCand[p].length) missing.add(p);
    }
  }

  const ctx: Ctx = {
    profile,
    perWeek: perWeekOf(profile.daysPerWeek, skeletons.length),
    cap: sessionSetCap(profile.sessionMinutes),
    mainCand,
    accPool: allowed,
    hasCompound,
    locked: new Set(),
    vol: new Float64Array(NM),
    freq: new Float64Array(NM),
    direct: new Float64Array(NM),
  };

  const seed = input.seed ?? 1;
  let best: OTemplate[] | null = null;
  let bestScore = Infinity;
  // محاولتان ببذرتين مختلفتين إن بقيت مخالفات (إعادة التوليد بتغيير التمارين)
  for (let attempt = 0; attempt < 2; attempt++) {
    const T = initialTemplates(
      skeletons,
      ctx,
      mulberry32(seed + attempt * 7919),
    );
    let sc = optimize(T, ctx);
    for (let k = 0; k < 3 && constraintPenalty(T, ctx) > 1e-6; k++) {
      if (!kick(T, ctx)) break;
      sc = optimize(T, ctx);
    }
    if (sc < bestScore) {
      bestScore = sc;
      best = cloneTemplates(T);
    }
    if (constraintPenalty(T, ctx) < 1e-6) break;
  }

  const id = input.id ?? `meso-${(input.now ?? Date.now()).toString(36)}`;
  const templates: SessionTemplate[] = (best ?? []).map((t, i) => ({
    id: `t${i + 1}`,
    name: t.name,
    slots: toSlots(t, profile),
  }));

  return finalizeMesocycle(
    {
      id,
      createdAt: input.now ?? Date.now(),
      split,
      weeks: 4,
      deloadWeek: true,
      templates,
      rirByWeek: rirByWeek(profile.goal, profile.level),
      volumeByMuscle: {},
      warnings: [],
      daysPerWeek: profile.daysPerWeek as DaysPerWeek,
      goal: profile.goal,
      level: profile.level,
      sessionMinutes: profile.sessionMinutes,
      status: "active",
    },
    profile,
    exById,
    [...missing],
  );
}

/** يعيد حساب الحجم والتكرار والتحذيرات بعد أي تعديل يدوي (تبديل تمرين مثلاً) */
export function finalizeMesocycle(
  meso: Mesocycle,
  profile: Profile,
  exById: Record<string, Exercise>,
  missingPatterns: PatternId[] = [],
): Mesocycle {
  const st = analyzeTemplates(meso.templates, profile.daysPerWeek, exById);
  const missing = missingPatterns.length
    ? missingPatterns
    : (meso.issues ?? [])
        .filter((i) => i.kind === "no-exercise" && i.pattern)
        .map((i) => i.pattern as PatternId);
  const issues = planIssues(meso.templates, profile, exById, missing);
  const volumeByMuscle: Record<string, number> = {};
  const frequencyByMuscle: Record<string, number> = {};
  for (const m of MUSCLE_IDS) {
    volumeByMuscle[m] = round1(st.volume[m]);
    frequencyByMuscle[m] = round1(st.frequency[m]);
  }
  return {
    ...meso,
    volumeByMuscle,
    frequencyByMuscle,
    issues,
    warnings: issues.map((i) => formatIssue(i, meso.templates)),
  };
}

/** يبدّل تمرين خانةٍ في الدورة ويعيد حساب المؤشّرات */
export function swapSlotExercise(
  meso: Mesocycle,
  templateId: string,
  slotIndex: number,
  newExercise: Exercise,
  profile: Profile,
  exById: Record<string, Exercise>,
): Mesocycle {
  const templates = meso.templates.map((t) =>
    t.id !== templateId
      ? t
      : {
          ...t,
          slots: t.slots.map((s, i) =>
            i !== slotIndex
              ? s
              : {
                  ...s,
                  exerciseId: newExercise.id,
                  prescription: basePrescription(
                    newExercise,
                    profile.goal,
                    profile.level,
                  ),
                },
          ),
        },
  );
  return finalizeMesocycle({ ...meso, templates }, profile, {
    ...exById,
    [newExercise.id]: newExercise,
  });
}
