import { describe, expect, test } from "bun:test";

const BASE = process.env.BASE_URL;

describe.skipIf(!BASE)("live agent-readiness endpoints", () => {
  const base = BASE!;

  async function get(path: string, headers?: Record<string, string>) {
    const res = await fetch(new URL(path, base), { headers, redirect: "manual" });
    const body = await res.text();
    return { res, body, type: res.headers.get("content-type") || "" };
  }

  test("nonexistent paths return HTTP 404 with a markdown recovery body", async () => {
    const { res, body, type } = await get("/some-path-that-does-not-exist");
    expect(res.status).toBe(404);
    expect(type).toContain("text/markdown");
    expect(body).toContain("# 404 Not Found");
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap.xml");
  });

  test("browsers still get the HTML 404 page", async () => {
    const { res, body, type } = await get("/some-path-that-does-not-exist", {
      accept: "text/html",
    });
    expect(res.status).toBe(404);
    expect(type).toContain("text/html");
    expect(body).toContain("back home");
    expect(body).toContain("/llms.txt");
  });

  test("homepage is server-rendered with H1, H2s, H3s, JSON-LD, and 500+ chars", async () => {
    const { res, body, type } = await get("/");
    expect(res.status).toBe(200);
    expect(type).toContain("text/html");
    expect(body).toMatch(/<h1\b[^>]*>[^<]+<\/h1>/i);
    expect(body).toMatch(/<h2\b[^>]*>[^<]+/i);
    expect(body).toMatch(/<h3\b[^>]*>[^<]+<\/h3>/i);
    expect(body).toContain("application/ld+json");
    expect(body).toContain('"@type":"Person"');
    const vary = res.headers.get("vary") || "";
    expect(vary.toLowerCase()).toContain("accept");
    const text = body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    expect(text.length).toBeGreaterThanOrEqual(500);
  });

  test("homepage negotiates text/markdown with Vary: Accept", async () => {
    const { res, body, type } = await get("/", { accept: "text/markdown" });
    expect(res.status).toBe(200);
    expect(type).toContain("text/markdown");
    expect(body.startsWith("# hi, i'm echo (aka rowan)")).toBe(true);
    expect(body).toContain("## work");
    expect(body).toContain("### Stance");
    const vary = res.headers.get("vary") || "";
    expect(vary.toLowerCase()).toContain("accept");
    expect(vary.toLowerCase()).toContain("accept-encoding");
  });

  test("homepage prefers markdown when it outranks html", async () => {
    const { res, type } = await get("/", {
      accept: "text/markdown, text/html;q=0.8",
    });
    expect(res.status).toBe(200);
    expect(type).toContain("text/markdown");
  });

  test("homepage returns 406 when Accept cannot be satisfied", async () => {
    const { res, body, type } = await get("/", { accept: "application/pdf" });
    expect(res.status).toBe(406);
    expect(type).toContain("text/plain");
    expect(body).toContain("text/html");
    expect(body).toContain("text/markdown");
    const vary = res.headers.get("vary") || "";
    expect(vary.toLowerCase()).toContain("accept");
  });

  test("llms.txt follows the spec and includes when-to-use guidance", async () => {
    const { res, body, type } = await get("/llms.txt");
    expect(res.status).toBe(200);
    expect(type).toMatch(/text\/(markdown|plain)/);
    expect(body.startsWith("# 3kh0.net")).toBe(true);
    expect(body).toContain("## When to use this");
  });

  test("agent-instructions.md has when-to-use guidance", async () => {
    const { res, body } = await get("/agent-instructions.md");
    expect(res.status).toBe(200);
    expect(body).toContain("## When to use this");
    expect(body).toContain("## How to call");
  });

  test("sitemap.xml lists public URLs", async () => {
    const { res, body, type } = await get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(type).toContain("xml");
    expect(body).toContain("https://3kh0.net/");
    expect(body).toContain("https://3kh0.net/llms.txt");
  });

  test("robots.txt points at the sitemap", async () => {
    const { res, body } = await get("/robots.txt");
    expect(res.status).toBe(200);
    expect(body).toContain("Sitemap: https://3kh0.net/sitemap.xml");
  });

  test("existing monitor API still responds", async () => {
    const { res } = await get("/api/monitor/github");
    expect(res.status).toBe(200);
  });
});
