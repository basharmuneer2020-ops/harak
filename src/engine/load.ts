/** أدوات الأحمال: التقريب لأصغر قفزة أوزان، وحِمل التفريغ */

/** تقريب الوزن لأقرب مضاعفٍ لأصغر قفزة متاحة */
export function roundToPlate(kg: number, plateKg: number): number {
  if (plateKg <= 0) return Math.round(kg * 10) / 10;
  return Math.round(Math.round(kg / plateKg) * plateKg * 100) / 100;
}

export function floorToPlate(kg: number, plateKg: number): number {
  if (plateKg <= 0) return Math.floor(kg * 10) / 10;
  return Math.round(Math.floor(kg / plateKg + 1e-9) * plateKg * 100) / 100;
}

/**
 * وزن التفريغ: خفضٌ بين 10% و15% (الأقرب إلى 12.5%) بعد التقريب لأصغر قفزة.
 * إن تعذّر البقاء داخل المجال يُختار الأقرب، وعند التساوي الأخفّ.
 */
export function deloadWeight(kg: number, plateKg: number): number {
  if (kg <= 0) return 0;
  const target = kg * 0.875;
  const lo = floorToPlate(target, plateKg);
  const hi = Math.round((lo + plateKg) * 100) / 100;
  const cands = [lo, hi].filter((w) => w > 0);
  if (!cands.length) return 0;
  const cut = (w: number) => 1 - w / kg;
  const inRange = cands.filter(
    (w) => cut(w) >= 0.1 - 1e-9 && cut(w) <= 0.15 + 1e-9,
  );
  const pool = inRange.length ? inRange : cands;
  return pool.sort(
    (a, b) => Math.abs(cut(a) - 0.125) - Math.abs(cut(b) - 0.125) || a - b,
  )[0];
}
