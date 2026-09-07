# peach

yet another website redesign, but this time with a focus formality and tasteful fancy effects. deployed at [3kh0.net](https://3kh0.net) via cloudflare pages.

## development

```bash
bun install
cp .env.example .env   # then fill in NUXT_TURNSTILE_SECRET
bun dev
```

## contact gate

the email address is not published anywhere in the HTML, the JSON-LD, `llms.txt`,
the markdown homepage, or the JS bundle. it lives in server-only runtime config
and `POST /api/contact-email` hands it out only after cloudflare turnstile
siteverify confirms the token, its `reveal-email` action, and an allowed hostname.

deploying needs one encrypted variable on the pages project:

| variable                | value                                                      |
| ----------------------- | ---------------------------------------------------------- |
| `NUXT_TURNSTILE_SECRET` | secret half of turnstile widget `0x4AAAAAAEr2UitoTPwFmI-P` |

the sitekey is public and already defaulted in `nuxt.config.ts`. production
hostnames default to `3kh0.net,www.3kh0.net`; set `NUXT_TURNSTILE_HOSTNAMES` to
override. for `bun dev` to work the widget also needs `localhost` in its domain
list in the turnstile dashboard.

## license

see [LICENSE](LICENSE) for details
