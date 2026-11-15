export function createGameAudio() {
  let context: AudioContext | undefined;
  let master: GainNode;
  let music: AudioBufferSourceNode | undefined;
  let level: GainNode | undefined;
  let epoch = 0;
  let muted = false;
  let disposed = false;
  const cache = new Map<string, Promise<AudioBuffer | null>>();
  const tracks = ["1_flux", "2_dispatch", "3_flow", "4_scramble", "5_blitz"];
  let track = tracks[0];

  function init() {
    if (disposed) return false;
    if (!context) {
      try {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = muted ? 0 : 0.65;
        master.connect(context.destination);
      } catch {
        return false;
      }
    }
    void context.resume().catch(() => {});
    return true;
  }

  function load(url: string) {
    let promise = cache.get(url);
    if (!promise) {
      const ctx = context!;
      promise = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Audio: ${r.status}`);
          return r.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => null);
      cache.set(url, promise);
    }
    return promise;
  }

  function stopMusic() {
    if (!context || !music || !level) return;
    const now = context.currentTime;
    level.gain.cancelScheduledValues(now);
    level.gain.setTargetAtTime(0, now, 0.08);
    try {
      music.stop(now + 0.4);
    } catch {
      /* already ended */
    }
    music = undefined;
    level = undefined;
  }

  async function playMusic(ambient = false) {
    if (!init()) return;
    const id = ++epoch;
    stopMusic();
    if (!ambient) track = tracks[Math.floor(Math.random() * tracks.length)];
    const name = `${ambient ? "ambient" : "track"}_${track}`;
    const buffer = await load(`/game/${name}.m4a`);
    if (!buffer || id !== epoch || disposed || !context) return;
    music = context.createBufferSource();
    music.buffer = buffer;
    music.loop = true;
    level = context.createGain();
    level.gain.setValueAtTime(0, context.currentTime);
    level.gain.linearRampToValueAtTime(ambient ? 0.55 : 0.85, context.currentTime + 0.3);
    music.connect(level).connect(master);
    music.start();
  }

  async function effect(name: string, volume = 0.65) {
    if (!init()) return;
    const id = epoch;
    const buffer = await load(`/game/${name}.m4a`);
    if (!buffer || disposed || !context || id !== epoch) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(master);
    source.onended = () => gain.disconnect();
    source.start();
  }

  return {
    playMusic,
    effect,
    warm() {
      if (!init()) return;
      for (const name of ["laneswitch", "death", "currencypickup", "gate1"])
        void load(`/game/${name}.m4a`);
    },
    setMuted(value: boolean) {
      muted = value;
      if (context) master.gain.setTargetAtTime(value ? 0 : 0.65, context.currentTime, 0.03);
    },
    pause() {
      if (context) void context.suspend().catch(() => {});
    },
    resume() {
      if (context) void context.resume().catch(() => {});
    },
    dispose() {
      disposed = true;
      epoch++;
      stopMusic();
      if (context) void context.close().catch(() => {});
      cache.clear();
    },
  };
}
