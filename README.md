# peach

yet another website redesign, but this time with a focus formality and tasteful fancy effects. deployed at [3kh0.net](https://3kh0.net) via cloudflare pages.

built with vue + [vite+](https://viteplus.dev) (`vp`). `vp build` prerenders the homepage and 404 page to static html, and the api routes live in `functions/` as cloudflare pages functions.

## development

```bash
vp install
vp dev                  # frontend on :5173
bun run dev:functions   # api on :8788 (vp dev proxies /api to it, run vp build once first)
```

```bash
vp check          # format and lint
vp build          # dist/, ready for pages
bun run preview   # serve dist/ + functions/ locally with wrangler
```

## license

see [LICENSE](LICENSE) for details
