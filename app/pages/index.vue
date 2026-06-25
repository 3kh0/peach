<script setup lang="ts">
type MonitorScreen =
  | "welcome"
  | "cs2"
  | "hackclub"
  | "coinbase"
  | "sourcegraph"
  | "github"
  | "summer"
  | "hackatime"
  | "email"
  | "signal"
  | "telegram"
  | "markets";

const activeScreen = ref<MonitorScreen>("welcome");
const projectsOpen = ref(false);

const set = (s: MonitorScreen = "welcome") => (activeScreen.value = s);

const linkMonitor = (s: MonitorScreen) => {
  const on = () => set(s);
  const off = () => set();
  return { mouseenter: on, focus: on, touchstart: on, mouseleave: off, blur: off };
};
</script>

<template>
  <NuxtErrorBoundary @error="(e) => reportError('home:background', e)">
    <Background />
  </NuxtErrorBoundary>

  <main class="min-h-screen px-6 py-12 sm:px-8 lg:px-12">
    <div class="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center">
      <div class="grid w-full gap-10 lg:grid-cols-[minmax(0,40rem)_minmax(18rem,25rem)] lg:gap-14">
        <div class="flex flex-col justify-center">
          <h1 class="text-3xl text-white sm:text-4xl">hi, i'm echo (aka rowan)</h1>

          <p class="mt-8 max-w-lg text-lg leading-8 text-white/82">
            i am a teenager doing security/infrastructure work for many organizations. i work mostly
            rails, nuxt, and javascript. when i am off the clock i listen to music, study
            <a
              href="https://www.nasdaq.com/market-activity/etf/qqq"
              class="text-blue-400 underline"
              v-on="linkMonitor('markets')"
              >economics and markets</a
            >, play
            <a
              href="https://www.counter-strike.net/"
              class="text-blue-400 underline"
              v-on="linkMonitor('cs2')"
              >counter strike</a
            >, and build fun projects.
          </p>

          <div class="mt-6 flex flex-col gap-3">
            <Disclosure label="work">
              <p class="text-lg leading-8 text-white/82">
                i am currently a freelancer but i have done work with
                <a
                  href="https://hackclub.com"
                  class="text-blue-400 underline"
                  v-on="linkMonitor('hackclub')"
                  >hack club</a
                >,
                <a
                  href="https://coinbase.com"
                  class="text-blue-400 underline"
                  v-on="linkMonitor('coinbase')"
                  >coinbase</a
                >,
                <a
                  href="https://sourcegraph.com"
                  class="text-blue-400 underline"
                  v-on="linkMonitor('sourcegraph')"
                  >sourcegraph</a
                >, local governments, and others in the past.
              </p>
            </Disclosure>

            <Disclosure label="projects" action @activate="projectsOpen = true" />

            <Disclosure label="contact">
              <p class="text-lg leading-8 text-white/82">
                you can reach me via
                <a
                  href="mailto:hello@3kh0.net"
                  class="text-blue-400 underline"
                  v-on="linkMonitor('email')"
                  >email</a
                >,
                <a
                  href="https://signal.me/#eu/EnC26yk3rkDfP2JPoguBZYjCVhMD6_xAGxu1L4UzhdK0bnQgDHdIQLCQjR6eBdZF"
                  class="text-blue-400 underline"
                  v-on="linkMonitor('signal')"
                  >signal</a
                >
                or
                <a
                  href="https://t.me/doober"
                  class="text-blue-400 underline"
                  v-on="linkMonitor('telegram')"
                  >telegram</a
                >.
              </p>
            </Disclosure>

            <Disclosure label="links">
              <p class="mb-2 text-lg leading-8 text-white/82">
                you can find me on other platforms as well:
                <a href="https://github.com/3kh0" class="text-blue-400 underline" target="_blank"
                  >github</a
                >,
                <a
                  href="https://old.reddit.com/u/3kh0_reddit/"
                  class="text-blue-400 underline"
                  target="_blank"
                  >reddit</a
                >, and
                <a
                  href="https://www.youtube.com/@3kh0"
                  class="text-blue-400 underline"
                  target="_blank"
                  >youtube</a
                >. while you are here, enjoy this collection of fun 88x31 buttons!
              </p>
              <div class="mb-2 flex flex-wrap gap-2">
                <img
                  src="/88x31/mlm.png"
                  srcset="/88x31/mlm.png 1x, /88x31/mlm@2x.png 2x"
                  width="88"
                  height="31"
                  alt="MLM 88x31 button"
                  class="transition-transform duration-200 hover:scale-110"
                />
                <a href="https://developer.valvesoftware.com/wiki/Source" target="_blank">
                  <img
                    src="/88x31/source.png"
                    srcset="/88x31/source.png 1x, /88x31/source@2x.png 2x"
                    width="88"
                    height="31"
                    alt="Source Engine 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
                <a href="https://github.com/gorhill/uBlock" target="_blank">
                  <img
                    src="/88x31/ublock.png"
                    srcset="/88x31/ublock.png 1x, /88x31/ublock@2x.png 2x"
                    width="88"
                    height="31"
                    alt="uBlock Origin 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
                <a href="https://www.getmonero.org/" target="_blank">
                  <img
                    src="/88x31/xmr.png"
                    srcset="/88x31/xmr.png 1x, /88x31/xmr@2x.png 2x"
                    width="88"
                    height="31"
                    alt="Monero 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
              </div>
              <p class="mb-2 text-lg leading-8 text-white/82">and of course, a few friends:</p>
              <div class="mb-2 flex flex-wrap gap-2">
                <a href="https://sundial.city/" target="_blank">
                  <img
                    src="/88x31/sundial.gif"
                    srcset="/88x31/sundial.gif 1x, /88x31/sundial@2x.gif 2x"
                    width="88"
                    height="31"
                    alt="sundial.city 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
                <a href="https://aconlin.com/" target="_blank">
                  <img
                    src="/88x31/acon.gif"
                    srcset="/88x31/acon.gif 1x, /88x31/acon@2x.gif 2x"
                    width="88"
                    height="31"
                    alt="aconlin.com 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
                <a href="https://bomberfish.ca/" target="_blank">
                  <img
                    src="/88x31/bomberfish.png"
                    srcset="/88x31/bomberfish.png 1x, /88x31/bomberfish@2x.png 2x"
                    width="88"
                    height="31"
                    alt="bomberfish.ca 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
                <a href="https://glutesha.me/" target="_blank">
                  <img
                    src="/88x31/glutesha.png"
                    srcset="/88x31/glutesha.png 1x, /88x31/glutesha@2x.png 2x"
                    width="88"
                    height="31"
                    alt="glutesha.me 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
                <a href="https://prpl.wtf/" target="_blank">
                  <img
                    src="/88x31/prpl.gif"
                    srcset="/88x31/prpl.gif 1x, /88x31/prpl@2x.gif 2x"
                    width="88"
                    height="31"
                    alt="prpl.wtf 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
                <a href="https://foxmoss.com/" target="_blank">
                  <img
                    src="/88x31/foxmoss.png"
                    srcset="/88x31/foxmoss.png 1x, /88x31/foxmoss@2x.png 2x"
                    width="88"
                    height="31"
                    alt="foxmoss.com 88x31 button"
                    class="transition-transform duration-200 hover:scale-110"
                  />
                </a>
              </div>
              <p class="mb-2 text-lg leading-8 text-white/82">
                if you want to add mine, see below!
              </p>
              <a href="/button.png" target="_blank">
                <img
                  src="/button.png"
                  srcset="/button.png 1x, /button@2x.png 2x"
                  width="88"
                  height="31"
                  alt="3kh0.net 88x31 button"
                  class="transition-transform duration-200 hover:scale-110"
                />
              </a>
            </Disclosure>
          </div>
        </div>

        <div
          class="flex items-center justify-center lg:sticky lg:top-12 lg:h-[calc(100dvh-6rem)] lg:self-start lg:justify-end"
        >
          <div class="flex w-full max-w-100 flex-col gap-4">
            <NuxtErrorBoundary @error="(e) => reportError('home:monitor', e)">
              <Monitor :screen="activeScreen" />
            </NuxtErrorBoundary>
            <NuxtErrorBoundary @error="(e) => reportError('home:music', e)">
              <MusicPlayer />
            </NuxtErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  </main>

  <NuxtErrorBoundary @error="(e) => reportError('home:projects', e)">
    <ProjectsMonitor :open="projectsOpen" @close="projectsOpen = false" />
  </NuxtErrorBoundary>
</template>
