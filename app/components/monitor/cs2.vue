<template>
  <!-- renderless -->
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import { frame, MONITOR_PROPS, usePoll } from "./utils";
import logoUrl from "../../assets/img/cs.png";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const numFmt = new Intl.NumberFormat("en-US");

usePoll({
  url: "/api/monitor/cs2",
  intervalMs: 1000 * 60 * 30,
  titleFor: (d) => {
    const n = Number(d?.players);
    return Number.isFinite(n) ? `${numFmt.format(n)} monthly players` : "fetching monthly players";
  },
  emit,
});

let logo = null;

const buildLines = frame(
  props,
  (ctx, l, elapsed) => {
    if (!logo?.complete || !logo.naturalWidth) return false;

    const baseW = l.cols * 0.78;
    const ar = logo.naturalWidth / logo.naturalHeight;
    const baseH = Math.min(l.rows * 0.5, baseW / ar);
    const drawW = baseH * ar;
    const scale = 0.94 + Math.sin(elapsed * 1.3) * 0.04;

    ctx.clearRect(0, 0, l.cols, l.rows);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(
      l.cols / 2 + Math.sin(elapsed * 0.9) * l.cols * 0.05,
      l.rows / 2 + Math.cos(elapsed * 1.1) * l.rows * 0.06,
    );
    ctx.rotate(elapsed * 0.58 + Math.sin(elapsed * 0.7) * 0.18);
    ctx.scale(scale, scale);
    ctx.drawImage(logo, -drawW / 2, -baseH / 2, drawW, baseH);
    ctx.restore();
  },
  { fill: false },
);

defineExpose({ buildLines });

onMounted(() => {
  logo = new Image();
  logo.decoding = "async";
  logo.src = logoUrl;
});
onBeforeUnmount(() => {
  logo = null;
});
</script>
