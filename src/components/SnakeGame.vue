<template>
  <div ref="screen" class="fixed inset-0 overflow-hidden bg-black" :data-phase="phase">
    <canvas
      ref="canvas"
      class="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 [image-rendering:pixelated]"
    />

    <div
      class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0)_0,rgba(0,0,0,0)_2px,rgba(0,0,0,0.22)_3px,rgba(0,0,0,0.22)_4px)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.7)_100%)]"
      aria-hidden="true"
    />

    <div
      v-if="phase === 'playing'"
      class="absolute inset-x-0 top-0 flex justify-between px-5 py-4 font-mono text-[13px] uppercase tracking-[0.18em] text-neutral-300"
    >
      <span>score {{ score }}</span>
      <span class="opacity-50">arrows / wasd · swipe</span>
    </div>

    <!-- idle + game over screens -->
    <div
      v-if="phase !== 'playing'"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center font-mono text-neutral-300"
    >
      <p
        class="text-[clamp(72px,18vw,168px)] font-bold leading-none tracking-wider text-neutral-100"
      >
        {{ code }}
      </p>
      <p class="max-w-md px-6 text-base uppercase tracking-[0.34em] text-neutral-400">
        {{ phase === "dead" ? "you crashed" : label }}
      </p>
      <p v-if="phase === 'dead'" class="text-sm tracking-[0.24em] text-neutral-400">
        score {{ score }}
      </p>
      <button
        type="button"
        class="mt-2 cursor-pointer rounded border border-white/25 bg-white/5 px-6.5 py-2.5 font-mono text-[15px] uppercase tracking-[0.22em] text-neutral-100 transition-colors hover:border-white/60 hover:bg-white/10"
        @click="startPlay"
      >
        {{ phase === "dead" ? "▶ play again" : "▶ play" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

type Pt = { x: number; y: number };
type Phase = "idle" | "playing" | "dead";

interface Snake {
  cells: Pt[]; // tail ... head (head is last)
  dir: Pt;
  nextDir: Pt;
  isPlayer: boolean;
  alive: boolean;
  grow: number;
  entering: boolean; // sliding in from a corner; off-screen cells don't collide
}

withDefaults(
  defineProps<{
    code?: string | number;
    label?: string;
  }>(),
  { code: 404, label: "this page was not found. want to play a game instead?" },
);

const CELL = 22; // px per grid cell — strict grid
const BASE_STEP = 88; // starting tick interval (ms)
const MIN_STEP = 42; // fastest the game will go
const AI_COUNT_DIVISOR = 150;
const AI_LEN = 9;
const PLAYER_LEN = 4;
const TURN_CHANCE = 0.14;

const canvas = ref<HTMLCanvasElement | null>(null);
const screen = ref<HTMLElement | null>(null);

const phase = ref<Phase>("idle");
const score = ref(0);

let ctx: CanvasRenderingContext2D | null = null;
let cols = 0;
let rows = 0;
let dpr = 1;

let snakes: Snake[] = [];
let food: Pt | null = null;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}
let particles: Particle[] = [];

let raf = 0;
let last = 0;
let acc = 0;
let observer: ResizeObserver | null = null;

const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };
const LEFT = { x: -1, y: 0 };
const RIGHT = { x: 1, y: 0 };

const inBounds = (c: Pt) => c.x >= 0 && c.y >= 0 && c.x < cols && c.y < rows;
const eq = (a: Pt, b: Pt) => a.x === b.x && a.y === b.y;
const opposite = (a: Pt, b: Pt) => a.x === -b.x && a.y === -b.y;
const key = (c: Pt) => c.y * cols + c.x;
const leftTurn = (d: Pt) => ({ x: d.y, y: -d.x });
const rightTurn = (d: Pt) => ({ x: -d.y, y: d.x });
const head = (s: Snake) => s.cells.at(-1)!;
const rnd = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const mkSnake = (cells: Pt[], dir: Pt, isPlayer: boolean, entering: boolean): Snake => ({
  cells,
  dir,
  nextDir: dir,
  isPlayer,
  alive: true,
  grow: 0,
  entering,
});

function buildBody(head: Pt, dir: Pt, len: number): Pt[] {
  const cells: Pt[] = [];
  for (let i = len - 1; i >= 0; i -= 1) {
    cells.push({ x: head.x - dir.x * i, y: head.y - dir.y * i });
  }
  return cells; // tail ... head
}

function occupied(excludeTails = false): Set<number> {
  const set = new Set<number>();
  for (const s of snakes) {
    if (!s.alive) continue;
    const skip = excludeTails ? 1 : 0;
    for (let i = skip; i < s.cells.length; i += 1) {
      const c = s.cells[i]!;
      if (inBounds(c)) set.add(key(c)); // off-screen (entering) cells don't collide
    }
  }
  return set;
}

// the two inward directions that meet at each corner
const CORNERS = [
  { base: () => ({ x: 0, y: 0 }), dirs: [RIGHT, DOWN] }, // top-left
  { base: () => ({ x: cols - 1, y: 0 }), dirs: [LEFT, DOWN] }, // top-right
  { base: () => ({ x: 0, y: rows - 1 }), dirs: [RIGHT, UP] }, // bottom-left
  { base: () => ({ x: cols - 1, y: rows - 1 }), dirs: [LEFT, UP] }, // bottom-right
];

function spawnAi(): Snake | null {
  const occ = occupied();
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const corner = rnd(CORNERS);
    const dir = rnd(corner.dirs);
    const lane = corner.dirs.find((d) => d !== dir)!;
    const offset = Math.floor(Math.random() * 4);
    const base = corner.base();
    const entry = { x: base.x + lane.x * offset, y: base.y + lane.y * offset };
    if (!inBounds(entry)) continue;

    const stagger = Math.floor(Math.random() * AI_LEN);
    const h = { x: entry.x - dir.x * (1 + stagger), y: entry.y - dir.y * (1 + stagger) };

    const lookahead = [entry, { x: entry.x + dir.x, y: entry.y + dir.y }];
    if (lookahead.every((c) => !occ.has(key(c))))
      return mkSnake(buildBody(h, dir, AI_LEN), dir, false, true);
  }
  return null;
}

function spawnPlayer(): Snake | null {
  const occ = occupied();
  const center = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
  const candidates: Pt[] = [center];
  for (let r = 1; r < Math.max(cols, rows); r += 1) {
    candidates.push({ x: center.x + r, y: center.y }, { x: center.x - r, y: center.y });
  }
  for (const h of candidates) {
    for (const dir of [RIGHT, LEFT, UP, DOWN]) {
      const body = buildBody(h, dir, PLAYER_LEN);
      const ahead = { x: h.x + dir.x * 3, y: h.y + dir.y * 3 };
      if (body.every((c) => inBounds(c) && !occ.has(key(c))) && inBounds(ahead))
        return mkSnake(body, dir, true, false);
    }
  }
  return null;
}

function placeFood() {
  const occ = occupied();
  const open: Pt[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const c = { x, y };
      if (!occ.has(key(c))) open.push(c);
    }
  }
  food = open.length ? rnd(open) : null;
}

function aiCount() {
  const base = Math.min(9, Math.max(4, Math.round((cols * rows) / AI_COUNT_DIVISOR)));
  const ramp = phase.value === "playing" ? Math.floor(score.value / 3) : 0;
  return Math.min(base + ramp, Math.floor((cols * rows) / 60));
}

function stepMs() {
  if (phase.value !== "playing") return BASE_STEP;
  return Math.max(MIN_STEP, BASE_STEP - score.value * 2.5);
}

function populateAi() {
  snakes = snakes.filter((s) => s.alive);
  const want = aiCount();
  let guard = 0;
  while (snakes.filter((s) => !s.isPlayer).length < want && guard < want * 4) {
    const s = spawnAi();
    if (s) snakes.push(s);
    guard += 1;
  }
}

function chooseAiDir(s: Snake, blocked: Set<number>) {
  const straight = s.dir;
  const h = head(s);
  const safe = [straight, leftTurn(straight), rightTurn(straight)].filter((d) => {
    const next = { x: h.x + d.x, y: h.y + d.y };
    return inBounds(next) && !blocked.has(key(next));
  });

  if (!safe.length) {
    s.alive = false;
    return;
  }

  const straightSafe = safe.some((d) => eq(d, straight));
  s.nextDir = straightSafe && Math.random() > TURN_CHANCE ? straight : rnd(safe);
}

function tick() {
  const blocked = occupied(true); // tails will vacate

  for (const s of snakes) {
    if (!s.alive || s.isPlayer || s.entering) continue;
    chooseAiDir(s, blocked);
  }

  // advance every alive snake
  for (const s of snakes) {
    if (!s.alive) continue;
    if (!opposite(s.nextDir, s.dir)) s.dir = s.nextDir;
    const h = head(s);
    s.cells.push({ x: h.x + s.dir.x, y: h.y + s.dir.y });
    if (s.grow > 0) s.grow -= 1;
    else s.cells.shift();
    if (s.entering && inBounds(head(s))) s.entering = false;
  }

  const bodyCells = new Map<number, Snake>();
  for (const s of snakes) {
    if (!s.alive) continue;
    for (let i = 0; i < s.cells.length - 1; i += 1) {
      const c = s.cells[i]!;
      if (inBounds(c)) bodyCells.set(key(c), s);
    }
  }

  for (const s of snakes) {
    if (!s.alive) continue;
    const h = head(s);

    if (!inBounds(h)) {
      if (!s.entering) s.alive = false;
      continue;
    }
    if (bodyCells.has(key(h))) {
      s.alive = false;
      continue;
    }
    for (const other of snakes) {
      if (other === s || !other.alive) continue;
      if (eq(h, head(other))) {
        s.alive = false;
        break;
      }
    }
  }

  const player = snakes.find((s) => s.isPlayer);
  if (player) {
    if (player.alive && food && eq(head(player), food)) {
      player.grow += 1;
      score.value += 1;
      placeFood();
      populateAi(); // ramp the swarm up as the score climbs
    }
    if (!player.alive && phase.value === "playing") {
      explode(head(player));
      phase.value = "dead";
      food = null;
    }
  }

  if (snakes.some((s) => !s.isPlayer && !s.alive)) populateAi();
}

function explode(cell: Pt) {
  const cx = (cell.x + 0.5) * CELL;
  const cy = (cell.y + 0.5) * CELL;
  const n = 28;
  for (let i = 0; i < n; i += 1) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.6;
    const speed = 0.06 + Math.random() * 0.24; // px per ms
    const life = 420 + Math.random() * 260;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      max: life,
    });
  }
}

function updateParticles(delta: number) {
  if (!particles.length) return;
  const friction = Math.pow(0.9, delta / 16);
  for (const p of particles) {
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vx *= friction;
    p.vy *= friction;
    p.life -= delta;
  }
  particles = particles.filter((p) => p.life > 0);
}

function cellRect(c: Pt, inset: number) {
  return [c.x * CELL + inset, c.y * CELL + inset, CELL - inset * 2, CELL - inset * 2] as const;
}

function draw() {
  if (!ctx) return;
  const w = cols * CELL;
  const h = rows * CELL;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= cols; x += 1) {
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, h);
  }
  for (let y = 0; y <= rows; y += 1) {
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(w, y * CELL + 0.5);
  }
  ctx.stroke();

  // food
  if (food) {
    ctx.fillStyle = "#f5f5f5";
    const [fx, fy, fw, fh] = cellRect(food, 5);
    ctx.fillRect(fx, fy, fw, fh);
  }

  // snakes
  for (const s of snakes) {
    const player = s.isPlayer;
    const len = s.cells.length;
    for (let i = 0; i < len; i += 1) {
      const isHead = i === len - 1;
      const t = len === 1 ? 1 : i / (len - 1);
      if (player) {
        ctx.fillStyle = isHead ? "#86efac" : `rgba(74, 222, 128, ${(0.45 + t * 0.45).toFixed(3)})`;
      } else {
        const dim = s.alive ? 1 : 0.4;
        ctx.fillStyle = isHead
          ? `rgba(190, 190, 190, ${(0.92 * dim).toFixed(3)})`
          : `rgba(120, 120, 120, ${((0.32 + t * 0.4) * dim).toFixed(3)})`;
      }
      const [x, y, cw, ch] = cellRect(s.cells[i]!, isHead ? 2 : 3);
      ctx.fillRect(x, y, cw, ch);
    }
  }

  // death particles
  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.fillStyle = `rgba(134, 239, 172, ${a.toFixed(3)})`;
    const size = 2 + a * 3;
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
  }
}

// --- loop -------------------------------------------------------------------

function frame(now: number) {
  if (!last) last = now;
  const delta = now - last;
  last = now;
  acc += delta;

  const step = stepMs();
  let steps = 0;
  while (acc >= step && steps < 4) {
    acc -= step;
    tick();
    steps += 1;
  }
  updateParticles(delta);
  draw();
  raf = window.requestAnimationFrame(frame);
}

// --- sizing -----------------------------------------------------------------

function resize() {
  const el = screen.value;
  const c = canvas.value;
  if (!el || !c) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cols = Math.max(10, Math.ceil(el.clientWidth / CELL));
  rows = Math.max(10, Math.ceil(el.clientHeight / CELL));

  c.width = Math.round(cols * CELL * dpr);
  c.height = Math.round(rows * CELL * dpr);
  c.style.width = `${cols * CELL}px`;
  c.style.height = `${rows * CELL}px`;

  ctx = c.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

  // anything off the new grid gets rebuilt
  snakes = snakes.filter(
    (s) => s.alive && (s.entering || s.cells.every((cell) => cell.x < cols && cell.y < rows)),
  );
  populateAi();
  if (phase.value === "playing" && (!food || food.x >= cols || food.y >= rows)) placeFood();
}

// --- input ------------------------------------------------------------------

function startPlay() {
  if (phase.value === "playing") return;
  snakes = snakes.filter((s) => !s.isPlayer);
  const p = spawnPlayer();
  if (!p) return;
  snakes.push(p);
  score.value = 0;
  placeFood();
  phase.value = "playing";
}

function steer(d: Pt) {
  if (phase.value !== "playing") return;
  const p = snakes.find((s) => s.isPlayer && s.alive);
  if (p && !opposite(d, p.dir)) p.nextDir = d;
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, Pt> = {
    ArrowUp: UP,
    ArrowDown: DOWN,
    ArrowLeft: LEFT,
    ArrowRight: RIGHT,
    w: UP,
    s: DOWN,
    a: LEFT,
    d: RIGHT,
  };
  const dir = map[e.key] ?? map[e.key.toLowerCase()];
  if (dir) {
    e.preventDefault();
    if (phase.value !== "playing") startPlay();
    steer(dir);
  } else if ((e.key === "Enter" || e.key === " ") && phase.value !== "playing") {
    e.preventDefault();
    startPlay();
  }
}

let touch: Pt | null = null;
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0];
  if (t) touch = { x: t.clientX, y: t.clientY };
}
function onTouchEnd(e: TouchEvent) {
  if (!touch) return;
  const t = e.changedTouches[0];
  if (!t) return;
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  touch = null;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
  steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? RIGHT : LEFT) : dy > 0 ? DOWN : UP);
}

onMounted(() => {
  resize();
  populateAi();
  observer = new ResizeObserver(resize);
  const el = screen.value;
  if (el) observer.observe(el);
  window.addEventListener("keydown", onKey);
  el?.addEventListener("touchstart", onTouchStart, { passive: true });
  el?.addEventListener("touchend", onTouchEnd, { passive: true });
  raf = window.requestAnimationFrame(frame);
});

onBeforeUnmount(() => {
  if (raf) window.cancelAnimationFrame(raf);
  observer?.disconnect();
  window.removeEventListener("keydown", onKey);
  const el = screen.value;
  el?.removeEventListener("touchstart", onTouchStart);
  el?.removeEventListener("touchend", onTouchEnd);
});
</script>
