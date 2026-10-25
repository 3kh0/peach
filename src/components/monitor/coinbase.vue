<template>
  <!-- renderless -->
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import { frame, MONITOR_PROPS, usePoll } from "./utils";
import logoUrl from "../../assets/img/cb.png";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const SPIN_BUFFER = 256;
const SPIN_SPEED = 2.4;
const priceFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const ticker = usePoll({
  url: "/api/monitor/coinbase",
  intervalMs: 1000 * 45,
  titleFor: (d) => {
    const p = Number(d?.price);
    return Number.isFinite(p)
      ? `COINBASE BTC/USD $${priceFmt.format(p)}`
      : "BTC/USD ticker offline";
  },
  emit,
});

let logo = null;
let spinCanvas = null;
let spinCtx = null;

const buildLines = frame(
  props,
  (ctx, l, elapsed) => {
    if (!logo?.complete || !logo.naturalWidth) return false;

    // 1. spin the square logo on a square buffer so the rotation stays uniform
    spinCtx.clearRect(0, 0, SPIN_BUFFER, SPIN_BUFFER);
    spinCtx.save();
    spinCtx.translate(SPIN_BUFFER / 2, SPIN_BUFFER / 2);
    spinCtx.rotate(elapsed * SPIN_SPEED);
    spinCtx.drawImage(logo, -SPIN_BUFFER / 2, -SPIN_BUFFER / 2, SPIN_BUFFER, SPIN_BUFFER);
    spinCtx.restore();

    // 2. composite into the sample canvas, stretching width to compensate for tall cells
    // so the square buffer appears square on screen
    const cellW = l.width / l.cols;
    const cellH = l.height / l.rows;
    const screenRatio = cellH / cellW; // > 1 since cells are taller than wide

    let sampleH = l.rows * 0.92;
    let sampleW = sampleH * screenRatio;
    if (sampleW > l.cols * 0.92) {
      sampleW = l.cols * 0.92;
      sampleH = sampleW / screenRatio;
    }

    ctx.clearRect(0, 0, l.cols, l.rows);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(spinCanvas, (l.cols - sampleW) / 2, (l.rows - sampleH) / 2, sampleW, sampleH);
  },
  { fill: false },
);

defineExpose({ buildLines });

onMounted(() => {
  spinCanvas = document.createElement("canvas");
  spinCanvas.width = SPIN_BUFFER;
  spinCanvas.height = SPIN_BUFFER;
  spinCtx = spinCanvas.getContext("2d");
  spinCtx.imageSmoothingEnabled = true;

  logo = new Image();
  logo.decoding = "async";
  logo.src = logoUrl;
});
onBeforeUnmount(() => {
  logo = null;
  spinCanvas = null;
  spinCtx = null;
});
</script>
