<template>
  <!-- renderless -->
</template>

<script setup>
import { frame, MONITOR_PROPS, useTitle } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const buildLines = frame(props, (ctx, l, elapsed) => {
  const w = l.cols * 0.58;
  const h = l.rows * 0.36;
  const x = (l.cols - w) / 2;
  const y = l.rows * 0.37;
  const flap = Math.sin(elapsed * 2.4) * h * 0.09;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.1;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y + h * 0.48 + flap);
  ctx.lineTo(x + w, y);
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.38, y + h * 0.56);
  ctx.moveTo(x + w, y + h);
  ctx.lineTo(x + w * 0.62, y + h * 0.56);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const t = (elapsed * 0.34 + i * 0.2) % 1;
    const px = l.cols * (0.05 + t * 0.28);
    const py = y + h * (0.22 + (i % 3) * 0.2);
    ctx.fillStyle = i % 2 ? "#8a8a8a" : "#ffffff";
    ctx.fillRect(px, py, 3, 1.2);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "5px monospace";
  ctx.fillText("hello@3kh0.net", l.cols * 0.24, l.rows * 0.23);
});

defineExpose({ buildLines });
useTitle(emit, "hello@3kh0.net");
</script>
