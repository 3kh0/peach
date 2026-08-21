import { describe, expect, test } from "bun:test";
import {
  agentInstructionsMd,
  isAgentNotFoundPath,
  jsonLdScript,
  llmsTxt,
  notFoundMarkdown,
  personJsonLd,
  SITE_URL,
  sitemapXml,
  wantsMarkdownNotFound,
} from "../shared/site";

describe("JSON-LD Person identity", () => {
  test("is valid JSON with the Person type and required fields", () => {
    const parsed = JSON.parse(jsonLdScript());
    expect(parsed).toEqual(personJsonLd);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Person");
    expect(parsed.name).toBe("echo");
    expect(parsed.description.length).toBeGreaterThan(20);
    expect(parsed.url).toBe(SITE_URL);
    expect(parsed.email).toBe("hello@3kh0.net");
    expect(parsed.sameAs).toContain("https://github.com/3kh0");
    expect(parsed.jobTitle).toBeTruthy();
  });
});

describe("llms.txt (llmstxt.org)", () => {
  const body = llmsTxt();

  test("starts with H1 then a blockquote summary", () => {
    const lines = body.trimStart().split("\n");
    expect(lines[0]).toBe("# 3kh0.net");
    expect(lines[1]).toBe("");
    expect(lines[2]?.startsWith("> ")).toBe(true);
  });

  test("has a When to use this section with jobs and how to call", () => {
    expect(body).toContain("## When to use this");
    expect(body).toMatch(/Identify echo/i);
    expect(body).toContain("GET https://3kh0.net/");
    expect(body).toContain("hello@3kh0.net");
    expect(body).toContain("Do not use this site as a security news source");
  });

  test("file lists use the '- [Name](url): description' form", () => {
    expect(body).toMatch(/- \[Homepage\]\(https:\/\/3kh0\.net\/\): /);
    expect(body).toMatch(
      /- \[Agent instructions\]\(https:\/\/3kh0\.net\/agent-instructions\.md\): /,
    );
    expect(body).toMatch(/- \[Sitemap\]\(https:\/\/3kh0\.net\/sitemap\.xml\): /);
  });
});

describe("agent instructions", () => {
  const body = agentInstructionsMd();

  test("names best-fit use cases and how to call the site", () => {
    expect(body.startsWith("# Agent instructions")).toBe(true);
    expect(body).toContain("## When to use this");
    expect(body).toContain("## How to call");
    expect(body).toContain("canonical bio");
    expect(body).toContain("hello@3kh0.net");
    expect(body).toContain("wrong tool");
  });
});

describe("agent-friendly 404", () => {
  test("markdown body points at sitemap, llms.txt, and instructions", () => {
    const md = notFoundMarkdown("/this-path-does-not-exist");
    expect(md.startsWith("# 404 Not Found")).toBe(true);
    expect(md).toContain("`/this-path-does-not-exist`");
    expect(md).toContain(`${SITE_URL}/llms.txt`);
    expect(md).toContain(`${SITE_URL}/sitemap.xml`);
    expect(md).toContain(`${SITE_URL}/agent-instructions.md`);
    expect(md).toContain(`${SITE_URL}/`);
  });

  test("browsers keep HTML; agents and curl get markdown", () => {
    expect(wantsMarkdownNotFound("text/html,application/xhtml+xml")).toBe(false);
    expect(wantsMarkdownNotFound("text/markdown")).toBe(true);
    expect(wantsMarkdownNotFound("text/markdown,text/html")).toBe(true);
    expect(wantsMarkdownNotFound("*/*")).toBe(true);
    expect(wantsMarkdownNotFound("application/json")).toBe(true);
    expect(wantsMarkdownNotFound(undefined)).toBe(true);
  });

  test("API and Nuxt asset paths stay on the default error handler", () => {
    expect(isAgentNotFoundPath("/nope")).toBe(true);
    expect(isAgentNotFoundPath("/api/monitor/github")).toBe(false);
    expect(isAgentNotFoundPath("/_nuxt/foo.js")).toBe(false);
  });
});

describe("sitemap.xml", () => {
  const xml = sitemapXml();

  test("is a urlset of the public agent surfaces", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/llms.txt</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/agent-instructions.md</loc>`);
  });
});

describe("source contracts", () => {
  test("homepage disclosures expose an H2 outline", async () => {
    const vue = await Bun.file("app/components/Disclosure.vue").text();
    expect(vue).toContain("<h2");
    expect(vue).toContain("</h2>");
  });

  test("homepage and config emit JSON-LD", async () => {
    const page = await Bun.file("app/pages/index.vue").text();
    const config = await Bun.file("nuxt.config.ts").text();
    expect(page).toContain("application/ld+json");
    expect(config).toContain("application/ld+json");
  });

  test("robots.txt points at the sitemap", async () => {
    const robots = await Bun.file("public/robots.txt").text();
    expect(robots).toContain("Sitemap: https://3kh0.net/sitemap.xml");
  });
});
