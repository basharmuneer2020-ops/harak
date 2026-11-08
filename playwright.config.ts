import { defineConfig, devices } from "@playwright/test";

/** اختبار دخانٍ للرحلة الكاملة على نسخة البناء (vite preview) بحجم جوّال */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173/harak/",
    serviceWorkers: "block",
    locale: "ar",
    acceptDownloads: true,
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173/harak/",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
