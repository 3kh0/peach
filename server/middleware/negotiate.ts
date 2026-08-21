import {
  HOMEPAGE_PRODUCES,
  MARKDOWN_CONTENT_TYPE,
  VARY_ACCEPT,
  homepageMarkdown,
  isHomepagePath,
  notAcceptableBody,
  preferredType,
} from "../../shared/site";

function appendVaryAccept(event: Parameters<typeof getHeader>[0]): void {
  const existing = getHeader(event, "vary");
  if (!existing) {
    setHeader(event, "Vary", VARY_ACCEPT);
    return;
  }
  const tokens = existing.split(",").map((s) => s.trim().toLowerCase());
  let next = existing;
  if (!tokens.includes("accept")) next = `${next}, Accept`;
  if (!tokens.includes("accept-encoding")) next = `${next}, Accept-Encoding`;
  setHeader(event, "Vary", next);
}

export default defineEventHandler((event) => {
  const method = event.method;
  if (method !== "GET" && method !== "HEAD") return;

  const pathname = getRequestURL(event).pathname;
  if (!isHomepagePath(pathname)) return;

  const accept = getHeader(event, "accept") ?? null;
  const chosen = preferredType(accept, HOMEPAGE_PRODUCES);

  appendVaryAccept(event);

  if (chosen === null && accept) {
    setResponseStatus(event, 406, "Not Acceptable");
    setHeader(event, "Content-Type", "text/plain; charset=utf-8");
    setHeader(event, "Cache-Control", "no-store");
    return notAcceptableBody(accept);
  }

  if (chosen === "text/markdown") {
    setHeader(event, "Content-Type", MARKDOWN_CONTENT_TYPE);
    setHeader(event, "Cache-Control", "public, max-age=0, must-revalidate");
    return homepageMarkdown();
  }
});
