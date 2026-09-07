const encoder = new TextEncoder();

export const TICKET_TTL_MS = 10 * 60 * 1000;

const FUTURE_SKEW_MS = 60 * 1000;

export type TicketVerdict = "ok" | "expired" | "invalid";

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

const hmacKey = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);

export async function issueTicket(secret: string, now = Date.now()) {
  const body = String(now);
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyTicket(
  secret: string,
  ticket: unknown,
  now = Date.now(),
  ttlMs = TICKET_TTL_MS,
): Promise<TicketVerdict> {
  if (typeof ticket !== "string" || !ticket || ticket.length > 256) return "invalid";

  const i = ticket.indexOf(".");
  if (i < 1) return "invalid";

  const body = ticket.slice(0, i);
  const sig = ticket.slice(i + 1);
  if (!/^\d{10,16}$/.test(body) || !sig) return "invalid";

  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(sig);
  } catch {
    return "invalid";
  }

  const key = await hmacKey(secret);
  if (!(await crypto.subtle.verify("HMAC", key, bytes, encoder.encode(body)))) return "invalid";

  const age = now - Number(body);
  if (age > ttlMs || age < -FUTURE_SKEW_MS) return "expired";

  return "ok";
}
