<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";

const emit = defineEmits<{ error: [error: unknown] }>();

// Drop a broken subtree instead of letting it take down the page.
const failed = ref(false);

onErrorCaptured((error) => {
  failed.value = true;
  emit("error", error);
  return false;
});
</script>

<template>
  <slot v-if="!failed" />
</template>
