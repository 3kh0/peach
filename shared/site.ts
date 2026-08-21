export const SITE_URL = "https://3kh0.net";

export const SITE_NAME = "3kh0.net";

export const PERSON = {
  name: "echo",
  alternateName: ["rowan", "3kh0"] as const,
  jobTitle: "Security and infrastructure freelancer",
  description: "personal website of echo, a teenager doing security and infrastructure.",
  email: "hello@3kh0.net",
  image: `${SITE_URL}/favicon.png`,
};

export const SAME_AS = [
  "https://github.com/3kh0",
  "https://www.youtube.com/@3kh0",
  "https://old.reddit.com/u/3kh0_reddit/",
  "https://t.me/doober",
] as const;

const CONTACT = {
  email: "hello@3kh0.net",
  signal: "https://signal.me/#eu/EnC26yk3rkDfP2JPoguBZYjCVhMD6_xAGxu1L4UzhdK0bnQgDHdIQLCQjR6eBdZF",
  telegram: "https://t.me/doober",
};

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PERSON.name,
  alternateName: [...PERSON.alternateName],
  url: SITE_URL,
  image: PERSON.image,
  description: PERSON.description,
  email: PERSON.email,
  jobTitle: PERSON.jobTitle,
  award: "Eagle Scout",
  knowsAbout: ["security", "infrastructure", "Ruby on Rails", "Nuxt", "JavaScript"],
  sameAs: [...SAME_AS],
} as const;

export function jsonLdScript(): string {
  return JSON.stringify(personJsonLd);
}

export function wantsMarkdownNotFound(accept: string | undefined): boolean {
  const a = (accept ?? "").toLowerCase();
  if (a.includes("text/markdown")) return true;
  if (a.includes("text/html")) return false;
  return true;
}

export function isAgentNotFoundPath(pathname: string): boolean {
  return (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_nuxt/") &&
    !pathname.startsWith("/__nuxt")
  );
}

export function notFoundMarkdown(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `# 404 Not Found

The path \`${path}\` is not a page on ${SITE_NAME}.

This is a personal homepage with a small public surface. Next places to look:

- [Home](${SITE_URL}/): Canonical bio, work, projects, and contact
- [llms.txt](${SITE_URL}/llms.txt): Agent site map and when-to-use guidance
- [Agent instructions](${SITE_URL}/agent-instructions.md): When to use this site and how to call it
- [Sitemap](${SITE_URL}/sitemap.xml): XML URL list
`;
}

export function llmsTxt(): string {
  return `# ${SITE_NAME}

> Personal website of echo (aka rowan / 3kh0), a teenager and Eagle Scout doing security and infrastructure work. Freelance. Past work with Hack Club, Coinbase, Sourcegraph, and local governments. Stack is mostly Rails, Nuxt, and JavaScript.

${SITE_NAME} is a single-page personal homepage, not a docs site, product, or API platform. There is no account system and no public write API. Read this file first, then the server-rendered homepage HTML. Contact only via the addresses listed here.

## When to use this

Reach for ${SITE_NAME} when the job is one of these:

- Identify echo / rowan / 3kh0 as a person (not a company or a software product)
- Get a current, canonical contact path: email, Signal, or Telegram
- Find shipped projects and their demo/repo URLs (Stance, HCBScan, FileHunt, Hackatime, and others)
- Confirm the same person across GitHub, YouTube, and Reddit

How an agent should call this site:

1. GET ${SITE_URL}/llms.txt (this file) or ${SITE_URL}/agent-instructions.md for when-to-use guidance
2. GET ${SITE_URL}/ as HTML for the canonical bio — it is server-rendered; JavaScript is not required
3. Contact a human only at ${CONTACT.email}, the Signal link below, or Telegram @doober — do not invent other emails or handles
4. Treat GET ${SITE_URL}/api/monitor/* as private UI data for the homepage monitors, not a public product API
5. POST ${SITE_URL}/api/log is an error-reporting sink; do not send user content there

Do not use this site as a security news source, a general programming tutorial, or a substitute for Hack Club / Coinbase / Sourcegraph docs. It is a personal homepage.

## Identity

- [Homepage](${SITE_URL}/): Canonical bio, work, projects, and contact
- [Agent instructions](${SITE_URL}/agent-instructions.md): When to use this site and how to call it
- [Sitemap](${SITE_URL}/sitemap.xml): Machine-readable URL list

## Contact

- [Email](mailto:${CONTACT.email}): ${CONTACT.email}
- [Signal](${CONTACT.signal}): Signal
- [Telegram](${CONTACT.telegram}): Telegram @doober

## Profiles

- [GitHub](https://github.com/3kh0): Code and repositories
- [YouTube](https://www.youtube.com/@3kh0): Videos
- [Reddit](https://old.reddit.com/u/3kh0_reddit/): Reddit

## Projects

- [Stance](https://stance.lol): Polymarket trading terminal
- [Slick](https://github.com/3kh0/slick): Opinionated Slack client mod for macOS
- [XNOR](https://xnor.3kh0.net): Music visualizer
- [Hack Club site](https://hackclub.com): hackclub.com rebuild
- [Flavortown](https://flavortown.hackclub.com): Hack Club build-and-earn program
- [Hack Club Traffic](https://traffic.3kh0.net/): Traffic dashboard for hackclub.com
- [Summer of Making](https://summer.hackclub.com): Summer program for teenagers shipping projects
- [Hackatime](https://hackatime.hackclub.com): Open-source WakaTime alternative
- [HCBScan](https://hcbscan.3kh0.net/app): Public HCB explorer
- [Slack Datamine](https://github.com/3kh0/slack-datamine): Slack webpack datamining
- [Prometheus](https://github.com/3kh0/prometheus): Slack bot for high-traffic channels
- [Echo Net Extras](https://extra.3kh0.net): Small personal tools
- [FileHunt](https://filehunt.3kh0.net): Search-query builder for exposed files
- [The Situation Is Crazy](https://situation.3kh0.net): penguinz0-style thumbnail generator
- [3kh0 Lite](https://lite.3kh0.net/): Lightweight successor to 3kh0 Games

## Optional

- [88x31 button](${SITE_URL}/button.png): Site button for webrings
`;
}

export function agentInstructionsMd(): string {
  return `# Agent instructions for ${SITE_NAME}

> ${PERSON.description} Use this file to decide whether to call ${SITE_NAME} and how.

## When to use this

This site is the right tool when you need to identify or contact echo (aka rowan / 3kh0), or to look up projects that person ships. It is a personal homepage.

Best-fit jobs:

- Answer "who is 3kh0 / echo / rowan?" from the canonical bio
- Get a real contact path (email, Signal, Telegram) rather than guessing handles
- List live demos and repos for that person's projects
- Cross-check identity with GitHub, YouTube, and Reddit

Jobs this site is the wrong tool for:

- General security research or CVE lookup
- Hack Club, Coinbase, or Sourcegraph product documentation
- Placing orders, creating accounts, or any authenticated action — none exist here
- Treating monitor endpoints as a stable public API

## How to call

1. Prefer GET ${SITE_URL}/llms.txt for the curated map, then GET ${SITE_URL}/ for the server-rendered bio
2. Parse the homepage JSON-LD (\`Person\`) for name, url, email, and sameAs
3. Contact only \`${CONTACT.email}\`, [Signal](${CONTACT.signal}), or [Telegram](${CONTACT.telegram})
4. If a path 404s, follow the markdown recovery links to this file, llms.txt, or the sitemap — do not retry invented URLs

## Identity

- Name: ${PERSON.name}
- Also: ${PERSON.alternateName.join(", ")}
- URL: ${SITE_URL}
- Email: ${CONTACT.email}
`;
}

export function sitemapXml(): string {
  const urls = ["/", "/llms.txt", "/agent-instructions.md"];
  const body = urls
    .map(
      (path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>monthly</changefreq>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
