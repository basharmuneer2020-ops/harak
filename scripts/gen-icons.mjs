/* global document */
// يولّد أيقونات PWA بحرف «ح» بلون lime على خلفيةٍ داكنة، بخط Changa المضمّن.
// التشغيل: npm run icons  (يحتاج Chromium عبر Playwright)
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const font = readFileSync(
  new URL(
    "../node_modules/@fontsource/changa/files/changa-arabic-800-normal.woff2",
    import.meta.url,
  ),
).toString("base64");

/** @param {number} size @param {{ maskable?: boolean, rounded?: boolean }} opts */
function html(size, { maskable = false, rounded = false } = {}) {
  // الأيقونة القابلة للقصّ (maskable) تُبقي الحرف داخل المنطقة الآمنة (80%).
  const glyph = maskable ? 0.5 : 0.64;
  const radius = rounded ? Math.round(size * 0.22) : 0;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Changa';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:800;}
html,body{margin:0;width:${size}px;height:${size}px;background:${rounded ? "transparent" : "#0c0d0a"};overflow:hidden}
.box{width:${size}px;height:${size}px;border-radius:${radius}px;position:relative;overflow:hidden;
  background:radial-gradient(${size * 0.9}px ${size * 0.7}px at 80% 0%,rgba(205,251,62,.16),transparent 62%),#0c0d0a;
  display:grid;place-items:center}
.l{font-family:'Changa';font-weight:800;color:#cdfb3e;font-size:${size * glyph}px;line-height:1;
  transform:translateY(${size * (maskable ? -0.101 : -0.123)}px)}
</style></head><body><div class="box"><div class="l">ح</div></div></body></html>`;
}

const targets = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/icon-maskable-512.png", size: 512, maskable: true },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "public/favicon.png", size: 64, rounded: true },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(html(t.size, t));
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({
    omitBackground: !!t.rounded,
    type: "png",
  });
  writeFileSync(t.file, buf);
  console.log("✓", t.file);
}
await browser.close();
