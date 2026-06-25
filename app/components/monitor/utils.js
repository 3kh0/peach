import { onBeforeUnmount, onMounted, ref } from "vue";

export const ASCII_RAMP = " .,:;ox%#@";
export const ASCII_COLOR = "#d7d7d7";
export const SAMPLE_SIZE = 128;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const randomBetween = (min, max) => min + Math.random() * (max - min);

export function readSampleLines(ctx, cols, rows) {
  const { data } = ctx.getImageData(0, 0, cols, rows);
  const last = ASCII_RAMP.length - 1;
  const lines = [];
  for (let row = 0; row < rows; row += 1) {
    let line = "";
    for (let col = 0; col < cols; col += 1) {
      const i = (row * cols + col) * 4;
      const lum = (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255;
      const n = clamp(lum * (data[i + 3] / 255), 0, 1);
      line += ASCII_RAMP[Math.min(last, Math.floor(n * last))];
    }
    lines.push(line);
  }
  return lines;
}

export const MONITOR_PROPS = {
  layout: { type: Object, default: null },
  sampleContext: { type: Object, default: null },
};

export const frame =
  (props, draw, { fill = true } = {}) =>
  (elapsed) => {
    const ctx = props.sampleContext;
    const l = props.layout;
    if (!ctx || !l) return [];
    if (fill) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, l.cols, l.rows);
    }
    if (draw(ctx, l, elapsed) === false) return [];
    return readSampleLines(ctx, l.cols, l.rows);
  };

export const useTitle = (emit, title) => onMounted(() => emit("title", title));

export function usePoll({ url, intervalMs, titleFor, emit }) {
  const data = ref(null);
  let active = false;
  let timer = 0;

  const tick = async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`monitor api returned ${res.status}`);
      data.value = await res.json();
    } catch {
      data.value = null;
    }
    emit("title", titleFor(data.value));
    if (!active) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(tick, intervalMs);
  };

  onMounted(() => {
    active = true;
    emit("title", titleFor(data.value));
    tick();
  });
  onBeforeUnmount(() => {
    active = false;
    window.clearTimeout(timer);
  });

  return data;
}
