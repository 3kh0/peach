// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-04-28",
  devtools: { enabled: true },
  app: {
    head: {
      title: "3kh0.net",
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
  css: ["./app/assets/index.css"],

  modules: [
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@nuxt/eslint",
    "@vercel/speed-insights",
    "@vercel/analytics",
    "@nuxt/hints",
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["three"],
    },
  },

  hooks: {
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
