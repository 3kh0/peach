<script setup lang="ts">
import type { NuxtError } from "#app";
import { notFoundMarkdown } from "#shared/site";

const props = defineProps<{ error: NuxtError }>();

const goHome = () => clearError({ redirect: "/" });

const recovery = computed(() => {
  const url = props.error.url || props.error.statusMessage || "";
  let path = "/unknown";
  try {
    path = url.startsWith("http") ? new URL(url).pathname : url || path;
  } catch {
    path = url || path;
  }
  return notFoundMarkdown(path.startsWith("/") ? path : `/${path}`);
});
</script>

<template>
  <div>
    <nav class="sr-only" aria-label="Page not found">
      <pre>{{ recovery }}</pre>
    </nav>
    <SnakeGame />
    <button
      type="button"
      class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded border border-white/25 bg-white/5 px-6.5 py-2.5 font-mono text-[15px] uppercase tracking-[0.22em] text-neutral-100 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
      @click="goHome"
    >
      ← back home
    </button>
  </div>
</template>
