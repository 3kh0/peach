import { logServerError } from "../utils/logger";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const EXPECTED_ACTION = "reveal-email";

/** A real token is ~300-600 chars; anything past this is not worth forwarding. */
const MAX_TOKEN_LENGTH = 2048;

type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const forbidden = () => createError({ statusCode: 403, statusMessage: "Forbidden" });

/**
 * Hands out the contact address, but only to a caller holding a Turnstile token
 * that siteverify vouches for. The address lives in server-only runtime config,
 * so it is absent from the HTML, the JSON-LD, and the client bundle until a
 * visitor passes the check.
 *
 * Fails closed: any missing config, bad token, network error, or unexpected
 * siteverify response yields 403 rather than the address.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");

  const config = useRuntimeConfig(event);
  const secret = config.turnstile.secret;
  const email = config.contactEmail;
  const hostnames = new Set(
    String(config.turnstile.hostnames ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!secret || !email || hostnames.size === 0) {
    // Deploy-time misconfiguration, not a visitor problem — log it loudly so it
    // shows up in the Pages runtime logs instead of silently 403ing everyone.
    logServerError("contact:config", "turnstile reveal is not configured", {
      hasSecret: Boolean(secret),
      hasEmail: Boolean(email),
      hostnameCount: hostnames.size,
    });
    throw createError({ statusCode: 503, statusMessage: "Service Unavailable" });
  }

  const body = (await readBody(event).catch(() => null)) as { token?: unknown } | null;
  const token = body?.token;
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw forbidden();
  }

  const remoteip = getRequestHeader(event, "cf-connecting-ip");

  let result: SiteverifyResult;
  try {
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }),
    });
    if (!res.ok) throw new Error(`siteverify responded ${res.status}`);
    result = (await res.json()) as SiteverifyResult;
  } catch (error) {
    logServerError("contact:siteverify", error);
    throw forbidden();
  }

  // A token is single-use: siteverify rejects a replay of one it already
  // redeemed, so a leaked token cannot be traded for the address twice.
  if (
    result.success !== true ||
    result.action !== EXPECTED_ACTION ||
    !hostnames.has(String(result.hostname ?? "").toLowerCase())
  ) {
    logServerError("contact:rejected", "turnstile token rejected", {
      action: result.action,
      hostname: result.hostname,
      errorCodes: result["error-codes"],
    });
    throw forbidden();
  }

  return { email };
});
