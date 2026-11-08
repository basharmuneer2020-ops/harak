import { useSyncExternalStore } from "react";

/**
 * موجِّه بسيط يعتمد على الـ hash (#/today …) حتى لا تنكسر الروابط على GitHub Pages
 * ولا يحتاج الخادم إلى أي إعادة توجيه.
 */
export interface Route {
  /** المسار بلا # ولا / بادئة، مثل "library/pattern/hpush" */
  path: string;
  segments: string[];
  query: URLSearchParams;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "");
  const [pathPart = "", queryPart = ""] = raw.split("?");
  const segments = pathPart
    .split("/")
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));
  return {
    path: segments.join("/"),
    segments,
    query: new URLSearchParams(queryPart),
  };
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const getSnapshot = (): string => window.location.hash;

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => "");
  return parseHash(hash);
}

/** ينتقل إلى مسار داخلي، مثل navigate('/library/pattern/hpush') */
export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  const target = "#" + (to.startsWith("/") ? to : "/" + to);
  if (window.location.hash === target) return;
  if (opts.replace) {
    const url = window.location.pathname + window.location.search + target;
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

/** يرجع خطوةً في السجل إن وُجدت، وإلا ينتقل إلى المسار البديل */
export function goBack(fallback: string): void {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback, { replace: true });
}

export function href(to: string): string {
  return "#" + (to.startsWith("/") ? to : "/" + to);
}
