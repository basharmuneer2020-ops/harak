import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

// الخطوط مضمّنة في الحزمة (woff2) — لا اتصال بـ Google Fonts وقت التشغيل.
import "@fontsource/changa/arabic-600.css";
import "@fontsource/changa/latin-600.css";
import "@fontsource/changa/arabic-700.css";
import "@fontsource/changa/latin-700.css";
import "@fontsource/changa/arabic-800.css";
import "@fontsource/changa/latin-800.css";
import "@fontsource/tajawal/arabic-400.css";
import "@fontsource/tajawal/latin-400.css";
import "@fontsource/tajawal/arabic-500.css";
import "@fontsource/tajawal/latin-500.css";
import "@fontsource/tajawal/arabic-700.css";
import "@fontsource/tajawal/latin-700.css";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/rtl.css";

import { App } from "./app/App";

// عامل الخدمة: تحديث تلقائي وتخزين القشرة للعمل دون اتصال.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
