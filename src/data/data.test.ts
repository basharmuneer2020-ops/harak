import { describe, expect, it } from "vitest";
import { CHAINS } from "./chains";
import {
  EXERCISES,
  EXERCISES_SEED,
  EXERCISE_BY_ID,
  EXTRA_EXERCISES_SEED,
  musclesOf,
} from "./exercises";
import { MAJOR_MUSCLES, MINOR_MUSCLES, MUSCLES, MUSCLE_IDS } from "./muscles";
import { PATTERNS } from "./patterns";
import { explainLinks } from "../ui/links";

describe("البيانات الأوّلية", () => {
  it("ثمانية أنماط و16 عضلة: 13 رئيسية و3 ثانوية", () => {
    expect(PATTERNS).toHaveLength(8);
    expect(MUSCLES).toHaveLength(16);
    expect(MAJOR_MUSCLES).toHaveLength(13);
    expect(MINOR_MUSCLES).toEqual(["rear delt", "grip", "calves"]);
  });

  it("العضلات الثانوية ليست أساسيةً في أي نمط", () => {
    for (const p of PATTERNS) {
      for (const m of MINOR_MUSCLES) expect(p.primary).not.toContain(m);
    }
  });

  it("58 تمريناً من الملحق + 6 مضافة، بمعرّفاتٍ فريدة", () => {
    expect(EXERCISES_SEED).toHaveLength(58);
    expect(EXTRA_EXERCISES_SEED.length).toBeGreaterThanOrEqual(4);
    const ids = new Set(EXERCISES.map((e) => e.id));
    expect(ids.size).toBe(EXERCISES.length);
  });

  it("كل تمرين: 3 إرشادات وخطآن وعضلات صحيحة", () => {
    for (const e of EXERCISES) {
      expect(e.cues, e.id).toHaveLength(3);
      expect(e.mistakes, e.id).toHaveLength(2);
      const { primary, secondary } = musclesOf(e);
      expect(primary.length, e.id).toBeGreaterThan(0);
      for (const m of [...primary, ...secondary]) {
        expect(MUSCLE_IDS, `${e.id}:${m}`).toContain(m);
      }
    }
  });

  it("وسوم المفاصل الدنيا من التكليف", () => {
    const has = (id: string, j: string) =>
      expect(EXERCISE_BY_ID[id].joints, id).toContain(j);
    // قفز أو اندفاع عميق أو أمامي أو نوردي → ركبة
    for (const id of [
      "jump-squat",
      "lunge",
      "bulgarian-split-squat",
      "dumbbell-lunge",
      "dumbbell-bulgarian-split-squat",
      "smith-machine-lunge",
      "front-squat",
      "nordic-hamstring-curl",
    ])
      has(id, "knee");
    for (const id of [
      "deadlift",
      "romanian-deadlift",
      "kettlebell-swing",
      "back-extension",
      "bent-over-barbell-row",
      "russian-twist",
    ])
      has(id, "lower_back");
    for (const e of EXERCISES.filter((x) => x.pattern === "vpush"))
      has(e.id, "shoulder");
    has("decline-push-up", "shoulder");
    for (const id of [
      "push-up",
      "incline-push-up",
      "decline-push-up",
      "pike-push-up",
      "wall-handstand-push-up",
    ])
      has(id, "wrist");
  });

  it("تمارين العزل المذكورة في التكليف موسومة", () => {
    for (const id of [
      "cable-chest-fly",
      "leg-extension",
      "leg-curl",
      "back-extension",
      "ab-crunch-machine",
      "russian-twist",
      "cable-woodchopper",
      "leg-raise",
      "plank",
      "side-plank",
      "dead-bug",
    ])
      expect(EXERCISE_BY_ID[id].isolation, id).toBe(true);
  });

  it("تمارين تسدّ ثغرات بطّة الساق والقبضة والكتف الخلفي", () => {
    const targets = (m: string) =>
      EXERCISES.filter((e) => musclesOf(e).primary.includes(m as never));
    expect(targets("calves").map((e) => e.id)).toEqual(
      expect.arrayContaining(["standing-calf-raise", "seated-calf-raise"]),
    );
    expect(targets("grip").map((e) => e.id)).toContain("dead-hang");
    expect(EXERCISE_BY_ID["face-pull"].pattern).toBe("hpull");
    expect(musclesOf(EXERCISE_BY_ID["face-pull"]).primary).toContain(
      "rear delt",
    );
  });

  it("سلالم التدرّج تشير إلى تمارين موجودة", () => {
    for (const c of CHAINS) {
      for (const st of c.stages) expect(EXERCISE_BY_ID[st], st).toBeDefined();
    }
    expect(EXERCISE_BY_ID["push-up"].progressionChain).toBe("chain-hpush");
  });

  it("روابط الشرح الثلاثة بنصوص البحث المطلوبة", () => {
    const links = explainLinks({ en: "goblet squat" });
    expect(links.map((l) => l.label)).toEqual([
      "MuscleWiki",
      "ATHLEAN-X",
      "Jeff Nippard",
    ]);
    expect(decodeURIComponent(links[0].url)).toContain(
      "google.com/search?q=goblet squat musclewiki",
    );
    expect(decodeURIComponent(links[1].url)).toContain(
      "youtube.com/results?search_query=goblet squat athlean-x",
    );
    expect(decodeURIComponent(links[2].url)).toContain(
      "goblet squat jeff nippard",
    );
  });
});
