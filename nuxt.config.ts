// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { jsonLdScript } from "./shared/site";

export default defineNuxtConfig({
  compatibilityDate: "2026-04-28",
  devtools: { enabled: true },
  app: {
    head: {
      title: "3kh0.net",
      script: [
        {
          type: "application/ld+json",
          innerHTML: jsonLdScript(),
        },
      ],
      meta: [
        {
          "http-equiv": "onion-location",
          content: "http://aqjeignx5ussinaa64hq3s2phleke6jmworiqe2tmlh4kctklyq6pjqd.onion",
        },
        {
          name: "description",
          content: "personal website of echo, a teenager doing security and infrastructure.",
        },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "3kh0.net" },
        {
          property: "og:description",
          content: "personal website of echo, a teenager doing security and infrastructure.",
        },
        { property: "og:image", content: "/favicon.png" },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "256" },
        { property: "og:image:height", content: "256" },
        { property: "og:image:alt", content: "fox avatar favicon" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: "3kh0.net" },
        {
          name: "twitter:description",
          content: "personal website of echo, a teenager doing security and infrastructure.",
        },
        { name: "twitter:image", content: "/favicon.png" },
      ],
      link: [{ rel: "icon", type: "image/png", href: "/favicon.png" }],
      htmlAttrs: {
        lang: "en",
      },
    },
  },
  css: ["~/assets/index.css"],

  routeRules: {
    "/": {
      headers: {
        vary: "Accept, Accept-Encoding",
      },
    },
  },

  modules: ["@nuxt/image", "@nuxt/icon", "@nuxt/fonts", "@nuxt/eslint", "@nuxt/hints"],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["three"],
    },
  },

  hooks: {
    "nitro:config"(nitroConfig) {
      const handler = fileURLToPath(new URL("./server/error-handler.ts", import.meta.url));
      const existing = nitroConfig.errorHandler;
      nitroConfig.errorHandler = [
        handler,
        ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
      ];
    },
    "vite:extendConfig"(config) {
      const build = ((config as { build?: Record<string, unknown> }).build ??= {});
      const rollupOptions = (build.rollupOptions ??= {}) as {
        onwarn?: (warning: unknown, warn: (w: unknown) => void) => void;
      };
      const prev = rollupOptions.onwarn;
      rollupOptions.onwarn = (warning, warn) => {
        const w = warning as { plugin?: string };
        if (w.plugin === "@tailwindcss/vite:generate:build") return;
        if (w.plugin === "nuxt:module-preload-polyfill") return;
        if (prev) prev(warning, warn);
        else warn(warning);
      };
    },
  },
});
