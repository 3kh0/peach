<script setup lang="ts">
import { reportError } from "~/utils/report-error";

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
const siteKey = useRuntimeConfig().public.turnstileSiteKey as string;

const status = ref<"idle" | "verifying" | "error">("idle");
const copied = ref(false);
const widgetHost = ref<HTMLElement | null>(null);

let widgetId: string | null = null;
let scriptPromise: Promise<void> | null = null;
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const label = computed(() =>
  status.value === "verifying" ? "checking…" : status.value === "error" ? "email (retry)" : "email",
);

/** Turnstile's script is only fetched once someone actually asks for the address. */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function fail(error: unknown) {
  // Deliberately does NOT reset the widget. Turnstile calls error-callback for
  // a failed challenge, and resetting from inside that callback re-runs the
  // challenge, which errors again — an unbounded request loop. The retry is
  // driven by the visitor clicking again instead.
  if (status.value !== "error") reportError("contact:reveal", error);
  status.value = "error";
}

async function exchange(token: string) {
  try {
    const { email: revealed } = await $fetch<{ email: string }>("/api/contact-email", {
      method: "POST",
      body: { token },
    });
    email.value = revealed;
    status.value = "idle";
    // The address is out; the widget has nothing left to guard.
    if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    widgetId = null;
  } catch (error) {
    fail(error);
  }
}

async function reveal() {
  if (email.value || status.value === "verifying") return;
  status.value = "verifying";

  try {
    if (!siteKey) throw new Error("missing turnstile sitekey");
    await loadTurnstile();
    await nextTick();

    const host = widgetHost.value;
    if (!host || !window.turnstile) throw new Error("turnstile unavailable");

    // Tokens are single-use, so an explicit retry reuses the widget and mints a
    // fresh one. This is the only reset path — see the note in fail().
    if (widgetId) {
      window.turnstile.reset(widgetId);
      return;
    }

    widgetId = window.turnstile.render(host, {
      sitekey: siteKey,
      action: ACTION,
      appearance: "interaction-only",
      theme: "dark",
      callback: (token: string) => exchange(token),
      "error-callback": () => fail(new Error("turnstile challenge errored")),
      "timeout-callback": () => fail(new Error("turnstile challenge timed out")),
      "expired-callback": () => {
        if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
      },
    });
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
  if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
});
</script>

<template>
  <span>
    <a v-if="email" :href="`mailto:${email}`" class="text-blue-400 underline">{{ email }}</a>
    <button
      v-else
      type="button"
      class="cursor-pointer text-blue-400 underline"
      :disabled="status === 'verifying'"
      :aria-busy="status === 'verifying'"
      title="revealed after a quick human check"
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
      <Teleport to="body">
        <div
          v-show="status !== 'idle'"
          ref="widgetHost"
          class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        />
      </Teleport>
    </ClientOnly>
  </span>
</template>
