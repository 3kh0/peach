import type { H3Event } from "h3";

export function contactConfig(event: H3Event) {
  setHeader(event, "cache-control", "no-store");
  const c = useRuntimeConfig(event);

  return {
    email: c.contactEmail as string,
    secret: (c.contactSecret || c.turnstile.secret) as string,
    requireTurnstile: Boolean(c.public.contactRequireTurnstile),
    turnstileSecret: c.turnstile.secret as string,
    turnstileHostnames: new Set(
      String(c.turnstile.hostnames ?? "")
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean),
    ),
  };
}
