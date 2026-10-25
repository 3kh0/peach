import "@fontsource-variable/space-grotesk";
import "./assets/index.css";
import { createApp, createSSRApp } from "vue";
import App from "./App.vue";
import { reportError } from "./utils/report-error";

// Production HTML is prerendered (see vite.config.ts), so hydrate it; dev mounts fresh.
const app = (import.meta.env.DEV ? createApp : createSSRApp)(App, { path: location.pathname });

/**
 * Wires the Vue and global browser error channels into reportError so any
 * client-side breakage is logged and beaconed to the server.
 */
app.config.errorHandler = (error, _instance, info) => {
  reportError("vue", error, { info });
};

window.addEventListener("error", (event) => {
  reportError("window", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  reportError("unhandledrejection", event.reason);
});

app.mount("#app");
