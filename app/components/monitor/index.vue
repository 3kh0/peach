<template>
  <div
    :data-screen="screen"
    data-allow-mismatch="children"
    class="monitor-shell w-full overflow-hidden border border-white/15 bg-black shadow-[0_16px_48px_rgba(0,0,0,0.32)]"
  >
    <div class="flex flex-col">
      <div
        class="flex h-8 shrink-0 items-center justify-between border-b border-white/12 bg-white/4.5 px-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white/62"
      >
        <div class="flex items-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span>{{ screen }}</span>
        </div>

        <span class="overflow-hidden whitespace-pre pl-4 text-right" data-allow-mismatch="text">{{
          displayTitle
        }}</span>
      </div>

      <div class="aspect-square w-full">
        <canvas ref="canvas" class="block size-full" />
      </div>
    </div>

    <component
      :is="screenComponent"
      ref="active"
      :layout="layout"
      :sample-context="sampleContext"
      @title="onTitle"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { reportError } from "~/utils/report-error";
import { ASCII_COLOR, ASCII_RAMP, clamp } from "./utils";

const screens = Object.fromEntries(
  Object.entries(import.meta.glob("./*.vue", { eager: true })).map(([p, m]) => [
    p.slice(2, -4),
    m.default,
  ]),
);

const props = defineProps({
  screen: { type: String, required: true },
});

const canvas = ref(null);
const active = ref(null);
const displayTitle = ref("");
const layout = shallowRef(null);
const sampleContext = shallowRef(null);

const screenComponent = computed(() => screens[props.screen]);

let frame = 0,
  observer = null,
  ctx = null,
  started = 0,
  mq = null,
  reduced = false;

let lastLines = [],
  prevLines = null,
  prevLinesAt = 0,
  prevLinesDuration = 650;
const PANEL_TRANSITION_MS = 650;

let titleRaf = 0,
  titleStart = 0,
  titleFrom = "",
  titleTo = "",
  pendingOdometer = false;
const ODO_STAGGER = 22;
const ODO_CELL_DURATION = 260;
const ODO_CYCLE_CHARS = ASCII_RAMP.slice(1) + "abcdefghijklmnopqrstuvwxyz0123456789";

function syncSize() {
  const c = canvas.value;
  if (!c) return;

  const w = c.clientWidth;
  const h = c.clientHeight;
  if (!w || !h) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = "top";
  ctx.imageSmoothingEnabled = false;

  const rows = clamp(Math.floor(h / 8), 32, 56);
  const lineHeight = h / rows;
  const fontSize = lineHeight * 0.92;
  ctx.font = `${fontSize}px "Courier New", monospace`;
  const charWidth = ctx.measureText("0").width || fontSize * 0.61;
  const cols = clamp(Math.floor((w + charWidth * 0.35) / charWidth), 56, 96);

  layout.value = {
    cols,
    rows,
    fontSize,
    lineHeight,
    paddingX: (w - cols * charWidth) / 2,
    paddingY: Math.max(0, (h - rows * lineHeight) / 2),
    width: w,
    height: h,
  };

  const sc = sampleContext.value;
  if (sc) {
    sc.canvas.width = cols;
    sc.canvas.height = rows;
    sc.imageSmoothingEnabled = false;
  }
}

function buildNoise(rows, cols) {
  const ramp = ASCII_RAMP.slice(1);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ramp[Math.floor(Math.random() * ramp.length)]).join(""),
  );
}

function dissolveLines(from, to, t) {
  const rows = Math.max(from.length, to.length);
  const out = [];
  for (let i = 0; i < rows; i++) {
    const a = from[i] || "",
      b = to[i] || "";
    const cols = Math.max(a.length, b.length);
    let line = "";
    for (let j = 0; j < cols; j++) {
      const threshold = ((((i * 73856093) ^ (j * 19349663)) >>> 0) % 1000) / 1000;
      line += (t > threshold ? b[j] : a[j]) || " ";
    }
    out.push(line);
  }
  return out;
}

function drawLines(lines) {
  if (!ctx || !layout.value) return;
  const l = layout.value;
  let displayed = lines;

  if (prevLines) {
    const t = clamp((performance.now() - prevLinesAt) / prevLinesDuration, 0, 1);
    displayed = dissolveLines(prevLines, lines, t);
    if (t >= 1) prevLines = null;
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, l.width, l.height);
  ctx.fillStyle = ASCII_COLOR;
  ctx.font = `${l.fontSize}px "Courier New", monospace`;

  displayed.forEach((line, i) => ctx.fillText(line, l.paddingX, l.paddingY + i * l.lineHeight));
}

function startTransition(lines, duration) {
  prevLines = lines;
  prevLinesAt = performance.now();
  prevLinesDuration = duration;
}

function elapsed() {
  if (!started) started = performance.now();
  return (performance.now() - started) / 1000;
}

const shouldAnimate = () => !reduced || prevLines !== null;

function drawFrame() {
  let lines;
  try {
    lines = active.value?.buildLines(elapsed()) ?? [];
  } catch (error) {
    // A throw in a single screen's draw routine must not freeze the loop or
    // bubble up and take down the page — keep the last good frame and log it.
    reportError("monitor:buildLines", error, { screen: props.screen });
    lines = lastLines;
  }
  drawLines(lines);
  lastLines = lines;
}

function loop() {
  drawFrame();
  frame = shouldAnimate() ? window.requestAnimationFrame(loop) : 0;
}

function stop() {
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
}

function sync() {
  if (!layout.value) return;
  stop();
  drawFrame();
  if (shouldAnimate()) frame = window.requestAnimationFrame(loop);
}

function onMotionChange(e) {
  reduced = e.matches;
  sync();
}

function animateTitle(next) {
  if (titleRaf) cancelAnimationFrame(titleRaf);
  const len = Math.max(displayTitle.value.length, next.length);
  titleFrom = displayTitle.value.padStart(len, " ");
  titleTo = next.padStart(len, " ");
  titleStart = performance.now();

  function step() {
    const now = performance.now() - titleStart;
    let out = "";
    let done = true;
    for (let i = 0; i < titleTo.length; i++) {
      const cellStart = i * ODO_STAGGER;
      const from = titleFrom[i] ?? " ";
      const to = titleTo[i] ?? " ";
      if (now < cellStart) {
        out += from;
        done = false;
      } else if (now >= cellStart + ODO_CELL_DURATION) {
        out += to;
      } else if (from === " " && to === " ") {
        out += " ";
      } else {
        out += ODO_CYCLE_CHARS[Math.floor(Math.random() * ODO_CYCLE_CHARS.length)];
        done = false;
      }
    }
    displayTitle.value = out;
    if (done) {
      titleRaf = 0;
      displayTitle.value = titleTo.trimStart();
    } else {
      titleRaf = requestAnimationFrame(step);
    }
  }
  step();
}

function onTitle(value) {
  if (pendingOdometer) {
    pendingOdometer = false;
    animateTitle(value);
  } else if (titleRaf) {
    titleTo = value.padStart(titleTo.length, " ");
  } else {
    displayTitle.value = value;
  }
}

onMounted(() => {
  if (!canvas.value) return;

  sampleContext.value = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });

  syncSize();

  mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced = mq.matches;
  mq.addEventListener("change", onMotionChange);

  if (!reduced && layout.value)
    startTransition(buildNoise(layout.value.rows, layout.value.cols), 1150);

  observer = new ResizeObserver(() => {
    syncSize();
    sync();
  });
  observer.observe(canvas.value);

  sync();
});

watch(
  () => props.screen,
  () => {
    if (lastLines.length) startTransition(lastLines, PANEL_TRANSITION_MS);
    pendingOdometer = true;
    sync();
  },
);

onBeforeUnmount(() => {
  stop();
  if (titleRaf) cancelAnimationFrame(titleRaf);
  observer?.disconnect();
  mq?.removeEventListener("change", onMotionChange);
});
</script>

<style scoped>
.monitor-shell {
  animation: monitor-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes monitor-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }
}

@media (prefers-reduced-motion: reduce) {
  .monitor-shell {
    animation: none;
  }
}
</style>
