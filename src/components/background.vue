<template>
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    style="
      background:
        radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.04), transparent 32%),
        radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.025), transparent 40%), #080808;
    "
  >
    <svg
      :id="FRACTURE_ID"
      ref="svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      shape-rendering="geometricPrecision"
      stroke-linejoin="round"
      stroke-linecap="round"
      class="fracture absolute inset-[-4%] h-[108%] w-[108%] origin-center rotate-[-7deg] scale-[1.08] opacity-[0.96]"
    ></svg>

    <div
      class="absolute inset-[-4%] h-[108%] w-[108%]"
      style="
        background:
          radial-gradient(
            circle at center,
            transparent 34%,
            rgba(0, 0, 0, 0.14) 70%,
            rgba(0, 0, 0, 0.42) 100%
          ),
          linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.2),
            transparent 22%,
            transparent 78%,
            rgba(0, 0, 0, 0.18)
          );
      "
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
import { renderFracture } from "../utils/fracture.js";
import { reportError } from "../utils/report-error";

// vite.config.ts inlines a script that draws into this id before hydration.
const FRACTURE_ID = "fracture";
const svg = useTemplateRef<SVGSVGElement>("svg");

onMounted(() => {
  const el = svg.value;
  if (!el || el.childElementCount > 0) return;
  try {
    renderFracture(el);
  } catch (error) {
    reportError("background:renderFracture", error);
  }
});
</script>

<style scoped>
.fracture :deep(polygon) {
  vector-effect: non-scaling-stroke;
}
</style>
