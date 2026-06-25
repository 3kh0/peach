<template>
  <!-- renderless -->
</template>

<script setup>
import { frame, MONITOR_PROPS, usePoll } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const stats = usePoll({
  url: "/api/monitor/github",
  intervalMs: 1000 * 60 * 5,
  titleFor: (d) => {
    if (d?.publicRepos && d?.followers) return `${d.publicRepos} repos / ${d.followers} followers`;
    if (d?.publicRepos) return `${d.publicRepos} public repos`;
    return "github.com/3kh0";
  },
  emit,
});

const buildLines = frame(props, (ctx, l, elapsed) => {
  const cols = 17;
  const rows = 7;
  const gap = 1.05;
  const size = Math.max(1.1, Math.min(l.cols / 28, l.rows / 14));
  const gridW = cols * (size + gap);
  const gridH = rows * (size + gap);
  const startX = (l.cols - gridW) / 2;
  const startY = (l.rows - gridH) / 2;
  const repoBias = Math.min(8, Math.max(2, Math.round((stats.value?.publicRepos ?? 42) / 12)));

  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const wave = Math.sin(elapsed * 2.2 + c * 0.72 + r * 0.46);
      const hash = ((c * 928371 + r * 68917 + repoBias * 1299721) >>> 0) % 7;
      const lit = wave + hash / 4.5 > 0.72;
      ctx.fillStyle = lit ? "#ffffff" : hash > 4 ? "#777777" : "#2b2b2b";
      ctx.fillRect(startX + c * (size + gap), startY + r * (size + gap), size, size);
    }
  }

  ctx.strokeStyle = "#8a8a8a";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(l.cols / 2, startY - 5, 3.5, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "5px monospace";
  ctx.fillText("3kh0", l.cols / 2 - 6, startY + gridH + 9);
});

defineExpose({ buildLines });
</script>
