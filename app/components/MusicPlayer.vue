<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const tracks = [
  {
    title: "dashstar*",
    artist: "Knock2",
    src: "/music/dashstar.mp3",
    cover: "/music/dashstar.jpg",
  },
  { title: "changes", artist: "sor", src: "/music/changes.mp3", cover: "/music/changes.jpg" },
  {
    title: "Override",
    artist: "KSLV Noh",
    src: "/music/override.mp3",
    cover: "/music/override.jpg",
  },
  {
    title: "Aria Math (Protostar Remix)",
    artist: "C418, Protostar",
    src: "/music/aria-math.mp3",
    cover: "/music/aria-math.jpg",
  },
  {
    title: "Shiawase (VIP)",
    artist: "Dion Timmer",
    src: "/music/shiawase.mp3",
    cover: "/music/shiawase.jpg",
  },
  {
    title: "Immortals",
    artist: "Fall Out Boy",
    src: "/music/immortals.mp3",
    cover: "/music/immortals.jpg",
  },
  { title: "For Me", artist: "Throttle", src: "/music/for-me.mp3", cover: "/music/for-me.jpg" },
  {
    title: "It's Time",
    artist: "Imagine Dragons",
    src: "/music/its-time.mp3",
    cover: "/music/its-time.jpg",
  },
  {
    title: "ALL THE LOVE",
    artist: "Kanye West, Andre Troutman",
    src: "/music/all-the-love.mp3",
    cover: "/music/all-the-love.jpg",
  },
  { title: "Ash", artist: "LE SSERAFIM", src: "/music/ash.mp3", cover: "/music/ash.jpg" },
  { title: "Chill", artist: "LISA", src: "/music/chill.mp3", cover: "/music/chill.jpg" },
  {
    title: "Moonflowers",
    artist: "meganeko",
    src: "/music/moonflowers.mp3",
    cover: "/music/moonflowers.jpg",
  },
  {
    title: "Light It Up (feat. Jex)",
    artist: "Robin Hustin, Tobimorrow",
    src: "/music/light-it-up.mp3",
    cover: "/music/light-it-up.jpg",
  },
  {
    title: "Solitude",
    artist: "TheFatRat, Slaydit",
    src: "/music/solitude.mp3",
    cover: "/music/solitude.jpg",
  },
  {
    title: "This Place We Call Home",
    artist: "ROMAN",
    src: "/music/this-place-we-call-home.mp3",
    cover: "/music/this-place-we-call-home.jpg",
  },
  {
    title: "Under Bright Lights",
    artist: "TWERL, Ekko & Sidetrack, Indy Skies",
    src: "/music/under-bright-lights.mp3",
    cover: "/music/under-bright-lights.jpg",
  },
  {
    title: "Control (feat. Jex)",
    artist: "Unknown Brain, Rival",
    src: "/music/control.mp3",
    cover: "/music/control.jpg",
  },
  {
    title: "I Don't Wanna Know",
    artist: "Brooks, Repiet",
    src: "/music/i-dont-wanna-know.mp3",
    cover: "/music/i-dont-wanna-know.jpg",
  },
  { title: "Afterlife", artist: "k?d", src: "/music/afterlife.mp3", cover: "/music/afterlife.jpg" },
  {
    title: "Time To Talk (feat. Georgia Michel)",
    artist: "Time To Talk",
    src: "/music/time-to-talk.mp3",
    cover: "/music/time-to-talk.jpg",
  },
  {
    title: "Wishing Dead",
    artist: "Blacklite District",
    src: "/music/wishing-dead.mp3",
    cover: "/music/wishing-dead.jpg",
  },
  {
    title: "For The Moment",
    artist: "MARBL, Lex Junior",
    src: "/music/for-the-moment.mp3",
    cover: "/music/for-the-moment.jpg",
  },
  {
    title: "The Devil in His Youth",
    artist: "Protomartyr",
    src: "/music/the-devil-in-his-youth.mp3",
    cover: "/music/the-devil-in-his-youth.jpg",
  },
];

const audio = ref(null);
const playlist = useState("music-playlist", () => shuffle(tracks));
const index = ref(0);
const playing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const seeking = ref(false);

const track = computed(() => playlist.value[index.value]);

function shuffle(input) {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const progress = computed(() => (duration.value ? currentTime.value / duration.value : 0));

const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${pad(s % 60)}` : "0:00");

const displayTime = computed(() => `${fmt(currentTime.value)} / ${fmt(duration.value)}`);

function toggle() {
  const el = audio.value;
  if (!el) return;
  if (el.paused) el.play();
  else el.pause();
}

function selectTrack(next, forcePlay = false) {
  const total = playlist.value.length;
  index.value = (next + total) % total;
  currentTime.value = 0;
  const el = audio.value;
  if (!el) return;
  const shouldPlay = forcePlay || playing.value;
  el.load();
  if (shouldPlay) el.play();
}

const prev = () => selectTrack(index.value - 1);
const next = () => selectTrack(index.value + 1);

function onSeek(event) {
  const el = audio.value;
  if (!el || !duration.value) return;
  el.currentTime = Number(event.target.value) * duration.value;
  currentTime.value = el.currentTime;
}

function onTimeUpdate() {
  if (!seeking.value) currentTime.value = audio.value?.currentTime ?? 0;
}

function onLoadedMetadata() {
  duration.value = audio.value?.duration ?? 0;
}

function onEnded() {
  if (playlist.value.length > 1) selectTrack(index.value + 1, true);
  else {
    playing.value = false;
    currentTime.value = 0;
  }
}

onMounted(() => {
  const el = audio.value;
  if (!el) return;
  audio.value.volume = 0.75;
  el.addEventListener("play", () => (playing.value = true));
  el.addEventListener("pause", () => (playing.value = false));
});

onBeforeUnmount(() => {
  audio.value?.pause();
});
</script>

<template>
  <div
    class="music-player w-full overflow-hidden border border-white/15 bg-black shadow-[0_16px_48px_rgba(0,0,0,0.32)]"
  >
    <div
      class="flex h-8 shrink-0 items-center justify-between border-b border-white/12 bg-white/4.5 px-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white/62"
    >
      <div class="flex items-center gap-2">
        <span class="h-1.5 w-1.5 rounded-full bg-white/40" aria-hidden="true" />
        <span>jukebox</span>
      </div>
      <span class="overflow-hidden whitespace-pre pl-4 text-right tabular-nums">{{
        displayTime
      }}</span>
    </div>

    <div class="flex items-center gap-3.5 p-3">
      <div class="relative shrink-0">
        <img
          :src="track.cover"
          :alt="`${track.title} cover art`"
          width="72"
          height="72"
          class="size-18 border border-white/12 object-cover saturate-[0.92]"
        />
        <span
          v-if="playing"
          class="eq absolute bottom-1 right-1 flex h-3 items-end gap-0.5"
          aria-hidden="true"
        >
          <i /><i /><i /><i />
        </span>
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="min-w-0">
          <p class="truncate text-[0.95rem] font-medium leading-tight text-white">
            {{ track.title }}
          </p>
          <p class="truncate font-mono text-[0.72rem] leading-tight text-white/50">
            {{ track.artist }}
          </p>
        </div>

        <input
          class="seek"
          type="range"
          min="0"
          max="1"
          step="0.001"
          :value="progress"
          :aria-label="`Seek ${track.title}`"
          :style="{ '--progress': `${progress * 100}%` }"
          @pointerdown="seeking = true"
          @pointerup="seeking = false"
          @input="onSeek"
        />

        <div class="flex items-center gap-1 text-white/55">
          <button
            type="button"
            class="ctrl"
            aria-label="Previous track"
            :disabled="tracks.length < 2"
            @click="prev"
          >
            <Icon name="tabler:player-track-prev-filled" />
          </button>
          <button
            type="button"
            class="ctrl ctrl--play"
            :aria-label="playing ? 'Pause' : 'Play'"
            @click="toggle"
          >
            <span class="ctrl__bracket">[</span>
            <Icon :name="playing ? 'tabler:player-pause-filled' : 'tabler:player-play-filled'" />
            <span class="ctrl__bracket">]</span>
          </button>
          <button
            type="button"
            class="ctrl"
            aria-label="Next track"
            :disabled="tracks.length < 2"
            @click="next"
          >
            <Icon name="tabler:player-track-next-filled" />
          </button>
        </div>
      </div>
    </div>

    <audio
      ref="audio"
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    >
      <source :src="track.src" type="audio/mpeg" />
    </audio>
  </div>
</template>

<style scoped>
.music-player {
  animation: monitor-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes monitor-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }
}

.ctrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 140ms ease;
}

.ctrl:hover:not(:disabled),
.ctrl:focus-visible {
  color: #fff;
  outline: none;
}

.ctrl:disabled {
  opacity: 0.3;
  cursor: default;
}

.ctrl--play {
  gap: 1px;
  font-family: "Courier New", monospace;
  color: rgba(96, 165, 250, 0.9);
}

.ctrl--play:hover,
.ctrl--play:focus-visible {
  color: rgb(147, 197, 253);
}

.ctrl__bracket {
  font-size: 0.78rem;
}

/* Thin seek bar — filled portion white, remainder dim, matching the mono panel. */
.seek {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  cursor: pointer;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.85) var(--progress, 0%),
    rgba(255, 255, 255, 0.14) var(--progress, 0%)
  );
}

.seek::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 2px;
  height: 11px;
  background: #fff;
  border: none;
  border-radius: 0;
}

.seek::-moz-range-thumb {
  width: 2px;
  height: 11px;
  background: #fff;
  border: none;
  border-radius: 0;
}

.seek:focus-visible {
  outline: 1px solid rgba(96, 165, 250, 0.6);
  outline-offset: 3px;
}

.eq i {
  display: block;
  width: 2px;
  background: rgba(96, 165, 250, 0.95);
  animation: eq 700ms ease-in-out infinite;
}

.eq i:nth-child(1) {
  animation-delay: -200ms;
}
.eq i:nth-child(2) {
  animation-delay: -500ms;
}
.eq i:nth-child(3) {
  animation-delay: -100ms;
}
.eq i:nth-child(4) {
  animation-delay: -350ms;
}

@keyframes eq {
  0%,
  100% {
    height: 3px;
  }
  50% {
    height: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .music-player {
    animation: none;
  }
  .eq i {
    animation: none;
    height: 7px;
  }
}
</style>
