/**
 * Wires the Vue/Nuxt and global browser error channels into reportError so any
 * client-side breakage is logged and beaconed to the server (-> Vercel logs).
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("vue:error", (error, _instance, info) => {
    reportError("vue", error, { info });
  });

  nuxtApp.hook("app:error", (error) => {
    reportError("app", error);
  });

  window.addEventListener("error", (event) => {
    reportError("window", event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError("unhandledrejection", event.reason);
  });
});
