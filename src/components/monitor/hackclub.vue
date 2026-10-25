<template>
  <!-- renderless -->
</template>

<script setup>
import { onMounted } from "vue";
import dinoUrl from "../../assets/img/dinobox.svg";
import { frame, MONITOR_PROPS, usePoll } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

usePoll({
  url: "/api/monitor/hackclub",
  intervalMs: 1000 * 60 * 10,
  titleFor: (d) =>
    d?.members ? `${d.members.toLocaleString()} members` : "worldwide teen hackers",
  emit,
});

let dinoCanvas = null;

const makeCanvas = (w, h) =>
  Object.assign(document.createElement("canvas"), { width: w, height: h });

function measureDino(img) {
  const N = 512;
  const tmp = makeCanvas(N, N);
  const tx = tmp.getContext("2d", { willReadFrequently: true });
  tx.drawImage(img, 0, 0, N, N);
  const { data } = tx.getImageData(0, 0, N, N);

  let minX = N,
    minY = N,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      if (data[(y * N + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return; // nothing drawn

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = makeCanvas(w, h);
  out.getContext("2d").drawImage(tmp, minX, minY, w, h, 0, 0, w, h);
  dinoCanvas = out;
}

const buildLines = frame(props, (ctx, l, elapsed) => {
  if (!dinoCanvas) return;
  const charW = (l.width - 2 * l.paddingX) / l.cols;
  const lh = l.lineHeight;
  const aspect = dinoCanvas.width / dinoCanvas.height;
  const panel = Math.min(l.cols * charW, l.rows * lh) * 0.98;
  const w = panel / Math.sqrt(1 + 1 / (aspect * aspect));
  const h = w / aspect;
  const a = elapsed * 0.9;
  const cos = Math.cos(a),
    sin = Math.sin(a);

  ctx.save();
  ctx.setTransform(cos / charW, sin / lh, -sin / charW, cos / lh, l.cols / 2, l.rows / 2);
  ctx.filter = "brightness(0) invert(1)";
  ctx.drawImage(dinoCanvas, -w / 2, -h / 2, w, h);
  ctx.restore();
});

defineExpose({ buildLines });

onMounted(() => {
  const img = new Image();
  img.onload = () => {
    try {
      measureDino(img);
    } catch {
      dinoCanvas = null;
    }
  };
  img.src = dinoUrl;
});
</script>
