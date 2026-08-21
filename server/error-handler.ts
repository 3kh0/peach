import { getRequestHeader, getRequestURL, send, setResponseHeader, setResponseStatus } from "h3";
import { defineNitroErrorHandler } from "nitropack/runtime";
import { isAgentNotFoundPath, notFoundMarkdown, wantsMarkdownNotFound } from "../shared/site";

export default defineNitroErrorHandler((error, event) => {
  const status = Number(error.statusCode) || 500;
  if (status !== 404 && status !== 410) return;

  const pathname = getRequestURL(event).pathname;
  if (!isAgentNotFoundPath(pathname)) return;
  if (!wantsMarkdownNotFound(getRequestHeader(event, "accept"))) return;

  setResponseHeader(event, "content-type", "text/markdown; charset=utf-8");
  setResponseHeader(event, "cache-control", "no-cache");
  setResponseHeader(event, "vary", "accept");
  setResponseStatus(event, status);
  return send(event, notFoundMarkdown(pathname));
});
