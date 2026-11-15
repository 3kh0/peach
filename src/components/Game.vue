<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createGameAudio } from "../utils/game-audio";
import { createGameEngine, type GameEngine, type GamePhase } from "../utils/game-engine";

const mount = ref<HTMLElement | null>(null);
const phase = ref<GamePhase | "loading" | "error">("loading");
const mode = ref<"watch" | "player">("watch");
const score = ref(0);
const error = ref("");
const audio = createGameAudio();
const abort = new AbortController();
let engine: GameEngine | undefined;
let audioStarted = false;
let muted = false;

function enableAudio() {
  if (audioStarted) return;
  audioStarted = true;
  audio.warm();
  void audio.playMusic();
}

function startRun(nextMode: "watch" | "player", fresh = true) {
  if (!engine) return;
  (document.activeElement as HTMLElement | null)?.blur();
  mode.value = nextMode;
  audioStarted = false;
  engine.setAutoplay(nextMode === "watch");
  if (fresh) engine.reset();
  engine.start();
  phase.value = "running";
  if (nextMode === "player") enableAudio();
  else audio.pause();
  if (document.hidden) pause();
}

function act(to?: number) {
  if (!engine) return;
  if (mode.value === "watch") {
    startRun("player");
    if (to !== undefined) engine.turn(to);
  } else if (phase.value === "running") {
    enableAudio();
    engine.turn(to);
    void audio.effect("laneswitch", 0.42);
  } else if (phase.value === "dead") startRun("player");
  else if (phase.value === "paused") resume();
}

function pointer(event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary) return;
  if ((event.target as Element).closest("button, a")) return;
  event.preventDefault();
  act();
}

function pause() {
  if (phase.value !== "running") return;
  phase.value = "paused";
  engine?.pause();
  audio.pause();
}

function resume() {
  phase.value = "running";
  engine?.resume();
  if (mode.value === "player") audio.resume();
}

function focus() {
  if (!document.hidden && mode.value === "watch" && phase.value === "paused") resume();
}

function key(event: KeyboardEvent) {
  const k = event.key.toLowerCase();
  if (![" ", "enter", "arrowleft", "arrowright", "a", "d", "escape", "p", "m"].includes(k)) return;
  if ((event.target as Element)?.closest("button, a") && (k === " " || k === "enter")) return;
  event.preventDefault();
  if (event.repeat) return;
  if (k === "m") {
    muted = !muted;
    audio.setMuted(muted);
    return;
  }
  if (phase.value === "crashing" && (k === " " || k === "enter")) {
    startRun("player");
    return;
  }
  if (k === "escape" || k === "p") {
    if (phase.value === "running") pause();
    else if (phase.value === "paused") resume();
  } else act(k === "arrowleft" || k === "a" ? -1 : k === "arrowright" || k === "d" ? 1 : undefined);
}

function visibility() {
  if (document.hidden) pause();
  else focus();
}
function reload() {
  location.reload();
}

onMounted(async () => {
  window.addEventListener("keydown", key);
  window.addEventListener("blur", pause);
  window.addEventListener("focus", focus);
  document.addEventListener("visibilitychange", visibility);
  try {
    engine = await createGameEngine(
      mount.value!,
      {
        score: (value) => {
          score.value = value;
        },
        gem: () => {
          if (audioStarted) void audio.effect("currencypickup");
        },
        gate: (value) => {
          if (audioStarted) void audio.effect(`gate${((value - 1) % 5) + 1}`, 0.24);
        },
        crash: () => {
          phase.value = "crashing";
          if (audioStarted) {
            void audio.playMusic(true);
            void audio.effect("death", 0.8);
          }
        },
        dead: () => {
          phase.value = "dead";
          if (mode.value === "watch")
            queueMicrotask(() => {
              if (!abort.signal.aborted && mode.value === "watch") startRun("watch");
            });
        },
      },
      abort.signal,
    );
    if (abort.signal.aborted) {
      engine.dispose();
      return;
    }
    startRun("watch", false);
  } catch (cause) {
    if (abort.signal.aborted) return;
    console.error("Game could not initialize", cause);
    phase.value = "error";
    error.value = cause instanceof Error ? cause.message : "The game could not load.";
  }
});

onBeforeUnmount(() => {
  abort.abort();
  engine?.dispose();
  audio.dispose();
  window.removeEventListener("keydown", key);
  window.removeEventListener("blur", pause);
  window.removeEventListener("focus", focus);
  document.removeEventListener("visibilitychange", visibility);
});
</script>

<template>
  <main class="game" :data-phase="phase" :data-mode="mode" @pointerdown="pointer">
    <div ref="mount" class="world" />
    <slot v-if="mode === 'watch' && phase !== 'error'" name="watch" />
    <div v-if="phase === 'loading' && !$slots.watch" class="status" role="status">Loading…</div>
    <div v-else-if="phase === 'error'" class="status" role="alert">
      <p>{{ error }}</p>
      <button @click="reload">Try again</button>
    </div>
    <div
      v-else-if="mode === 'player' && (phase === 'crashing' || phase === 'dead')"
      class="result"
      aria-live="polite"
    >
      <span>{{ score }}</span>
      <button aria-label="Play again" @click="startRun('player')">
        <img src="/game/button-play.png" alt="Play again" />
      </button>
    </div>
    <button
      v-if="phase !== 'loading' && phase !== 'error'"
      class="mode-control"
      @click="startRun(mode === 'watch' ? 'player' : 'watch')"
    >
      {{ mode === "watch" ? "▶ play" : "watch" }}
    </button>
  </main>
</template>

<style scoped>
@font-face {
  font-family: RoadAthletic;
  src: url("/game/athletic.ttf") format("truetype");
  font-display: swap;
}
.game {
  position: fixed;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  background: #000;
  color: #fff;
  font-family: RoadAthletic, sans-serif;
}
.world {
  position: absolute;
  inset: 0;
}
button {
  cursor: pointer;
  color: white;
  background: none;
  border: 0;
  font: inherit;
  -webkit-tap-highlight-color: transparent;
}
button:focus-visible {
  outline: 2px solid white;
  outline-offset: 8px;
}
.status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 24px;
  font-size: 25px;
  text-align: center;
  padding: 30px;
}
.result {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 35px;
  background: #0005;
}
.result > span {
  font-size: clamp(80px, 15vw, 130px);
}
.result button {
  padding: 20px;
}
.result img {
  display: block;
  width: 66px;
  height: 66px;
  object-fit: contain;
}
.mode-control {
  position: absolute;
  z-index: 1;
  bottom: 5.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 26px;
  border: 1px solid #ffffff40;
  border-radius: 4px;
  background: #0008;
  backdrop-filter: blur(8px);
  font:
    15px ui-monospace,
    monospace;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.mode-control:hover {
  border-color: #ffffff99;
  background: #ffffff1a;
}
</style>
