<template>
  <!-- renderless -->
</template>

<script setup>
import { frame, MONITOR_PROPS, usePoll } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

usePoll({
  url: "/api/monitor/hackatime",
  intervalMs: 1000 * 60 * 10,
  titleFor: (d) => `${d?.heartbeats ?? "400gb+"} heartbeats`,
  emit,
});

const buildLines = frame(props, (ctx, l, elapsed) => {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.05;
  ctx.beginPath();
  for (let x = 0; x < l.cols; x += 1) {
    const n = x / l.cols;
    const beat = Math.pow(Math.max(0, Math.sin((n * 4 - elapsed * 1.35) * Math.PI * 2)), 14);
    const small = Math.sin(n * 42 + elapsed * 5) * 1.3;
    const y = l.rows * 0.43 - beat * l.rows * 0.28 + small;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const bars = 19;
  for (let i = 0; i < bars; i += 1) {
    const h = 3 + ((Math.sin(elapsed * 1.8 + i * 1.7) + 1) / 2) * l.rows * 0.24;
    const x = l.cols * 0.14 + i * ((l.cols * 0.72) / bars);
    ctx.fillStyle = i % 4 === 0 ? "#ffffff" : "#777777";
    ctx.fillRect(x, l.rows * 0.84 - h, 1.45, h);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "5px monospace";
  ctx.fillText("HACKATIME", l.cols * 0.31, l.rows * 0.17);
});

defineExpose({ buildLines });
</script>
