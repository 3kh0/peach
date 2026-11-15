import { Vector3 } from "three";

interface SpeedKey {
  time: number;
  value: number;
  inTangent: number;
  outTangent: number;
}

export function roadSpeed(score: number, keys: readonly SpeedKey[]) {
  const a = keys[0]!,
    b = keys[1]!;
  const span = b.time - a.time;
  const t = Math.max(0, Math.min(1, (score - a.time) / span));
  return (
    ((2 * t ** 3 - 3 * t ** 2 + 1) * a.value +
      (t ** 3 - 2 * t ** 2 + t) * span * a.outTangent +
      (-2 * t ** 3 + 3 * t ** 2) * b.value +
      (t ** 3 - t ** 2) * span * b.inTangent) /
    2
  );
}

const LANE_DURATION = 0.4;
const laneEase = (t: number) => 1 - (1 - Math.max(0, Math.min(1, t / LANE_DURATION))) ** 3;

export class RoadLane {
  lane = 1;
  lateral = 0;
  time = Infinity;
  age = 0;
  private from = 0;
  private firstClick = false;

  turn(to = -this.lane) {
    if (to === this.lane) return;
    // setBranch / Update reconstruct the interrupted canonical cubic, rather
    // than accumulating displacement from earlier aborted changes.
    this.from =
      this.time <= LANE_DURATION
        ? -this.lane * 2.5 + this.lane * 5 * laneEase(this.time)
        : this.firstClick || this.age >= 1
          ? this.lane * 2.5
          : this.lane * 2.5 * this.age;
    this.lane = to;
    this.time = 0;
    this.firstClick = true;
  }

  advance(dt: number) {
    this.age += dt;
    this.time += dt;
    this.lateral = this.firstClick
      ? this.from + (this.lane * 2.5 - this.from) * laneEase(this.time)
      : this.lane * 2.5 * Math.min(1, this.age);
    return this.lateral;
  }
}

/** Main-game MeshBuilder sequence, retaining the requested longer opening. */
export function createObstacleSequence(random: () => number, firstAt = 100) {
  let at = firstAt;
  let lane = -1;
  let forceSwitch = false;
  let coinsAfter = 20;
  let score = 0;
  return {
    next() {
      const gap = (2500 + Math.floor(random() * 1500)) / 100;
      const position = at;
      at += gap;
      if (coinsAfter <= 0) {
        coinsAfter = 5 + Math.floor(random() * 4);
        return { kind: "gem" as const, at: position, lane: random() > 0.5 ? -1 : 1, score };
      }
      const obstacle = { kind: "blocker" as const, at: position, lane, score: ++score };
      const draw = random();
      const change = forceSwitch || draw > 0.2;
      if (change) lane = -lane;
      forceSwitch = !change;
      coinsAfter--;
      return obstacle;
    },
  };
}

interface ColliderData {
  center: number[];
  size: number[];
}
export interface GameplayData {
  speedKeys: SpeedKey[];
  ballRadius: number;
  colliders: Record<string, ColliderData>;
}

/** Prefab transforms, expressed in the rendered road's right/up/back basis. */
export function blockerBoxes(lane: number, data: GameplayData) {
  const hazard = data.colliders[lane > 0 ? "1570" : "1568"]!;
  const gate = data.colliders[lane > 0 ? "1569" : "1566"]!;
  return {
    hazard: {
      center: new Vector3(
        lane * (3 - 2.5 - hazard.center[0]!),
        hazard.center[1]!,
        lane * hazard.center[2]!,
      ),
      half: new Vector3(...(hazard.size as [number, number, number])).multiplyScalar(0.5),
    },
    gate: {
      center: new Vector3(-lane * 2.38, 2.62, 0),
      half: new Vector3(...(gate.size as [number, number, number])).multiplyScalar(0.5),
    },
  };
}

export function sweepSphereBox(
  start: Vector3,
  end: Vector3,
  center: Vector3,
  half: Vector3,
  radius: number,
): number | null {
  const a = start.clone().sub(center).toArray();
  const d = end.clone().sub(start).toArray();
  const h = half.toArray();
  const cuts = [0, 1];
  for (let i = 0; i < 3; i++) {
    if (!d[i]) continue;
    for (const face of [-h[i]!, h[i]!]) {
      const t = (face - a[i]!) / d[i]!;
      if (t > 0 && t < 1) cuts.push(t);
    }
  }
  cuts.sort((x, y) => x - y);
  for (let j = 0; j < cuts.length - 1; j++) {
    const lo = cuts[j]!,
      hi = cuts[j + 1]!;
    const mid = (lo + hi) / 2;
    let A = 0,
      B = 0,
      C = -radius * radius;
    for (let i = 0; i < 3; i++) {
      const p = a[i]! + d[i]! * mid;
      if (Math.abs(p) <= h[i]!) continue;
      const offset = a[i]! - Math.sign(p) * h[i]!;
      A += d[i]! ** 2;
      B += 2 * offset * d[i]!;
      C += offset ** 2;
    }
    if (A * lo * lo + B * lo + C <= 1e-10) return lo;
    const discriminant = B * B - 4 * A * C;
    if (A > 0 && discriminant >= 0) {
      const root = (-B - Math.sqrt(discriminant)) / (2 * A);
      if (root >= lo - 1e-10 && root <= hi + 1e-10) return Math.max(lo, root);
    }
  }
  return null;
}
