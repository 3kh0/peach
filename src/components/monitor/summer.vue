<template>
  <!-- renderless -->
</template>

<script setup>
import { frame, MONITOR_PROPS, usePoll } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

usePoll({
  url: "/api/monitor/summer",
  intervalMs: 1000 * 60 * 10,
  titleFor: (d) => `${d?.teens ?? "20k+"} teens shipping code`,
  emit,
});

const buildLines = frame(props, (ctx, l, elapsed) => {
  const lanes = [0.3, 0.48, 0.66];
  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 0.8;
  lanes.forEach((lane) => {
    const y = lane * l.rows;
    ctx.beginPath();
    ctx.moveTo(l.cols * 0.08, y);
    ctx.lineTo(l.cols * 0.92, y);
    ctx.stroke();
  });

  for (let i = 0; i < 9; i += 1) {
    const lane = lanes[i % lanes.length];
    const t = (elapsed * (0.1 + (i % 3) * 0.025) + i * 0.19) % 1;
    const x = (0.08 + t * 0.84) * l.cols;
    const y = lane * l.rows - 2.5 + Math.sin(elapsed * 2 + i) * 1.2;
    ctx.fillStyle = i % 3 === 0 ? "#ffffff" : "#9b9b9b";
    ctx.fillRect(x - 2.5, y - 1.5, 5, 3);
    ctx.fillStyle = "#4f4f4f";
    ctx.fillRect(x - 1.2, y - 0.4, 2.4, 0.8);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "5px monospace";
  ctx.fillText("SHIP", l.cols * 0.4, l.rows * 0.18);
  ctx.fillText("20K+", l.cols * 0.39, l.rows * 0.82);
});

defineExpose({ buildLines });
</script>
