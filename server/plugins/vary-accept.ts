import { VARY_ACCEPT, isHomepagePath } from "../../shared/site";

function appendVaryAccept(event: Parameters<typeof getResponseHeader>[0]) {
  const existing = getResponseHeader(event, "vary");
  const current = (
    typeof existing === "string" ? existing : Array.isArray(existing) ? existing.join(",") : ""
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const lower = new Set(current.map((s) => s.toLowerCase()));
  if (!lower.has("accept")) current.push("Accept");
  if (!lower.has("accept-encoding")) current.push("Accept-Encoding");
  setResponseHeader(event, "vary", current.join(", ") || VARY_ACCEPT);
}

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("beforeResponse", (event) => {
    if (!isHomepagePath(getRequestURL(event).pathname)) return;
    appendVaryAccept(event);
  });
});
