<script setup lang="ts">
import { computed } from "vue";
import { notFoundMarkdown } from "../../shared/site";
import Game from "../components/Game.vue";

const props = defineProps<{ path: string }>();

const goHome = () => location.assign("/");

const recovery = computed(() => notFoundMarkdown(props.path));
</script>

<template>
  <div>
    <nav class="sr-only" aria-label="Page not found">
      <!-- prerendered once as 404.html, so the path differs per request -->
      <pre data-allow-mismatch="text">{{ recovery }}</pre>
    </nav>
    <Game>
      <template #watch>
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 px-6 text-center font-mono"
        >
          <h1
            class="text-[clamp(72px,18vw,168px)] font-bold leading-none tracking-wider text-neutral-100"
          >
            404
          </h1>
          <p class="max-w-md text-base uppercase tracking-[0.34em] text-neutral-300">
            this page was not found. want to play a game instead?
          </p>
        </div>
      </template>
    </Game>
    <button
      type="button"
      class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded border border-white/25 bg-white/5 px-6.5 py-2.5 font-mono text-[15px] uppercase tracking-[0.22em] text-neutral-100 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
      @click="goHome"
    >
      ← back home
    </button>
  </div>
</template>
