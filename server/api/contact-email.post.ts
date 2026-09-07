import { contactConfig } from "../utils/contact-config";
import { verifyTicket } from "../utils/contact-ticket";
import { logServerError } from "../utils/logger";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const EXPECTED_ACTION = "reveal-email";

const MAX_TOKEN_LENGTH = 2048;

type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const forbidden = () => createError({ statusCode: 403, statusMessage: "Forbidden" });

const staleTicket = () =>
  createError({ statusCode: 409, statusMessage: "Conflict", data: { reason: "stale-ticket" } });

async function turnstileAccepts(
  token: unknown,
  secret: string,
  hostnames: Set<string>,
  remoteip: string | undefined,
): Promise<boolean> {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) return false;
  if (!secret || !hostnames.size) return false;

  let result: SiteverifyResult;
  try {
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token, ...(remoteip ? { remoteip } : {}) }),
    });
    if (!res.ok) throw new Error(`siteverify responded ${res.status}`);
    result = (await res.json()) as SiteverifyResult;
  } catch (error) {
    logServerError("contact:siteverify", error);
    return false;
  }

  const accepted =
    result.success === true &&
    result.action === EXPECTED_ACTION &&
    hostnames.has(String(result.hostname ?? "").toLowerCase());

  if (!accepted) {
    logServerError("contact:rejected", "turnstile token rejected", {
      action: result.action,
      hostname: result.hostname,
      errorCodes: result["error-codes"],
    });
  }
  return accepted;
}

export default defineEventHandler(async (event) => {
  const { email, secret, requireTurnstile, turnstileSecret, turnstileHostnames } =
    contactConfig(event);

  if (!email || !secret || (requireTurnstile && !turnstileSecret)) {
    logServerError("contact:config", "reveal endpoint is not configured", {
      hasEmail: Boolean(email),
      hasSecret: Boolean(secret),
      requireTurnstile,
      hasTurnstileSecret: Boolean(turnstileSecret),
    });
    throw createError({ statusCode: 503, statusMessage: "Service Unavailable" });
  }

  const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null;

  const verdict = await verifyTicket(secret, body?.ticket);
  if (verdict === "invalid") throw forbidden();
  if (verdict === "expired") throw staleTicket();

  const cleared =
    !requireTurnstile ||
    (await turnstileAccepts(
      body?.token,
      turnstileSecret,
      turnstileHostnames,
      getRequestHeader(event, "cf-connecting-ip"),
    ));
  if (!cleared) throw forbidden();

  return { email };
});
