import { Ray, Vector3 } from "three";
import type { RoadFrame } from "./game-path";

const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);
const FORWARD = new Vector3(0, 0, -1);

export function roadIsReadable(frames: readonly RoadFrame[]) {
  const length = frames.at(-1)!.s;
  const sample = (s: number) => {
    if (s >= length) {
      const end = frames.at(-1)!;
      return {
        p: end.p.clone().addScaledVector(FORWARD.clone().applyQuaternion(end.q), s - length),
        q: end.q,
      };
    }
    let low = 0,
      high = frames.length - 1;
    while (low + 1 < high) {
      const mid = (low + high) >> 1;
      if (frames[mid]!.s < s) low = mid;
      else high = mid;
    }
    const a = frames[low]!,
      b = frames[high]!;
    const t = (s - a.s) / Math.max(0.00001, b.s - a.s);
    return { p: a.p.clone().lerp(b.p, t), q: a.q.clone().slerp(b.q, t) };
  };
  const surface: { left: Vector3; right: Vector3 }[] = [];
  for (let s = 0; s < length + 4; s += 4) {
    const f = sample(Math.min(s, length));
    const top = f.p.addScaledVector(UP.clone().applyQuaternion(f.q), 0.2);
    const across = RIGHT.clone().applyQuaternion(f.q).multiplyScalar(5);
    surface.push({ left: top.clone().sub(across), right: top.clone().add(across) });
  }
  const ray = new Ray(),
    hit = new Vector3();
  const halfFov = Math.tan((50 * Math.PI) / 180);
  for (let s = 0; s <= length; s += 12) {
    const here = sample(s),
      ahead = sample(s + 70);
    const up = UP.clone().applyQuaternion(here.q);
    const right = RIGHT.clone().applyQuaternion(here.q);
    const forward = FORWARD.clone().applyQuaternion(here.q);
    const viewForward = forward.clone().addScaledVector(up, -0.2126).normalize();
    const viewUp = new Vector3().crossVectors(right, viewForward).normalize();
    for (const cameraSide of [-1.5, 1.5]) {
      const eye = here.p
        .clone()
        .addScaledVector(up, 7)
        .addScaledVector(forward, -8.8)
        .addScaledVector(right, cameraSide);
      for (const lane of [-2.5, 2.5]) {
        const target = ahead.p
          .clone()
          .addScaledVector(UP.clone().applyQuaternion(ahead.q), 2.85)
          .addScaledVector(RIGHT.clone().applyQuaternion(ahead.q), lane);
        const direction = target.sub(eye);
        const depth = direction.dot(viewForward);
        if (
          depth <= 0 ||
          Math.abs(direction.dot(viewUp)) > depth * halfFov * 0.85 ||
          Math.abs(direction.dot(right)) > depth * halfFov * 0.46 * 0.9
        )
          return false;
        const distance = direction.length();
        ray.set(eye, direction.divideScalar(distance));
        for (let i = 1; i < surface.length; i++) {
          const a = surface[i - 1]!,
            b = surface[i]!;
          if (
            (ray.intersectTriangle(a.left, a.right, b.left, false, hit) ||
              ray.intersectTriangle(a.right, b.right, b.left, false, hit)) &&
            eye.distanceTo(hit) < distance - 0.15
          )
            return false;
        }
      }
    }
  }
  return true;
}
