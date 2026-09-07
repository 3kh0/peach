<script setup lang="ts">
import { reportError } from "~/utils/report-error";

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const ACTION = "reveal-email";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const email = useRevealedEmail();
const { turnstileSiteKey, contactRequireTurnstile } = useRuntimeConfig().public;
const siteKey = turnstileSiteKey as string;
const requireTurnstile = Boolean(contactRequireTurnstile);

const status = ref<"idle" | "working" | "error">("idle");
const copied = ref(false);
const widgetHost = ref<HTMLElement | null>(null);

let widgetId: string | null = null;
let scriptPromise: Promise<void> | null = null;
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const label = computed(() =>
  status.value === "working" ? "checking…" : status.value === "error" ? "email (retry)" : "email",
);

function fail(error: unknown) {
  if (status.value !== "error") reportError("contact:reveal", error);
  status.value = "error";
}

function dropWidget() {
  if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
  widgetId = null;
}

async function exchange(token?: string, retried = false): Promise<void> {
  const { ticket } = await $fetch<{ ticket: string }>("/api/contact-ticket");
  try {
    const res = await $fetch<{ email: string }>("/api/contact-email", {
      method: "POST",
      body: { ticket, ...(token ? { token } : {}) },
    });
    email.value = res.email;
    status.value = "idle";
    dropWidget();
  } catch (error) {
    if (!retried && (error as { statusCode?: number })?.statusCode === 409) {
      return exchange(token, true);
    }
    throw error;
  }
}

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile script failed to load (blocked?)"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function revealWithTurnstile() {
  if (!siteKey) throw new Error("missing turnstile sitekey");
  await loadTurnstile();
  await nextTick();

  const host = widgetHost.value;
  if (!host || !window.turnstile) throw new Error("turnstile unavailable");

  if (widgetId) {
    window.turnstile.reset(widgetId);
    return;
  }

  widgetId = window.turnstile.render(host, {
    sitekey: siteKey,
    action: ACTION,
    appearance: "interaction-only",
    theme: "dark",
    callback: (token: string) => {
      exchange(token).catch(fail);
    },
    "error-callback": () => fail(new Error("turnstile challenge errored")),
    "timeout-callback": () => fail(new Error("turnstile challenge timed out")),
  });
}

async function reveal() {
  if (email.value || status.value === "working") return;
  status.value = "working";
  try {
    if (requireTurnstile) await revealWithTurnstile();
    else await exchange();
  } catch (error) {
    fail(error);
  }
}

async function copy() {
  if (!email.value) return;
  try {
    await navigator.clipboard.writeText(email.value);
    copied.value = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1600);
  } catch {}
}

onBeforeUnmount(() => {
  clearTimeout(copyTimer);
  dropWidget();
});
</script>

<template>
  <span>
    <a v-if="email" :href="`mailto:${email}`" class="text-blue-400 underline">{{ email }}</a>
    <button
      v-else
      type="button"
      class="cursor-pointer text-blue-400 underline"
      :disabled="status === 'working'"
      :aria-busy="status === 'working'"
      title="revealed after a quick check"
      @click="reveal"
    >
      {{ label }}
    </button>

    <button
      v-if="email"
      type="button"
      class="ml-1.5 cursor-pointer align-baseline text-white/55 transition-colors hover:text-white"
      :aria-label="copied ? 'address copied' : 'copy address'"
      @click="copy"
    >
      <Icon :name="copied ? 'tabler:check' : 'tabler:copy'" class="size-3.5" />
    </button>

    <ClientOnly>
      <Teleport v-if="requireTurnstile" to="body">
        <div
          v-show="status !== 'idle'"
          ref="widgetHost"
          class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        />
      </Teleport>
    </ClientOnly>
  </span>
</template>
