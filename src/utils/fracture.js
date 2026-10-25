export function renderFracture(svg) {
  const WIDTH = 1600;
  const HEIGHT = 1000;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function createSeed() {
    if (typeof globalThis.crypto?.getRandomValues === "function") {
      const values = new Uint32Array(1);
      globalThis.crypto.getRandomValues(values);
      return values[0] || Math.floor(Math.random() * 0xffffffff);
    }

    return Math.floor(Math.random() * 0xffffffff);
  }

  function mulberry32(seed) {
    let state = seed >>> 0;

    return () => {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createRowPoints(row, rowCount, width, rand) {
    const edge = row === 0 || row === rowCount;
    const n = clamp(clamp(Math.round(width / 215), 4, 10) - 1 + Math.floor(rand() * 3), 3, 11);
    const steps = Array.from({ length: n }, () => 0.9 + rand() * 2.4);
    const total = steps.reduce((s, v) => s + v, 0);
    const yBase = (row / rowCount) * 100;
    const yj = edge ? 0 : (rand() - 0.5) * (4.5 + rand() * 3.5);
    const pts = [{ x: 0, y: yBase }];

    let progress = 0;
    for (const step of steps) {
      progress += step;
      const nx = (progress / total) * 100;
      const xj = (rand() - 0.5) * (2.5 + rand() * 6) * (0.55 + (Math.abs(nx - 50) / 50) * 0.7);
      pts.push({ x: clamp(nx + xj, 0, 100), y: clamp(yBase + yj + (rand() - 0.5) * 2.8, 0, 100) });
    }
    pts.push({ x: 100, y: yBase });

    return pts
      .sort((a, b) => a.x - b.x)
      .map((p, i, arr) => {
        const end = i === 0 || i === arr.length - 1;
        return { x: i === 0 ? 0 : i === arr.length - 1 ? 100 : p.x, y: end ? yBase : p.y };
      });
  }

  // Returns the polygons as one markup string so the DOM is written in a single pass.
  function buildPlane(width, height, seed) {
    const rand = mulberry32(seed + Math.floor(width / 40) * 19 + Math.floor(height / 40) * 31);
    const rows = clamp(Math.ceil(height / 145), 5, 10);
    const grid = [];
    for (let row = 0; row <= rows; row += 1) grid.push(createRowPoints(row, rows, width, rand));

    let markup = "";
    for (let row = 0; row < rows; row += 1) {
      const top = grid[row];
      const bot = grid[row + 1];
      if (!top || !bot) continue;

      let ti = 0,
        bi = 0;
      while (ti < top.length - 1 || bi < bot.length - 1) {
        const tp = top[ti];
        const nt = top[ti + 1];
        const bp = bot[bi];
        const nb = bot[bi + 1];
        if (!tp || !bp) break;

        let poly = null;
        if (nt && nb && rand() > 0.38) {
          poly = [tp, nt, nb, bp];
          ti += 1;
          bi += 1;
        } else if (ti >= top.length - 1 && nb) {
          poly = [tp, bp, nb];
          bi += 1;
        } else if (bi >= bot.length - 1 && nt) {
          poly = [tp, nt, bp];
          ti += 1;
        } else if (nt && nb) {
          if (nt.x + rand() * 5 < nb.x + rand() * 5) {
            poly = [tp, nt, bp];
            ti += 1;
          } else {
            poly = [tp, bp, nb];
            bi += 1;
          }
        }
        if (!poly) break;

        const points = poly.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
        const fill = `rgba(255, 255, 255, ${(rand() * 0.01).toFixed(3)})`;
        const stroke = `rgba(188, 188, 188, ${(0.19 + rand() * 0.11).toFixed(3)})`;
        markup += `<polygon points="${points}" fill="${fill}" stroke="${stroke}"/>`;
      }
    }
    return markup;
  }

  const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);
  svg.style.strokeWidth = `${(1 / pixelRatio).toFixed(3)}px`;
  svg.innerHTML = buildPlane(WIDTH, HEIGHT, createSeed());
}
