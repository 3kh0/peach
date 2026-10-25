<script setup lang="ts">
import { icons } from "../icons";

defineProps<{ name: string }>();
</script>

<template>
  <component :is="icons[name]" aria-hidden="true" />
</template>
