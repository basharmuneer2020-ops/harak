import { expect, test, type Page } from "@playwright/test";

/**
 * رحلة المالك (قسم 7): إعداد أوّلي → توليد → تبديل → جلسة (استعداد، تسجيل، مؤقّت،
 * إغلاق وإعادة فتح، إنهاء) → السجل ورسم e1RM → كارديو WHO → تصدير ومسح واستعادة.
 */

async function logSets(
  page: Page,
  cardIndex: number,
  sets: number,
  kg: number,
) {
  const card = page.locator("article").nth(cardIndex);
  await card.locator("input").nth(1).fill(String(kg));
  await card.locator("input").nth(1).blur();
  for (let k = 0; k < sets; k++) {
    if (!(await card.getByRole("button", { name: "سجّل المجموعة" }).count())) {
      await card.getByRole("button", { name: "مجموعة إضافية" }).click();
    }
    await card.getByRole("button", { name: "سجّل المجموعة" }).click();
    // مؤقّت الراحة يبدأ تلقائياً بعد كل مجموعة
    await expect(page.getByRole("timer")).toBeVisible();
  }
}

test("الرحلة الكاملة", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // 2) الإعداد الأول: متوسّط، تضخّم، 4 أيام، 60 دقيقة، دمبل + ماكينة، ركبة حسّاسة
  await page.goto("./");
  await page.getByRole("button", { name: "ابدأ الإعداد" }).click();
  await page.getByRole("radio", { name: /متوسّط/ }).click();
  await page.getByRole("radio", { name: /تضخّم/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("radio", { name: "4", exact: true }).click();
  await page.getByRole("radio", { name: /60/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("checkbox", { name: "وزن الجسم" }).click();
  await page.getByRole("checkbox", { name: "الركبة" }).click();
  await page.getByRole("button", { name: "احفظ وابدأ" }).click();

  // 3) ولّد الدورة → علوي/سفلي بلا تحذيرات، وخريطة الحجم ومخطّط RIR ظاهران
  await page.getByRole("button", { name: "ولّد الدورة" }).click();
  await expect(page.getByText("علوي / سفلي").first()).toBeVisible();
  await expect(page.getByText("الخطة تحقّق كل قواعد الحجم")).toBeVisible();
  await expect(page.getByText("خريطة الحجم الأسبوعي")).toBeVisible();
  await expect(page.getByRole("img", { name: /الأسبوع 1: RIR/ })).toBeVisible();
  const articles = page.locator("article");
  await expect(articles).toHaveCount(4);
  for (const t of await articles.allInnerTexts()) {
    expect(t).not.toContain("قرفصاء قفز");
    expect(t).not.toContain("الطعنة");
  }

  // 4) بدّل تمريناً → بديلٌ من النمط نفسه
  const firstName = await articles.first().locator("a").first().innerText();
  await page
    .getByRole("button", { name: /^بدّل:/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").locator("button").nth(1).click();
  await expect(articles.first().locator("a").first()).not.toHaveText(firstName);

  // 5) جلسة اليوم: استعداد → إحماء → تسجيل 3 مجموعات لتمرينين → مؤقّت
  await page.goto("./#/today");
  await page.getByRole("button", { name: "ابدأ الجلسة" }).click();
  await page.getByRole("radio", { name: "النوم: 4" }).click();
  await page.getByRole("button", { name: "ابدأ", exact: true }).click();
  await expect(page.getByText("الإحماء").first()).toBeVisible();
  await logSets(page, 0, 2, 20);

  // 9) أغلق التطبيق في منتصف الجلسة وأعد فتحه → المجموعات محفوظة
  await page.reload();
  await page.goto("./#/today");
  await expect(page.getByText("سجّلت 2 مجموعة حتى الآن")).toBeVisible();
  await page.getByRole("link", { name: "استكمل الجلسة" }).click();
  await logSets(page, 0, 1, 20);
  await logSets(page, 1, 3, 30);
  await page.getByRole("button", { name: "أنهِ الجلسة" }).first().click();
  await expect(
    page.getByRole("heading", { name: "ملخّص الجلسة" }),
  ).toBeVisible();
  await expect(page.getByText("قرارات الجلسة القادمة")).toBeVisible();

  // 6) السجل: الجلسة مسجّلة بالتاريخ، ورسم e1RM يظهر نقطة
  await page.goto("./#/history");
  await expect(
    page.locator('a[data-today="true"][data-has="true"]'),
  ).toBeVisible();
  await page.locator('a[href*="history/exercise"]').first().click();
  await expect(page.locator("canvas").first()).toBeVisible();

  // 7) كارديو 30 دقيقة معتدلة → مؤشّر WHO يعرض 30/150
  await page.goto("./#/history");
  await page.getByRole("button", { name: "سجّل كارديو" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "احفظ" }).click();
  await expect(page.getByText("30/150").first()).toBeVisible();

  // 8) صدّر JSON، امسح بيانات المتصفّح، استورد الملف → كل شيء يعود
  await page.goto("./#/me");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "صدّر نسخة احتياطية" }).click(),
  ]);
  const backup = await download.path();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase("harak");
        req.onsuccess = req.onerror = req.onblocked = () => resolve();
      }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "ابدأ الإعداد" }),
  ).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(backup);
  await page
    .getByRole("button", { name: "استعد من نسخة احتياطية" })
    .last()
    .click();
  // بعد الاستعادة ينتقل التطبيق إلى «اليوم» بالبيانات المستعادة
  await expect(page.getByText("جلسة اليوم المقترحة")).toBeVisible();
  await page.goto("./#/history");
  await expect(page.getByText("30/150").first()).toBeVisible();
  await expect(
    page.locator('a[data-today="true"][data-has="true"]'),
  ).toBeVisible();
  await page.goto("./#/program");
  await expect(page.locator("article")).toHaveCount(4);

  expect(errors).toEqual([]);
});
