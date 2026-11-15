<script setup lang="ts">
import Game2 from "./pages/game2.vue";
import Home from "./pages/index.vue";
import NotFound from "./pages/not-found.vue";

defineProps<{ path: string }>();
</script>

<template>
  <Home v-if="path === '/'" />
  <Game2 v-else-if="path.replace(/\/+$/, '') === '/game2'" />
  <NotFound v-else :path="path" />
</template>
