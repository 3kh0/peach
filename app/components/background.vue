<template>
  <div
    aria-hidden="true"
    data-allow-mismatch="children"
    class="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    style="
      background:
        radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.04), transparent 32%),
        radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.025), transparent 40%), #080808;
    "
  >
    <svg
      data-allow-mismatch="children"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      shape-rendering="geometricPrecision"
      class="absolute inset-[-4%] h-[108%] w-[108%] origin-center rotate-[-7deg] scale-[1.08] opacity-[0.96]"
    >
      <polygon
        v-for="cell in cells"
        :key="cell.id"
        class="fracture-cell"
        :points="cell.points"
        :style="{
          fill: cell.fill,
          stroke: cell.stroke,
          strokeWidth,
          vectorEffect: 'non-scaling-stroke',
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        }"
      />
    </svg>

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
import { onMounted, ref } from "vue";
import { clamp } from "./monitor/utils.js";

type Point = {
  x: number;
  y: number;
};

type CellDescriptor = {
  id: string;
  points: string;
  fill: string;
  stroke: string;
};

const DEFAULT_PLANE = {
  width: 1600,
  height: 1000,
};

const backgroundSeed = useState<number>("background-seed", createSeed);
const cells = ref<CellDescriptor[]>(
  safeBuildPlane(DEFAULT_PLANE.width, DEFAULT_PLANE.height, backgroundSeed.value),
);
const strokeWidth = ref("0.75px");

// buildPlane runs during SSR on every request and is driven by a random seed,
// so a single bad seed must never be allowed to crash the whole homepage render.
// Fall back to an empty plane (the gradient backdrop still renders) and log it.
function safeBuildPlane(width: number, height: number, seed: number) {
  try {
    return buildPlane(width, height, seed);
  } catch (error) {
    reportError("background:buildPlane", error, { width, height, seed });
    return [];
  }
}

function createSeed() {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] || Math.floor(Math.random() * 0xffffffff);
  }

  return Math.floor(Math.random() * 0xffffffff);
}

function mulberry32(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRowPoints(row: number, rowCount: number, width: number, rand: () => number) {
  const edge = row === 0 || row === rowCount;
  const n = clamp(clamp(Math.round(width / 215), 4, 10) - 1 + Math.floor(rand() * 3), 3, 11);
  const steps = Array.from({ length: n }, () => 0.9 + rand() * 2.4);
  const total = steps.reduce((s, v) => s + v, 0);
  const yBase = (row / rowCount) * 100;
  const yj = edge ? 0 : (rand() - 0.5) * (4.5 + rand() * 3.5);
  const pts: Point[] = [{ x: 0, y: yBase }];

  let progress = 0;
  for (const step of steps) {
    progress += step;
    const nx = (progress / total) * 100;
    const xj = (rand() - 0.5) * (2.5 + rand() * 6) * (0.55 + (Math.abs(nx - 50) / 50) * 0.7);
    pts.push({ x: clamp(nx + xj, 0, 100), y: clamp(yBase + yj + (rand() - 0.5) * 2.8, 0, 100) });
  }
  pts.push({ x: 100, y: yBase });

  return pts
    .sort((a, b) => a.x - b.x)
    .map((p, i, arr) => {
      const end = i === 0 || i === arr.length - 1;
      return { x: i === 0 ? 0 : i === arr.length - 1 ? 100 : p.x, y: end ? yBase : p.y };
    });
}

function buildPlane(width: number, height: number, seed: number) {
  const rand = mulberry32(seed + Math.floor(width / 40) * 19 + Math.floor(height / 40) * 31);
  const rows = clamp(Math.ceil(height / 145), 5, 10);
  const grid: Point[][] = [];
  for (let row = 0; row <= rows; row += 1) grid.push(createRowPoints(row, rows, width, rand));

  const cells: CellDescriptor[] = [];
  for (let row = 0; row < rows; row += 1) {
    const top = grid[row];
    const bot = grid[row + 1];
    if (!top || !bot) continue;

    let ti = 0,
      bi = 0,
      n = 0;
    while (ti < top.length - 1 || bi < bot.length - 1) {
      const tp = top[ti];
      const nt = top[ti + 1];
      const bp = bot[bi];
      const nb = bot[bi + 1];
      if (!tp || !bp) break;

      let poly: Point[] | null = null;
      if (nt && nb && rand() > 0.38) {
        poly = [tp, nt, nb, bp];
        ti += 1;
        bi += 1;
      } else if (ti >= top.length - 1 && nb) {
        poly = [tp, bp, nb];
        bi += 1;
      } else if (bi >= bot.length - 1 && nt) {
        poly = [tp, nt, bp];
        ti += 1;
      } else if (nt && nb) {
        if (nt.x + rand() * 5 < nb.x + rand() * 5) {
          poly = [tp, nt, bp];
          ti += 1;
        } else {
          poly = [tp, bp, nb];
          bi += 1;
        }
      }
      if (!poly) break;

      cells.push({
        id: `${row}-${n}`,
        points: poly.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" "),
        fill: `rgba(255, 255, 255, ${(rand() * 0.01).toFixed(3)})`,
        stroke: `rgba(188, 188, 188, ${(0.19 + rand() * 0.11).toFixed(3)})`,
      });
      n += 1;
    }
  }
  return cells;
}

function updateStrokeWidth() {
  const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);
  strokeWidth.value = `${(1 / pixelRatio).toFixed(3)}px`;
}

onMounted(() => {
  updateStrokeWidth();
});
</script>
