type ErrorContext = Record<string, unknown>;

// Dedupe identical errors so a throw inside an animation loop can't flood the
// console or spam the logging endpoint many times per second.
const REPORT_COOLDOWN_MS = 10_000;
const lastReported = new Map<string, number>();

/**
 * Report a non-fatal error.
 *
 * Always logs to the console for local debugging. On the client it also makes a
 * best-effort beacon to `/api/log` so client-side breakages (the interactive
 * canvas, background, etc.) land in Vercel's runtime logs alongside server errors.
 * Logging must never throw.
 */
export function reportError(scope: string, error: unknown, context?: ErrorContext) {
  const message = error instanceof Error ? error.message : String(error);

  const key = `${scope}|${message}`;
  const now = Date.now();
  const previous = lastReported.get(key);
  if (previous && now - previous < REPORT_COOLDOWN_MS) return;
  lastReported.set(key, now);

  // eslint-disable-next-line no-console
  console.error(`[${scope}]`, error, context ?? "");

  if (!import.meta.client) return;

  try {
    const body = JSON.stringify({
      scope,
      message,
      stack: error instanceof Error ? error.stack : undefined,
      url: window.location?.href,
      userAgent: navigator.userAgent,
      ...context,
    });

    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/log", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/log", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "content-type": "application/json" },
      });
    }
  } catch {
    // Swallow — logging failures must never cascade into the page.
  }
}
