<template>
  <!-- renderless -->
</template>

<script setup>
import { frame, MONITOR_PROPS, usePoll } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const data = usePoll({
  url: "/api/monitor/market",
  intervalMs: 1000 * 60 * 5,
  titleFor: (d) => {
    const c = d?.closes?.length ? d.closes : null;
    const price = d?.price ?? c?.at(-1);
    const prev = d?.previousClose ?? c?.at(-2);
    if (!Number.isFinite(price)) return "QQQ chart offline";
    if (Number.isFinite(prev) && prev > 0) {
      const delta = price - prev;
      return `QQQ $${fmt.format(price)} ${delta >= 0 ? "+" : ""}${fmt.format((delta / prev) * 100)}%`;
    }
    return `QQQ $${fmt.format(price)}`;
  },
  emit,
});

const FALLBACK = [
  52, 53.2, 54.1, 55.3, 54.8, 56.4, 57.9, 58.2, 57.1, 58.8, 60.2, 61.7, 62.1, 60.5, 61.9, 63.4,
  64.8, 65.2, 64.1, 65.8, 67.3, 66.4, 68.1, 69.5, 70.2, 71.4, 70.1, 72.6, 73.8, 74.2, 73.1, 75.4,
  76.9, 78.2, 77.5, 79.1, 80.4, 79.2, 81.5, 83.2, 84.6, 85.1, 83.9, 86.4, 87.8, 88.2, 86.5, 88.9,
  90.4, 91.8, 90.1, 92.5, 93.9, 95.2, 94.3, 96.7, 95.4, 97.8, 99.2, 98.1, 100.4, 102.1, 101.3,
];

const buildLines = frame(props, (ctx, l, elapsed) => {
  const d = data.value;
  const series = d?.closes?.length ? d.closes : FALLBACK;

  // generous breathing room — keeps the line away from the title bar
  // so nothing else gets sampled into ascii noise
  const padL = 3,
    padR = 3,
    padT = 5,
    padB = 3;
  const chartW = l.cols - padL - padR;
  const chartH = l.rows - padT - padB;

  // The chart is completed closes only; live price is shown in the title, not as a fake close point.
  const prev = Number(d?.previousClose ?? series.at(-1));
  const rawMin = Math.min(...series, Number.isFinite(prev) ? prev : Infinity);
  const rawMax = Math.max(...series, Number.isFinite(prev) ? prev : -Infinity);
  // pad the range so the prev-close reference always has breathing room
  // away from the top/bottom edges of the chart
  const pad = Math.max(0.0001, (rawMax - rawMin) * 0.18);
  const min = rawMin - pad;
  const max = rawMax + pad;
  const range = max - min;
  const n = series.length;

  // map a price to its y pixel
  const toY = (p) => Math.round(padT + chartH - ((p - min) / range) * chartH);

  // Y-axis scale dots in the left/right margins at regular price intervals
  const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
  const interval = NICE.find((i) => i >= range / 5) ?? NICE.at(-1);
  ctx.fillStyle = "#2e2e2e";
  for (let p = Math.ceil(min / interval) * interval; p <= max; p += interval) {
    const ty = toY(p);
    ctx.fillRect(1, ty, 1, 1); // left margin dot
    ctx.fillRect(padL + chartW + 1, ty, 1, 1); // right margin dot
  }

  // dotted reference line at the previous close — always visible
  if (Number.isFinite(prev)) {
    const refY = toY(prev);
    ctx.fillStyle = "#606060";
    for (let x = padL; x < padL + chartW; x += 2) ctx.fillRect(x, refY, 1, 1);
    // accent dot in both margins to anchor the prev-close level
    ctx.fillStyle = "#888";
    ctx.fillRect(1, refY, 1, 1);
    ctx.fillRect(padL + chartW + 1, refY, 1, 1);
  }

  // gentle sweep reveal
  const reveal = ((elapsed * 0.15) % 1.4) - 0.15;
  const visible = Math.max(2, Math.floor(n * Math.min(1, Math.max(0.04, reveal))));
  const toX = (i) => padL + (i / (n - 1)) * chartW;
  const rawY = (p) => padT + chartH - ((p - min) / range) * chartH;

  // single clean white line
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < visible; i += 1) ctx[i === 0 ? "moveTo" : "lineTo"](toX(i), rawY(series[i]));
  ctx.stroke();

  // pulsing cursor dot at the leading edge
  const headI = visible - 1;
  const hx = toX(headI);
  const hy = rawY(series[headI]);
  const pulse = 0.7 + 0.3 * Math.sin(elapsed * 5);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(hx, hy, 0.9 + pulse * 0.5, 0, Math.PI * 2);
  ctx.fill();
});

defineExpose({ buildLines });
</script>
