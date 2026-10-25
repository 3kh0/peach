import { readFileSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";
import { defineConfig, lazyPlugins, type Plugin } from "vite-plus";
import { agentInstructionsMd, jsonLdScript, llmsTxt, sitemapXml } from "./shared/site";

const OUT_DIR = "dist";
const SSR_OUT_DIR = ".ssr";

// Static agent surfaces written next to the prerendered HTML.
const AGENT_FILES: Record<string, string> = {
  "llms.txt": llmsTxt(),
  "agent-instructions.md": agentInstructionsMd(),
  "sitemap.xml": sitemapXml(),
};

const fractureSource = readFileSync(
  fileURLToPath(new URL("./src/utils/fracture.js", import.meta.url)),
  "utf8",
).replace("export function", "function");

/**
 * Adds the application/ld+json Person block to <head>, and an inline script that
 * draws the fracture background straight into the prerendered SVG so it is there
 * on first paint instead of after hydration.
 */
const site = (): Plugin => ({
  name: "peach:site",
  transformIndexHtml: () => [
    {
      tag: "script",
      attrs: { type: "application/ld+json" },
      children: jsonLdScript(),
      injectTo: "head",
    },
    {
      tag: "script",
      children: `(function(){${fractureSource}
var s=document.getElementById("fracture");if(s)try{renderFracture(s)}catch(e){}})()`,
      injectTo: "body",
    },
  ],
});

/** Renders `/` and the 404 page into static HTML using the SSR build. */
async function prerender() {
  const { render } = await import(pathToFileURL(`${SSR_OUT_DIR}/entry-server.js`).href);
  const template = await readFile(`${OUT_DIR}/index.html`, "utf8");
  const page = async (path: string) => {
    const { html, teleports } = await render(path);
    return template.replace("<body>", `<body>${teleports}`).replace("<!--app-->", html);
  };

  await writeFile(`${OUT_DIR}/index.html`, await page("/"));
  await writeFile(`${OUT_DIR}/404.html`, await page("/404"));
  for (const [file, body] of Object.entries(AGENT_FILES)) {
    await writeFile(`${OUT_DIR}/${file}`, body);
  }
  await rm(SSR_OUT_DIR, { recursive: true, force: true });
}

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
  },
  plugins: lazyPlugins(() => [vue(), tailwindcss(), Icons({ compiler: "vue3", scale: 1 }), site()]),
  // `bun run dev:functions` serves functions/ on 8788 for the API routes.
  server: {
    proxy: { "/api": "http://localhost:8788" },
  },
  build: {
    outDir: OUT_DIR,
  },
  environments: {
    ssr: {
      build: {
        outDir: SSR_OUT_DIR,
        rollupOptions: { input: "src/entry-server.ts" },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.client);
      await builder.build(builder.environments.ssr);
      await prerender();
    },
  },
});
