<template>
  <!-- renderless -->
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import { MONITOR_PROPS, readSampleLines } from "./utils";
import qrUrl from "../../assets/img/signal-qr.png";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const NOISE = "01<>{}[]/\\#@$%&*+=-?!~^|:;";
const CYCLE = 8.0;
const SCRAMBLE_BASE = 0.55;
const SCRAMBLE_SPREAD = 1.6;
const HOLD = 4.5;
const FLICKER_HZ = 14;

let lockMask = null;
let qrMask = null;
let lastDims = null;
let qr = null;

function renderLock(l) {
  const ctx = props.sampleContext;
  const { cols, rows, width, height } = l;
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cols, rows);

  const aspect = height / rows / (width / cols); // ~1.78 — cells taller than wide

  // dimensions are in canvas pixels (1 px = 1 ascii cell);
  // y-axis must be squashed by `aspect` so shapes look proportional.
  const bodyW = cols * 0.52;
  const bodyH = (bodyW / aspect) * 1.08;
  const cornerR = bodyW * 0.08;

  const shackleW = bodyW * 0.62;
  const shackleH = (shackleW / aspect) * 0.95;
  const shackleThick = Math.max(3, bodyW * 0.14);

  const totalH = bodyH + shackleH - shackleThick * 0.45;
  const top = (rows - totalH) / 2;
  const cx = cols / 2;
  const bodyTop = top + shackleH - shackleThick * 0.45;
  const shackleCY = top + shackleH / 2;

  const shadowOff = Math.max(1.5, bodyW * 0.045);

  // ── drop shadow (offset bottom-right) ─────────────────────────────
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.roundRect(cx - bodyW / 2 + shadowOff, bodyTop + shadowOff, bodyW, bodyH, cornerR);
  ctx.fill();

  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = shackleThick;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(
    cx + shadowOff,
    shackleCY + shadowOff,
    shackleW / 2,
    shackleH / 2,
    0,
    Math.PI,
    2 * Math.PI,
    false,
  );
  ctx.stroke();

  // ── shackle (front) ───────────────────────────────────────────────
  // outer dim ring
  ctx.strokeStyle = "#9e9e9e";
  ctx.lineWidth = shackleThick;
  ctx.beginPath();
  ctx.ellipse(cx, shackleCY, shackleW / 2, shackleH / 2, 0, Math.PI, 2 * Math.PI, false);
  ctx.stroke();

  // inner highlight ring (offset up-left for 3D tube look)
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = shackleThick * 0.42;
  ctx.beginPath();
  ctx.ellipse(
    cx - shackleThick * 0.2,
    shackleCY - shackleThick * 0.2,
    shackleW / 2,
    shackleH / 2,
    0,
    Math.PI,
    2 * Math.PI,
    false,
  );
  ctx.stroke();

  // ── body (front) ──────────────────────────────────────────────────
  // diagonal gradient: bright top-left → mid bottom-right
  const grad = ctx.createLinearGradient(cx - bodyW / 2, bodyTop, cx + bodyW / 2, bodyTop + bodyH);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.55, "#dadada");
  grad.addColorStop(1, "#5e5e5e");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(cx - bodyW / 2, bodyTop, bodyW, bodyH, cornerR);
  ctx.fill();

  // top highlight strip
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.roundRect(
    cx - bodyW / 2 + cornerR * 0.6,
    bodyTop + cornerR * 0.45,
    bodyW - cornerR * 1.2,
    bodyH * 0.13,
    cornerR * 0.5,
  );
  ctx.fill();

  // ── keyhole ───────────────────────────────────────────────────────
  const khR = bodyW * 0.085;
  const khCY = bodyTop + bodyH * 0.42;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, khCY, khR, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillRect(cx - khR * 0.42, khCY, khR * 0.84, bodyH * 0.3);

  lockMask = readSampleLines(ctx, cols, rows);
  lastDims = { cols, rows };
}

function renderQr(l) {
  const ctx = props.sampleContext;
  const { cols, rows, width, height } = l;
  if (!ctx || !qr?.complete || !qr.naturalWidth) return;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cols, rows);

  const ratio = height / rows / (width / cols);
  let dispH = rows * 0.56;
  let dispW = dispH / ratio;
  if (dispW > cols * 0.56) {
    dispW = cols * 0.56;
    dispH = dispW * ratio;
  }

  ctx.drawImage(qr, (cols - dispW) / 2, (rows - dispH) / 2, dispW, dispH);
  qrMask = readSampleLines(ctx, cols, rows);
}

function buildLines(elapsed) {
  const l = props.layout;
  if (!l) return [];
  const { cols, rows } = l;

  if (!lockMask || !lastDims || lastDims.cols !== cols || lastDims.rows !== rows) {
    renderLock(l);
    qrMask = null;
  }
  if (!qrMask && qr?.complete && qr.naturalWidth) renderQr(l);
  if (!lockMask) return [];

  const t = elapsed % CYCLE;
  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const ch = lockMask[r][c];
      if (ch === " ") {
        const qrCh = qrMask?.[r]?.[c] ?? " ";
        line += t > 2.8 && t < 5.8 && qrCh !== " " ? qrCh : " ";
        continue;
      }
      const h = ((r * 73856093) ^ (c * 19349663)) >>> 0;
      const settleAt = SCRAMBLE_BASE + ((h % 1000) / 1000) * SCRAMBLE_SPREAD;
      const rescatterAt = settleAt + HOLD;
      const scrambled = t < settleAt || t >= rescatterAt;
      if (scrambled) {
        const idx = (Math.floor(elapsed * FLICKER_HZ) + h) % NOISE.length;
        line += NOISE[idx];
      } else if (qrMask?.[r]?.[c] && qrMask[r][c] !== " " && t > 3.1 && t < 5.4) {
        line += (h + Math.floor(elapsed * 12)) % 4 === 0 ? qrMask[r][c] : ch;
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
  emit("title", "echo.99");
  qr = new Image();
  qr.decoding = "async";
  qr.src = qrUrl;
});

onBeforeUnmount(() => {
  lockMask = null;
  qrMask = null;
  lastDims = null;
  qr = null;
});
</script>
