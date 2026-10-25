import { logServerError } from "../server/utils/logger";
import {
  HOMEPAGE_PRODUCES,
  MARKDOWN_CONTENT_TYPE,
  homepageMarkdown,
  isAgentNotFoundPath,
  isHomepagePath,
  notAcceptableBody,
  notFoundMarkdown,
  preferredType,
  wantsMarkdownNotFound,
} from "../shared/site";

function appendVaryAccept(headers: Headers): void {
  const tokens = (headers.get("vary") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.includes("accept")) headers.append("Vary", "Accept");
  if (!tokens.includes("accept-encoding")) headers.append("Vary", "Accept-Encoding");
}

/** Accept negotiation for the homepage (HTML or Markdown). */
function negotiateHomepage(request: Request): Response | null {
  const accept = request.headers.get("accept");
  const chosen = preferredType(accept, HOMEPAGE_PRODUCES);

  if (chosen === null && accept) {
    const res = new Response(notAcceptableBody(accept), {
      status: 406,
      statusText: "Not Acceptable",
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
    appendVaryAccept(res.headers);
    return res;
  }

  if (chosen === "text/markdown") {
    const res = new Response(homepageMarkdown(), {
      headers: {
        "content-type": MARKDOWN_CONTENT_TYPE,
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
    appendVaryAccept(res.headers);
    return res;
  }

  return null;
}

/** Agents and curl get a Markdown 404 with recovery links; browsers keep 404.html. */
function markdownNotFound(request: Request, pathname: string, status: number): Response | null {
  if (!isAgentNotFoundPath(pathname)) return null;
  if (!wantsMarkdownNotFound(request.headers.get("accept") ?? undefined)) return null;
  return new Response(notFoundMarkdown(pathname), {
    status,
    headers: {
      "content-type": MARKDOWN_CONTENT_TYPE,
      "cache-control": "no-cache",
      vary: "accept",
    },
  });
}

export const onRequest = async ({ request, next }) => {
  const { pathname } = new URL(request.url);
  const homepage =
    isHomepagePath(pathname) && (request.method === "GET" || request.method === "HEAD");

  try {
    if (homepage) {
      const negotiated = negotiateHomepage(request);
      if (negotiated) return negotiated;
    }

    const res = await next();

    if (res.status === 404 || res.status === 410) {
      return markdownNotFound(request, pathname, res.status) ?? res;
    }

    if (homepage) {
      const html = new Response(res.body, res);
      appendVaryAccept(html.headers);
      return html;
    }

    return res;
  } catch (error) {
    // Catches every unhandled function error so it is logged instead of
    // vanishing into a bare 500.
    logServerError("functions", error, { path: pathname, method: request.method });
    return new Response("Internal Server Error", { status: 500 });
  }
};
