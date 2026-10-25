import { createSSRApp } from "vue";
import { renderToString, type SSRContext } from "vue/server-renderer";
import App from "./App.vue";

export async function render(path: string) {
  const ctx: SSRContext = {};
  const html = await renderToString(createSSRApp(App, { path }), ctx);
  // <Teleport to="body"> markup is collected separately and must be placed in <body>.
  return { html, teleports: ctx.teleports?.body ?? "" };
}
