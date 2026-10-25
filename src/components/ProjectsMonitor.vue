<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { PROJECTS as projects } from "../../shared/site";
import Icon from "./Icon.vue";
import { ASCII_RAMP, clamp } from "./monitor/utils";

const props = defineProps({
  open: { type: Boolean, required: true },
});
const emit = defineEmits(["close"]);

const expandedIndex = ref(null);
const dialog = ref(null);
const closeButton = ref(null);
let previousFocus = null;
let previousOverflow = "";

const booting = ref(false);
const bootText = ref("");
const bootOpacity = ref(1);
const bootLayer = ref(null);
const bootPad = ref({ paddingLeft: "0px", paddingTop: "0px" });
let bootRaf = 0;

function ht(row, col) {
  return ((((row * 73856093) ^ (col * 19349663)) >>> 0) % 1000) / 1000;
}

function bt(cols, rows) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(" "));
  const log = [
    "echo@projects:~$ ./list --all",
    "",
    "[ ok ] mounting repositories",
    `[ ok ] indexing ${projects.length} entries`,
    "[ ok ] adding extra swag",
    "",
    "ready",
  ];
  const top = Math.max(0, Math.floor((rows - log.length) / 2));

  log.forEach((line, i) => {
    const row = top + i;
    if (row >= rows) return;
    const left = Math.max(0, Math.floor((cols - line.length) / 2));
    for (let j = 0; j < line.length && left + j < cols; j += 1) grid[row][left + j] = line[j];
  });

  return grid;
}

// Measure the rendered size of a single monospace cell using the same font as
// the boot <pre>, so column/row math reflects the actual on-device glyph metrics.
function measureCell(el) {
  const SAMPLE = 100;
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.className = "font-mono text-[12px] leading-[1.3]";
  probe.style.cssText =
    "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;white-space:pre;-webkit-text-size-adjust:100%;text-size-adjust:100%;";
  probe.textContent = "0".repeat(SAMPLE);
  el.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();

  return {
    charW: rect.width / SAMPLE || 7.2,
    lineH: rect.height || 15.6,
  };
}

function stopBoot() {
  if (bootRaf) cancelAnimationFrame(bootRaf);
  bootRaf = 0;
  booting.value = false;
}

async function runBoot() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    booting.value = false;
    return;
  }

  booting.value = true;
  bootOpacity.value = 1;
  bootText.value = "";
  await nextTick();

  const el = bootLayer.value;
  if (!el) return;

  // The grid is centered by character count, so it only *looks* centered if the
  // column/row counts match how many monospace cells actually fit in the box.
  // Measure the real glyph cell instead of assuming one (iOS Safari inflates text
  // via text-size-adjust, so a hardcoded width lands the grid well off-center).
  const { charW, lineH } = measureCell(el);
  const cols = Math.max(16, Math.floor(el.clientWidth / charW));
  const rows = Math.max(16, Math.floor(el.clientHeight / lineH));
  // Center whatever sub-cell remainder is left over after the integer grid.
  bootPad.value = {
    paddingLeft: `${Math.max(0, (el.clientWidth - cols * charW) / 2)}px`,
    paddingTop: `${Math.max(0, (el.clientHeight - rows * lineH) / 2)}px`,
  };
  const target = bt(cols, rows);
  const ramp = ASCII_RAMP.slice(1);
  const start = performance.now();

  function frame(now) {
    const e = now - start;
    let out = "";

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const th = ht(row, col);
        const tch = target[row][col];
        if (e < 720) out += e / 720 > th ? tch : ramp[Math.floor(Math.random() * ramp.length)];
        else if (e < 1560) out += tch;
        else out += (e - 1560) / 640 > th ? " " : tch;
      }
      if (row < rows - 1) out += "\n";
    }

    bootText.value = out;
    if (e >= 1560) bootOpacity.value = clamp(1 - (e - 1560) / 640, 0, 1);
    if (e >= 2200) return stopBoot();
    bootRaf = requestAnimationFrame(frame);
  }

  bootRaf = requestAnimationFrame(frame);
}

function toggleProject(index) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

function close() {
  expandedIndex.value = null;
  emit("close");
}

function onKeydown(event) {
  if (event.key === "Escape") {
    if (expandedIndex.value !== null) {
      expandedIndex.value = null;
      return;
    }
    close();
    return;
  }

  if (event.key !== "Tab" || !dialog.value) return;

  const focusable = Array.from(
    dialog.value.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      runBoot();
      await nextTick();
      closeButton.value?.focus();
      return;
    }

    expandedIndex.value = null;
    stopBoot();
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus();
  },
);

onBeforeUnmount(() => {
  stopBoot();
  document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="project-monitor" :duration="{ enter: 500, leave: 460 }">
      <div
        v-if="open"
        class="fixed inset-0 z-50 grid place-items-center p-[clamp(0.75rem,3vw,2.5rem)] bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.04),transparent_32%),rgba(8,8,8,0.82)] backdrop-blur-[10px] max-md:p-0"
        @mousedown.self="close"
      >
        <section
          ref="dialog"
          class="project-monitor relative w-[min(1060px,100%)] h-[min(820px,calc(100dvh-clamp(1.5rem,6vw,5rem)))] overflow-hidden border border-white/15 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.6)] max-md:w-full max-md:h-dvh max-md:border-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="projects-monitor-title"
          @keydown="onKeydown"
        >
          <div class="grid h-full grid-rows-[auto_auto_minmax(0,1fr)] bg-background">
            <div
              class="flex h-8 shrink-0 items-center justify-between border-b border-white/12 bg-white/4.5 px-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white/62"
            >
              <div class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-white/40" aria-hidden="true" />
                <span>projects</span>
              </div>
              <span class="overflow-hidden whitespace-pre pl-4 text-right tabular-nums"
                >{{ projects.length }} featured</span
              >
            </div>

            <header
              class="grid grid-cols-[minmax(0,1fr)_auto] gap-6 p-[clamp(1.5rem,3vw,2.25rem)] max-md:gap-4 max-md:p-5"
            >
              <div>
                <h2
                  id="projects-monitor-title"
                  class="text-white text-[clamp(1.75rem,3vw,2.75rem)] font-medium tracking-tight leading-none max-md:text-[2rem]"
                >
                  projects
                </h2>
                <p
                  class="max-w-152 mt-3 text-white/50 text-[0.88rem] leading-[1.55] max-md:text-[0.82rem]"
                >
                  a collection of my personal and professional projects. more is on my
                  <a
                    href="https://github.com/3kh0"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-400 underline underline-offset-[0.2rem] hover:text-blue-200 focus-visible:text-blue-200 focus-visible:outline-none"
                    >github</a
                  >, but these are some of the highlights!
                </p>
              </div>
              <button
                ref="closeButton"
                type="button"
                aria-label="Close projects"
                class="self-start py-1 font-mono text-[11px] tracking-[0.24em] text-white/50 cursor-pointer transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
                @click="close"
              >
                [esc]
              </button>
            </header>

            <div
              class="min-h-0 overflow-y-auto border-t border-white/12 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
            >
              <article
                v-for="(project, index) in projects"
                :key="project.name"
                class="border-b border-white/12 last:border-b-0"
              >
                <div
                  class="project-row grid w-full grid-cols-[minmax(0,1fr)_clamp(6rem,16vw,9.5rem)] items-center gap-[clamp(0.85rem,2.5vw,1.5rem)] px-[clamp(0.9rem,2.2vw,1.4rem)] py-[clamp(0.7rem,1.8vw,1rem)] max-md:grid-cols-1 max-md:gap-2.5"
                >
                  <button
                    type="button"
                    class="min-w-0 text-left cursor-pointer transition-colors duration-140 ease hover:text-white focus-visible:text-white focus-visible:outline-none"
                    :aria-expanded="expandedIndex === index"
                    @click="toggleProject(index)"
                  >
                    <h3
                      class="flex items-baseline gap-2 text-white text-[clamp(1rem,1.9vw,1.2rem)] font-medium tracking-[-0.04em] leading-none"
                      :class="expandedIndex === index ? 'text-blue-200' : ''"
                    >
                      <span
                        class="project-toggle-mark font-mono text-[0.78rem] leading-none text-blue-400/90 select-none"
                        aria-hidden="true"
                      >
                        <span
                          class="project-toggle-mark__bracket project-toggle-mark__bracket--left"
                          >[</span
                        >
                        <Icon
                          name="tabler:plus"
                          class="project-toggle-mark__icon transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          :class="expandedIndex === index ? 'project-toggle-mark__icon--open' : ''"
                        />
                        <span
                          class="project-toggle-mark__bracket project-toggle-mark__bracket--right"
                          >]</span
                        >
                      </span>
                      {{ project.name }}
                    </h3>
                    <p
                      class="mt-1.5 text-white/55 text-[0.78rem] leading-normal line-clamp-2 max-md:line-clamp-3"
                    >
                      {{ project.description }}
                    </p>

                    <ul
                      class="flex flex-wrap gap-[0.55rem] mt-2 text-white/45 text-[0.82rem] font-mono"
                      aria-label="Technologies"
                    >
                      <li v-for="tech in project.tech" :key="tech" :title="tech" class="flex">
                        <Icon :name="tech" />
                        <span class="sr-only">{{ tech }}</span>
                      </li>
                    </ul>
                  </button>

                  <button
                    type="button"
                    class="relative aspect-16/10 overflow-hidden border border-white/12 bg-[#0a0a0a] cursor-pointer transition-opacity duration-140 ease hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-none max-md:aspect-video max-md:w-full"
                    :aria-label="`View ${project.name}`"
                    :aria-expanded="expandedIndex === index"
                    @click="toggleProject(index)"
                  >
                    <img
                      :src="project.image"
                      :alt="`${project.name} preview`"
                      class="w-full h-full object-cover saturate-[0.78] contrast-[1.04]"
                      loading="lazy"
                      width="304"
                      height="190"
                    />
                  </button>
                </div>

                <div
                  class="flex flex-wrap gap-[1.1rem] px-[clamp(0.9rem,2.2vw,1.4rem)] pb-2.5 -mt-0.5 text-[0.66rem] font-mono"
                >
                  <a
                    v-if="project.demo"
                    :href="project.demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-400 underline underline-offset-[0.2rem] transition-colors duration-140 ease hover:text-blue-200 focus-visible:text-blue-200 focus-visible:outline-none"
                  >
                    visit <span aria-hidden="true">↗</span>
                  </a>
                  <a
                    v-if="project.repo"
                    :href="project.repo"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-400 underline underline-offset-[0.2rem] transition-colors duration-140 ease hover:text-blue-200 focus-visible:text-blue-200 focus-visible:outline-none"
                  >
                    source <span aria-hidden="true">↗</span>
                  </a>
                </div>

                <div
                  class="grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  :class="
                    expandedIndex === index
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  "
                >
                  <div class="overflow-hidden">
                    <div
                      class="px-[clamp(1.1rem,2.5vw,1.6rem)] pb-[clamp(1.1rem,2.5vw,1.6rem)] pt-0"
                    >
                      <div class="overflow-hidden border border-white/12 bg-[#0a0a0a]">
                        <img
                          :src="project.image"
                          :alt="`${project.name} project screenshot`"
                          class="w-full h-auto max-h-[min(28rem,50dvh)] object-contain bg-background animate-[image-in_240ms_ease_both] motion-reduce:animate-none"
                          loading="lazy"
                        />
                      </div>
                      <p class="mt-4 text-white/70 text-[0.92rem] leading-[1.65]">
                        {{ project.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div
            v-if="booting"
            ref="bootLayer"
            class="pointer-events-none absolute inset-0 z-10 overflow-hidden bg-background"
            :style="{ opacity: bootOpacity }"
            aria-hidden="true"
          >
            <pre
              class="absolute inset-0 m-0 font-mono text-[12px] leading-[1.3] text-[#d7d7d7] whitespace-pre select-none [-webkit-text-size-adjust:100%] [text-size-adjust:100%]"
              :style="bootPad"
              >{{ bootText }}</pre>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.project-toggle-mark {
  position: relative;
  display: inline-block;
  width: 3ch;
  height: 1em;
  vertical-align: -0.02em;
}

.project-toggle-mark__bracket {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.project-toggle-mark__bracket--left {
  left: 0;
}

.project-toggle-mark__bracket--right {
  right: 0;
}

.project-toggle-mark__icon {
  position: absolute;
  top: 50%;
  left: calc(50% + 0.045em);
  width: 0.96em;
  height: 0.96em;
  transform: translate(-50%, -50%) rotate(0deg);
}

.project-toggle-mark__icon--open {
  transform: translate(-50%, -50%) rotate(45deg);
}

.project-monitor-enter-active {
  transition: opacity 240ms ease;
}

.project-monitor-leave-active {
  transition: opacity 400ms ease;
}

.project-monitor-enter-active .project-monitor {
  transition:
    transform 460ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 240ms ease;
}

.project-monitor-leave-active .project-monitor {
  transition:
    transform 440ms cubic-bezier(0.5, 0, 0.75, 0),
    opacity 360ms ease;
}

.project-monitor-enter-from,
.project-monitor-leave-to,
.project-monitor-enter-from .project-monitor,
.project-monitor-leave-to .project-monitor {
  opacity: 0;
}

.project-monitor-enter-from .project-monitor {
  transform: translateY(72px) scale(0.94);
}

.project-monitor-leave-to .project-monitor {
  transform: translateY(96px) scale(0.92);
}

@keyframes image-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-monitor-enter-active,
  .project-monitor-leave-active,
  .project-monitor-enter-active .project-monitor,
  .project-monitor-leave-active .project-monitor {
    animation: none;
    transition: none;
  }
}
</style>
