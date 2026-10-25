<template>
  <!-- renderless -->
</template>

<script setup>
import { frame, MONITOR_PROPS, useTitle } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const SPEED = 0.28; // full traversals per second

const buildLines = frame(props, (ctx, l, elapsed) => {
  const t = (elapsed * SPEED) % 1;
  // overshoot the edges so the plane enters/leaves cleanly
  const px = -0.18 + t * 1.36;
  const py = 0.5 + Math.sin(t * Math.PI * 2) * 0.22;

  const cx = px * l.cols;
  const cy = py * l.rows;

  // tilt the nose along the velocity vector
  const dx = 1.36 * l.cols;
  const dy = 0.22 * Math.PI * 2 * Math.cos(t * Math.PI * 2) * l.rows;
  const angle = Math.atan2(dy, dx) * 0.7;

  const size = Math.min(l.cols, l.rows) * 0.34;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // upper half of the paper airplane (bright)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size, -size * 0.62);
  ctx.lineTo(-size * 0.38, 0);
  ctx.closePath();
  ctx.fill();

  // lower half (dimmer, so the center fold is readable in ascii)
  ctx.fillStyle = "#7a7a7a";
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.38, 0);
  ctx.lineTo(-size, size * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
});

defineExpose({ buildLines });
useTitle(emit, "@doober");
</script>
