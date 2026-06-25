import { logServerError } from "../utils/logger";

/**
 * Catches every unhandled Nitro/SSR error so it is logged (and therefore visible
 * in Vercel runtime logs) instead of vanishing into a bare 500/404 response.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("error", (error, info) => {
    const event = (info as { event?: { path?: string; method?: string } })?.event;
    logServerError("nitro", error, {
      path: event?.path,
      method: event?.method,
    });
  });
});
