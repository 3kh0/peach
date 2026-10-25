<script setup lang="ts">
import { ref } from "vue";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<{ label: string; action?: boolean }>(), {
  action: false,
});
const emit = defineEmits<{ activate: [] }>();

const open = ref(false);

const t = () => (props.action ? emit("activate") : (open.value = !open.value));
</script>

<template>
  <div class="max-w-lg">
    <div
      class="group flex w-full items-baseline gap-3 py-1 text-white cursor-pointer transition-colors hover:text-blue-300"
      @click="t"
    >
      <button
        type="button"
        class="disclosure-toggle-mark font-mono text-lg leading-none text-blue-400/90 select-none cursor-pointer"
        :aria-expanded="props.action ? undefined : open"
        :aria-haspopup="props.action ? 'dialog' : undefined"
        :aria-label="props.label"
        @click.stop="t"
      >
        <span class="disclosure-toggle-mark__bracket disclosure-toggle-mark__bracket--left">[</span>
        <Icon
          :name="props.action ? 'tabler:arrow-up-right' : 'tabler:plus'"
          class="disclosure-toggle-mark__icon transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :class="!props.action && open ? 'disclosure-toggle-mark__icon--open' : ''"
        />
        <span class="disclosure-toggle-mark__bracket disclosure-toggle-mark__bracket--right"
          >]</span
        >
      </button>
      <h2 class="m-0 p-0 text-2xl font-medium tracking-tight">{{ props.label }}</h2>
    </div>

    <div
      v-if="$slots.default"
      class="grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :class="!props.action && open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden">
        <div class="pt-2 pl-[2.4rem]">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.disclosure-toggle-mark {
  position: relative;
  display: inline-block;
  width: 3ch;
  height: 1em;
  vertical-align: -0.02em;
}

.disclosure-toggle-mark__bracket {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.disclosure-toggle-mark__bracket--left {
  left: 0;
}

.disclosure-toggle-mark__bracket--right {
  right: 0;
}

.disclosure-toggle-mark__icon {
  position: absolute;
  top: 50%;
  left: calc(50% + 0.045em);
  width: 0.96em;
  height: 0.96em;
  transform: translate(-50%, -50%) rotate(0deg);
}

.disclosure-toggle-mark__icon--open {
  transform: translate(-50%, -50%) rotate(45deg);
}
</style>
