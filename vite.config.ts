import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// كل المسارات تحت /harak/ لأن التطبيق يُنشَر على GitHub Pages في مسارٍ فرعي.
const BASE = "/harak/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        id: BASE,
        name: "حَراك — درّب الحركة",
        short_name: "حَراك",
        description:
          "تطبيق تدريبٍ شخصي مبنيّ على أنماط الحركة: يبني البرنامج ويقود الجلسة ويرفع الحِمل تلقائياً.",
        lang: "ar",
        dir: "rtl",
        start_url: BASE,
        scope: BASE,
        display: "standalone",
        orientation: "portrait",
        background_color: "#0c0d0a",
        theme_color: "#0c0d0a",
        categories: ["health", "fitness", "sports"],
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // القشرة كاملة + الخطوط المضمّنة: التطبيق يعمل بلا إنترنت.
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,ico,webmanifest}"],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
});
