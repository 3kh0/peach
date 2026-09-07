import { contactConfig } from "../utils/contact-config";
import { issueTicket, TICKET_TTL_MS } from "../utils/contact-ticket";
import { logServerError } from "../utils/logger";

export default defineEventHandler(async (event) => {
  const { secret } = contactConfig(event);
  if (!secret) {
    logServerError("contact:config", "no signing secret configured");
    throw createError({ statusCode: 503, statusMessage: "Service Unavailable" });
  }

  return { ticket: await issueTicket(secret), ttlMs: TICKET_TTL_MS };
});
