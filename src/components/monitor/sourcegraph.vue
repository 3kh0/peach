<template>
  <!-- renderless -->
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import { MONITOR_PROPS, readSampleLines } from "./utils";
import logoUrl from "../../assets/img/sg.svg";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const NOISE = "01<>{}[]/\\@#$%&*+=-?!~^|:;";
const SWEEP_PERIOD = 3.4;
const TRAIL_LEN = 14;
const HEAD_HALFWIDTH = 1;
const BEAM_CHAR = "@";

let logo = null;
let logoMask = null;
let lastDims = null;

function renderLogo(l) {
  const ctx = props.sampleContext;
  const { cols, rows, width, height } = l;
  if (!ctx || !logo?.complete || !logo.naturalWidth) return;

  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cols, rows);

  const ratio = height / rows / (width / cols);

  let dispH = rows * 0.78;
  let dispW = dispH * ratio;
  if (dispW > cols * 0.78) {
    dispW = cols * 0.78;
    dispH = dispW / ratio;
  }

  ctx.drawImage(logo, (cols - dispW) / 2, (rows - dispH) / 2, dispW, dispH);
  logoMask = readSampleLines(ctx, cols, rows);
  lastDims = { cols, rows };
}

function buildLines(elapsed) {
  const l = props.layout;
  if (!l) return [];
  const { cols, rows } = l;

  if (!logoMask || !lastDims || lastDims.cols !== cols || lastDims.rows !== rows) {
    renderLogo(l);
  }
  if (!logoMask) return [];

  const t = elapsed % SWEEP_PERIOD;
  // overshoot edges so the beam enters/exits the frame cleanly
  const sweepX = (t / SWEEP_PERIOD) * (cols + 24) - 12;
  const flickerSeed = Math.floor(elapsed * 18);

  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const ch = logoMask[r][c];
      if (ch === " ") {
        const ray = (c + r * 2 + Math.floor(elapsed * 16)) % 29 === 0;
        const rail = Math.abs(c - sweepX + (r - rows / 2) * 0.38) < 0.7;
        line += ray || rail ? "." : " ";
        continue;
      }

      const d = sweepX - c;
      if (d >= -HEAD_HALFWIDTH && d <= HEAD_HALFWIDTH) {
        // bright vertical beam
        line += BEAM_CHAR;
      } else if (d > HEAD_HALFWIDTH && d <= HEAD_HALFWIDTH + TRAIL_LEN) {
        // glitchy trail that decays back to the original logo char
        const fade = (d - HEAD_HALFWIDTH) / TRAIL_LEN;
        const h = ((r * 73856093) ^ (c * 19349663) ^ (flickerSeed * 2654435761)) >>> 0;
        const noiseVal = (h % 1000) / 1000;
        line += noiseVal > fade ? NOISE[h % NOISE.length] : ch;
      } else {
        line += ch;
      }
    }
    lines.push(line);
  }
  return lines;
}

defineExpose({ buildLines });

onMounted(() => {
  emit("title", "scanning index");
  logo = new Image();
  logo.decoding = "async";
  logo.src = logoUrl;
});

onBeforeUnmount(() => {
  logo = null;
  logoMask = null;
  lastDims = null;
});
</script>
