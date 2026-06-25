import { logServerError } from "../utils/logger";

type ClientReport = {
  scope?: unknown;
  message?: unknown;
  stack?: unknown;
  url?: unknown;
  userAgent?: unknown;
};

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : undefined);

/**
 * Sink for client-side error reports (see app/utils/report-error.ts).
 * Forwards them to the server logger so they show up in Vercel runtime logs.
 */
export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => null)) as ClientReport | null;

  if (body && typeof body === "object") {
    const scope = str(body.scope, 80) ?? "unknown";
    logServerError(`client:${scope}`, str(body.message) ?? "client error", {
      stack: str(body.stack, 4000),
      url: str(body.url, 500),
      userAgent: str(body.userAgent, 300),
    });
  }

  setResponseStatus(event, 204);
  return null;
});
