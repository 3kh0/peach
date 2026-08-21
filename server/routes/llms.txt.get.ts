import { llmsTxt } from "../../shared/site";

export default defineEventHandler((event) => {
  setHeader(event, "content-type", "text/markdown; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=3600");
  return llmsTxt();
});
