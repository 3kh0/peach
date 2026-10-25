<script setup lang="ts">
import Home from "./pages/index.vue";
import NotFound from "./pages/not-found.vue";

defineProps<{ path: string }>();
</script>

<template>
  <Home v-if="path === '/'" />
  <NotFound v-else :path="path" />
</template>
