export const SITE_URL = "https://3kh0.net";

export const SITE_NAME = "3kh0.net";

export const PERSON = {
  name: "echo",
  alternateName: ["rowan", "3kh0"] as const,
  jobTitle: "Security and infrastructure freelancer",
  description: "personal website of echo, a teenager doing security and infrastructure.",
  image: `${SITE_URL}/favicon.png`,
};

export const SAME_AS = [
  "https://github.com/3kh0",
  "https://www.youtube.com/@3kh0",
  "https://old.reddit.com/u/3kh0_reddit/",
  "https://t.me/doober",
] as const;

export const CONTACT = {
  emailReveal: `${SITE_URL}/#contact`,
  signal: "https://signal.me/#eu/EnC26yk3rkDfP2JPoguBZYjCVhMD6_xAGxu1L4UzhdK0bnQgDHdIQLCQjR6eBdZF",
  telegram: "https://t.me/doober",
};

export type Project = {
  name: string;
  description: string;
  tech: string[];
  demo?: string;
  repo?: string;
  image: string;
};

export const PROJECTS: Project[] = [
  {
    name: "Rolling Sky Unleashed",
    description:
      "Bullshit-free Unity web port of the hit mobile game, Rolling Sky. All ads, predatory practices, and in-app purchases removed. Playable on desktop and mobile browsers.",
    tech: ["simple-icons:unity", "simple-icons:csharp", "simple-icons:cplusplus"],
    demo: "https://rollingsky.3kh0.net",
    repo: "https://github.com/3kh0/rolling-sky",
    image: "/projects/rolling-sky.webp",
  },
  {
    name: "Stance",
    description:
      "Elegant Polymarket trading terminal for power users and paper trading, with better navigation, more detailed charts, and dedicated support for popular smarts in sports, crypto, and tons more. Built to be ultra performant.",
    tech: ["simple-icons:polygon", "simple-icons:nuxt", "simple-icons:d3"],
    demo: "https://stance.lol",
    repo: "https://github.com/3kh0/stance",
    image: "/projects/stance.png",
  },
  {
    name: "Slick",
    description:
      "Slick is everything you want in a client mod and nothing you don’t. It’s fast, open source, cross-platform, and fully customizable with plugins and themes. Built by people who obsess over the details.",
    tech: ["simple-icons:electron", "simple-icons:javascript", "simple-icons:slack"],
    demo: "https://slickclient.net",
    repo: "https://github.com/3kh0/slick",
    image: "/projects/slick.png",
  },
  {
    name: "Slack Datamine",
    description:
      "Datamining Slack changes from the webpack manifest, revealing new features and design changes often before they're announced.",
    tech: ["simple-icons:javascript", "simple-icons:slack"],
    repo: "https://github.com/3kh0/slack-datamine",
    image: "/projects/slack-datamine.png",
  },
  {
    name: "XNOR",
    description:
      'A little fun music visualizer thingy for the song "XNOR XNOR XNOR" by Frums powered by Three.js.',
    tech: ["simple-icons:threedotjs", "simple-icons:html5", "simple-icons:javascript"],
    demo: "https://xnor.3kh0.net",
    repo: "https://github.com/3kh0/xnor",
    image: "/projects/xnor.png",
  },
  {
    name: "hackclub.com",
    description:
      "The fourth iteration of the Hack Club site completely rebuilt for the next generation of Hack Club. Seen by hundreds of thousands of people every month.",
    tech: ["simple-icons:nextdotjs", "simple-icons:tailwindcss", "simple-icons:typescript"],
    demo: "https://hackclub.com",
    repo: "https://github.com/hackclub/site",
    image: "/projects/site.png",
  },
  {
    name: "Flavortown",
    description:
      "Build projects, earn cookies, get prizes. A Hack Club program built for over 12,000 teenagers.",
    tech: ["simple-icons:rubyonrails", "simple-icons:html5"],
    demo: "https://flavortown.hackclub.com",
    repo: "https://github.com/hackclub/flavortown",
    image: "/projects/flavortown.png",
  },
  {
    name: "Prometheus",
    description:
      "Prometheus is a Slack bot that lets community members take responsibility for keeping high traffic channels tidy and welcoming",
    tech: ["simple-icons:javascript", "simple-icons:slack"],
    repo: "https://github.com/3kh0/prometheus",
    image: "/projects/prometheus.png",
  },
  {
    name: "Hack Club Traffic",
    description:
      "A simple dashboard for visualizing 300 million monthly requests to hackclub.com with the power of Cloudflare GraphQL and TradingView charts",
    tech: ["simple-icons:nuxt", "simple-icons:cloudflare", "simple-icons:graphql"],
    demo: "https://traffic.3kh0.net/",
    repo: "https://github.com/3kh0/hackclub-traffic",
    image: "/projects/hackclub-traffic.png",
  },
  {
    name: "Summer of Making",
    description:
      "A summer-long program that helped more than 20,000 teenagers learn in public, ship ambitious projects, and earn rewards for their work.",
    tech: ["simple-icons:rubyonrails", "simple-icons:html5"],
    demo: "https://summer.hackclub.com",
    repo: "https://github.com/hackclub/summer-of-making",
    image: "/projects/som.png",
  },
  {
    name: "Hackatime",
    description:
      "An open-source WakaTime alternative built for Hack Club, processing more than 400 GB (averaging 900+ requests per minute) of coding heartbeats from teenagers.",
    tech: ["simple-icons:rubyonrails", "simple-icons:postgresql"],
    demo: "https://hackatime.hackclub.com",
    repo: "https://github.com/hackclub/hackatime",
    image: "/projects/hackatime.png",
  },
  {
    name: "Stacked",
    description:
      "An economy game about collecting items, gambling, and fighting other players, built entirely inside Slack.",
    tech: ["simple-icons:javascript", "simple-icons:supabase", "simple-icons:slack"],
    repo: "https://github.com/3kh0/stacked",
    image: "/projects/stacked.png",
  },
  {
    name: "HCBScan",
    description:
      "An public explorer for HCB that lets you search for transactions, view organizations, and hook up your own apps to its API. Indexed over 100,000 activites and growing.",
    tech: ["simple-icons:nuxt", "simple-icons:javascript", "simple-icons:tailwindcss"],
    demo: "https://hcbscan.3kh0.net/app",
    repo: "https://github.com/3kh0/hcbscan",
    image: "/projects/hcbscan.png",
  },
  {
    name: "Echo Net Extras",
    description:
      "A personal collection of small tools, utilities, and experiments that make recurring tasks easier.",
    tech: ["simple-icons:nuxt", "simple-icons:javascript", "simple-icons:tailwindcss"],
    demo: "https://extra.3kh0.net",
    repo: "https://github.com/3kh0/echonet-extra-nuxt",
    image: "/projects/echo-net-extras.png",
  },
  {
    name: "FileHunt",
    description:
      "A search-query builder for finding exposed files on the web through carefully assembled Google dorks.",
    tech: ["simple-icons:nextdotjs", "simple-icons:typescript", "simple-icons:tailwindcss"],
    demo: "https://filehunt.3kh0.net",
    repo: "https://github.com/3kh0/filehunt",
    image: "/projects/filehunt.png",
  },
  {
    name: "The Situation Is Crazy",
    description:
      "A small image generator for making custom screenshots in the style of penguinz0 video thumbnails.",
    tech: ["simple-icons:nextdotjs", "simple-icons:typescript", "simple-icons:tailwindcss"],
    demo: "https://situation.3kh0.net",
    repo: "https://github.com/3kh0/the-situation",
    image: "/projects/situation.png",
  },
  {
    name: "3kh0 Games",
    description:
      "A browser gaming site made for school Chromebooks. It ran for two years, grew into a huge community, and became the project people knew me for.",
    tech: ["simple-icons:html5", "simple-icons:css", "simple-icons:javascript"],
    repo: "https://codeberg.org/3kh0/website-v4/",
    image: "/projects/3kh0-games.png",
  },
  {
    name: "Oxide",
    description:
      "A deliberately simple proxy with no tracking and no unnecessary features, created for the 2024 Titanium Network Proxathon.",
    tech: ["simple-icons:javascript", "simple-icons:html5"],
    repo: "https://github.com/3kh0/Oxide",
    image: "/projects/oxide.png",
  },
  {
    name: "Echodown",
    description:
      "A harmless prank tool that simulates the look of a DDoS attack without sending an actual attack.",
    tech: ["simple-icons:python"],
    repo: "https://github.com/3kh0/echodown",
    image: "/projects/echodown.png",
  },
  {
    name: "3kh0 Lite",
    description:
      "A lightweight spiritual successor to 3kh0 Games, rebuilt to be cleaner, faster, and easier to deploy.",
    tech: ["simple-icons:html5", "simple-icons:css", "simple-icons:javascript"],
    demo: "https://lite.3kh0.net/",
    repo: "https://github.com/3kh0/3kh0-lite",
    image: "/projects/3kh0-lite.png",
  },
];

export const HOMEPAGE_PRODUCES = ["text/html", "text/markdown"] as const;

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

export const VARY_ACCEPT = "Accept, Accept-Encoding";

type AcceptEntry = { type: string; q: number; specificity: number };

export function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((raw) => {
      const parts = raw
        .trim()
        .split(";")
        .map((s) => s.trim());
      const type = (parts[0] ?? "").toLowerCase();
      if (!type) return null;
      let q = 1;
      for (const param of parts.slice(1)) {
        const [name, value] = param.split("=").map((s) => s.trim());
        if (name?.toLowerCase() === "q") {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
        }
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    })
    .filter((e): e is AcceptEntry => e !== null);
}

function matchesAccept(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) return candidate.startsWith(entry.type.slice(0, -1));
  return entry.type === candidate;
}

export function preferredType(
  header: string | null | undefined,
  produces: readonly string[],
): string | null {
  if (!header) return produces[0] ?? null;
  const entries = parseAccept(header);
  if (entries.length === 0) return produces[0] ?? null;

  let best: string | null = null;
  let bestQ = -1;
  let bestPos = Infinity;

  for (const candidate of produces) {
    let matched: AcceptEntry | null = null;
    let matchedPos = Infinity;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!matchesAccept(e, candidate)) continue;
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && i < matchedPos)
      ) {
        matched = e;
        matchedPos = i;
      }
    }
    if (!matched || matched.q <= 0) continue;
    if (matched.q > bestQ || (matched.q === bestQ && matchedPos < bestPos)) {
      bestQ = matched.q;
      bestPos = matchedPos;
      best = candidate;
    }
  }

  return best;
}

export function isHomepagePath(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

export function notAcceptableBody(accept: string): string {
  return `Not Acceptable

Available: ${HOMEPAGE_PRODUCES.join(", ")}

You requested: ${accept}
`;
}

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PERSON.name,
  alternateName: [...PERSON.alternateName],
  url: SITE_URL,
  image: PERSON.image,
  description: PERSON.description,
  jobTitle: PERSON.jobTitle,
  award: "Eagle Scout",
  knowsAbout: ["security", "infrastructure", "Ruby on Rails", "Nuxt", "JavaScript"],
  sameAs: [...SAME_AS],
} as const;

export function jsonLdScript(): string {
  return JSON.stringify(personJsonLd);
}

export function homepageMarkdown(): string {
  const projects = PROJECTS.map((project) => {
    const links = [
      project.demo ? `[demo](${project.demo})` : null,
      project.repo ? `[repo](${project.repo})` : null,
    ]
      .filter(Boolean)
      .join(", ");
    const suffix = links ? ` (${links})` : "";
    return `### ${project.name}

${project.description}${suffix}
`;
  }).join("\n");

  return `# hi, i'm echo (aka rowan)

i am a teenager and eagle scout doing security/infrastructure work for many organizations. i work mostly rails, nuxt, and javascript. when i am off the clock i listen to music, study [economics and markets](https://www.nasdaq.com/market-activity/etf/qqq), play [counter strike](https://www.counter-strike.net/), and build fun projects.

${SITE_NAME} is the personal homepage of echo (also known as rowan / 3kh0). This Markdown representation is the same resource as the HTML homepage, selected when a client sends \`Accept: text/markdown\`.

## work

### freelance and past work

i am currently a freelancer but i have done work with [hack club](https://hackclub.com), [coinbase](https://coinbase.com), [sourcegraph](https://sourcegraph.com), local governments, and others in the past. Stack is mostly Rails, Nuxt, and JavaScript. Eagle Scout.

## projects

### featured projects

a collection of personal and professional projects. more is on [github](https://github.com/3kh0).

${projects}
## contact

### email, signal, and telegram

you can reach me via [signal](${CONTACT.signal}) or [telegram](${CONTACT.telegram}). my email address is no longer published in plain text — too much spam — so it is revealed by a quick human check in the [contact section](${CONTACT.emailReveal}) of the homepage.

## links

### profiles and 88x31 buttons

you can find me on other platforms as well: [github](https://github.com/3kh0), [reddit](https://old.reddit.com/u/3kh0_reddit/), and [youtube](https://www.youtube.com/@3kh0). while you are here, enjoy this collection of fun 88x31 buttons!

- [Source Engine](https://developer.valvesoftware.com/wiki/Source)
- [uBlock Origin](https://github.com/gorhill/uBlock)
- [Monero](https://www.getmonero.org/)
- [sundial.city](https://sundial.city/)
- [aconlin.com](https://aconlin.com/)
- [bomberfish.ca](https://bomberfish.ca/)
- [glutesha.me](https://glutesha.me/)
- [prpl.wtf](https://prpl.wtf/)
- [foxmoss.com](https://foxmoss.com/)
- [vio.gay](https://vio.gay/)
- [3kh0.net 88x31 button](${SITE_URL}/button.png)
`;
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
- Get a current, canonical contact path: Signal, Telegram, or the human-gated email reveal
- Find shipped projects and their demo/repo URLs (Stance, HCBScan, FileHunt, Hackatime, and others)
- Confirm the same person across GitHub, YouTube, and Reddit

How an agent should call this site:

1. GET ${SITE_URL}/llms.txt (this file) or ${SITE_URL}/agent-instructions.md for when-to-use guidance
2. GET ${SITE_URL}/ for the canonical bio — it is server-rendered; JavaScript is not required. Send \`Accept: text/markdown\` for Markdown, or omit it for HTML
3. Contact a human only via the Signal link below, Telegram @doober, or the email address revealed by the human check at ${CONTACT.emailReveal} — the address is not published in plain text and cannot be fetched by an agent, so do not invent or guess one
4. Treat GET ${SITE_URL}/api/monitor/* as private UI data for the homepage monitors, not a public product API
5. POST ${SITE_URL}/api/log is an error-reporting sink; do not send user content there

Do not use this site as a security news source, a general programming tutorial, or a substitute for Hack Club / Coinbase / Sourcegraph docs. It is a personal homepage.

## Identity

- [Homepage](${SITE_URL}/): Canonical bio, work, projects, and contact
- [Agent instructions](${SITE_URL}/agent-instructions.md): When to use this site and how to call it
- [Sitemap](${SITE_URL}/sitemap.xml): Machine-readable URL list

## Contact

- [Email](${CONTACT.emailReveal}): Revealed on the homepage after a Cloudflare Turnstile check — not published in plain text
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
- Get a real contact path (Signal, Telegram, or the human-gated email reveal) rather than guessing handles
- List live demos and repos for that person's projects
- Cross-check identity with GitHub, YouTube, and Reddit

Jobs this site is the wrong tool for:

- General security research or CVE lookup
- Hack Club, Coinbase, or Sourcegraph product documentation
- Placing orders, creating accounts, or any authenticated action — none exist here
- Treating monitor endpoints as a stable public API

## How to call

1. Prefer GET ${SITE_URL}/llms.txt for the curated map, then GET ${SITE_URL}/ for the server-rendered bio (\`Accept: text/markdown\` returns Markdown from the same URL)
2. Parse the homepage JSON-LD (\`Person\`) for name, url, and sameAs
3. Contact only via [Signal](${CONTACT.signal}), [Telegram](${CONTACT.telegram}), or the email address revealed by the Turnstile check at ${CONTACT.emailReveal} — no address is published in plain text, so do not guess or infer one
4. If a path 404s, follow the markdown recovery links to this file, llms.txt, or the sitemap — do not retry invented URLs

## Identity

- Name: ${PERSON.name}
- Also: ${PERSON.alternateName.join(", ")}
- URL: ${SITE_URL}
- Email: revealed at ${CONTACT.emailReveal} after a Turnstile check, not published in plain text
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
