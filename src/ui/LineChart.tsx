import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

export interface ChartPoint {
  ts: number;
  y: number;
}

const DAY = 86400;

/**
 * رسمٌ خطّي خفيف (uPlot) لتقدّم تمرين عبر الزمن. يعمل بنقطةٍ واحدة أيضاً،
 * ويُرفق جدولاً مخفياً لقارئات الشاشة.
 */
export function LineChart({
  points,
  label,
  unit,
  color = "#cdfb3e",
  height = 200,
  bars = false,
}: {
  points: ChartPoint[];
  label: string;
  unit?: string;
  color?: string;
  height?: number;
  bars?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !points.length) return;
    const xs = points.map((p) => Math.round(p.ts / 1000));
    const ys = points.map((p) => p.y);
    const axis = {
      stroke: "#9c9784",
      grid: { stroke: "rgba(236,232,218,.07)", width: 1 },
      ticks: { stroke: "rgba(236,232,218,.12)", width: 1 },
      font: "12px Tajawal, system-ui, sans-serif",
    };
    const opts: uPlot.Options = {
      width: Math.max(240, el.clientWidth),
      height,
      legend: { show: false },
      cursor: { drag: { x: false, y: false }, points: { size: 9 } },
      scales: {
        x: {
          time: false,
          range: (_u, min, max) =>
            min === max
              ? [min - 3 * DAY, max + 3 * DAY]
              : [min - DAY / 2, max + DAY / 2],
        },
        y: {
          range: (_u, min, max) => {
            if (min === max) return [Math.max(0, min * 0.8), max * 1.2 + 1];
            const pad = (max - min) * 0.15;
            return [Math.max(0, min - pad), max + pad];
          },
        },
      },
      axes: [
        {
          ...axis,
          // تواريخ نقاط البيانات نفسها (حتى 6)، وإلا 5 علامات متساوية
          splits: () => {
            if (xs.length <= 6) return xs;
            const lo = xs[0];
            const hi = xs[xs.length - 1];
            return Array.from(
              { length: 5 },
              (_, k) => lo + ((hi - lo) * k) / 4,
            );
          },
          values: (_u, vals) =>
            vals.map((v) => {
              const d = new Date(v * 1000);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
        },
        {
          ...axis,
          size: 48,
          values: (_u, vals) =>
            vals.map((v) => String(Math.round(v * 10) / 10)),
        },
      ],
      series: [
        {},
        {
          label,
          stroke: color,
          width: 2,
          fill: bars ? "rgba(92,199,220,.35)" : "rgba(205,251,62,.08)",
          paths: bars ? uPlot.paths.bars?.({ size: [0.5, 40] }) : undefined,
          points: { show: true, size: 8, fill: color, stroke: color },
        },
      ],
    };
    const plot = new uPlot(opts, [xs, ys], el);
    const ro = new ResizeObserver(() => {
      plot.setSize({ width: Math.max(240, el.clientWidth), height });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      plot.destroy();
    };
  }, [points, label, color, height, bars]);

  const summary = points
    .map((p) => {
      const d = new Date(p.ts);
      return `${d.getDate()}/${d.getMonth() + 1}: ${p.y}${unit ? " " + unit : ""}`;
    })
    .join("، ");

  return (
    <figure style={{ margin: 0 }}>
      <div ref={box} dir="ltr" role="img" aria-label={`${label}. ${summary}`} />
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
