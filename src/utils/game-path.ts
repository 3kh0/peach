import { CubicBezierCurve3, Matrix4, Quaternion, Vector3 } from "three";

export interface RoadPathData {
  frames: { p: number[]; up: number[]; right: number[] }[];
  nodes: { p: number[]; q: number[]; c: number[] }[];
}

export interface RoadFrame {
  p: Vector3;
  q: Quaternion;
  s: number;
}

export function roadRotation(out: Quaternion, a: Quaternion, b: Quaternion, t: number) {
  const sign = a.dot(b) < 0 ? -1 : 1;
  return out
    .set(
      a.x * (1 - t) + b.x * t * sign,
      a.y * (1 - t) + b.y * t * sign,
      a.z * (1 - t) + b.z * t * sign,
      a.w * (1 - t) + b.w * t * sign,
    )
    .normalize();
}

export function roadMovementFrames(data: RoadPathData) {
  const curves = roadCurves(data);
  if (!curves.length) return roadFrames(data);
  const frames: RoadFrame[] = [];
  let length = 0;
  curves.forEach((curve, segment) => {
    const a = new Vector3(0, 1, 0).applyQuaternion(
      new Quaternion().fromArray(data.nodes[segment]!.q),
    );
    const b = new Vector3(0, 1, 0).applyQuaternion(
      new Quaternion().fromArray(data.nodes[segment + 1]!.q),
    );
    for (let i = 0; i <= 13; i++) {
      if (segment && !i) continue;
      const t = i / 13;
      const { p, q } = curvePose(curve, a, b, t);
      if (frames.length) length += p.distanceTo(frames.at(-1)!.p);
      frames.push({ p, q, s: length });
    }
  });
  return { frames, length };
}

/** MeshBuilder places objects by normalized curve parameter, not arc length. */
export function roadObjectPose(data: RoadPathData, fraction: number) {
  const curves = roadCurves(data);
  const scaled = Math.max(0, Math.min(1, fraction)) * (curves.length || data.frames.length - 1);
  const index = Math.min((curves.length || data.frames.length - 1) - 1, Math.floor(scaled));
  const t = scaled - index;
  if (!curves.length) {
    const { frames } = roadFrames(data);
    return {
      p: frames[index]!.p.clone().lerp(frames[index + 1]!.p, t),
      q: frames[index]!.q.clone().slerp(frames[index + 1]!.q, t),
    };
  }
  const curve = curves[index]!;
  const a = new Vector3(0, 1, 0).applyQuaternion(new Quaternion().fromArray(data.nodes[index]!.q));
  const b = new Vector3(0, 1, 0).applyQuaternion(
    new Quaternion().fromArray(data.nodes[index + 1]!.q),
  );
  return curvePose(curve, a, b, t);
}

function curvePose(curve: CubicBezierCurve3, a: Vector3, b: Vector3, t: number) {
  const back = curve.v1
    .clone()
    .sub(curve.v0)
    .multiplyScalar((1 - t) ** 2)
    .addScaledVector(curve.v2.clone().sub(curve.v1), 2 * (1 - t) * t)
    .addScaledVector(curve.v3.clone().sub(curve.v2), t * t)
    .normalize()
    .negate();
  const right = a.clone().lerp(b, t).normalize().cross(back).normalize();
  const up = back.clone().cross(right).normalize();
  return {
    p: curve.getPoint(t),
    q: new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, back)),
  };
}

export function roadDifficulty(frames: readonly RoadFrame[]) {
  let bendRate = 0,
    roll = 0;
  let previous: { p: Vector3; forward: Vector3; up: Vector3 } | undefined;
  for (const frame of frames) {
    const forward = new Vector3(0, 0, -1).applyQuaternion(frame.q);
    const up = new Vector3(0, 1, 0).applyQuaternion(frame.q);
    if (previous) {
      const d = frame.p.distanceTo(previous.p);
      if (d > 0.001) bendRate = Math.max(bendRate, forward.angleTo(previous.forward) / d);
      const transportedUp = previous.up
        .clone()
        .applyQuaternion(new Quaternion().setFromUnitVectors(previous.forward, forward));
      roll += up.angleTo(transportedUp);
    }
    previous = { p: frame.p, forward, up };
  }
  const degrees = 180 / Math.PI;
  return {
    bendRate: bendRate * degrees,
    roll: roll * degrees,
  };
}

function roadCurves(data: RoadPathData) {
  return data.nodes.slice(0, -1).map((a, segment) => {
    const b = data.nodes[segment + 1]!;
    const p0 = new Vector3().fromArray(a.p),
      p3 = new Vector3().fromArray(b.p);
    const outgoing = new Vector3().fromArray(a.c).applyQuaternion(new Quaternion().fromArray(a.q));
    const incoming = new Vector3().fromArray(b.c).applyQuaternion(new Quaternion().fromArray(b.q));
    if (segment > 0) outgoing.multiplyScalar(-2);
    return new CubicBezierCurve3(p0, p0.clone().add(outgoing), p3.clone().add(incoming), p3);
  });
}

export function roadFrames(data: RoadPathData) {
  let length = 0;
  const authored: RoadFrame[] = [];
  for (const raw of data.frames) {
    const p = new Vector3().fromArray(raw.p);
    const up = new Vector3().fromArray(raw.up).normalize();
    const right = new Vector3().fromArray(raw.right).normalize();
    const back = new Vector3().crossVectors(right, up).normalize();
    right.crossVectors(up, back).normalize();
    const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, back));
    if (authored.length) length += p.distanceTo(authored[authored.length - 1]!.p);
    authored.push({ p, q, s: length });
  }
  const curves = roadCurves(data);
  if (!curves.length) return { frames: authored, length };
  const frames: RoadFrame[] = [];
  length = 0;
  curves.forEach((curve, segment) => {
    const count = Math.max(40, Math.ceil(curve.getLength() * 2));
    const sections = (authored.length - 1) / curves.length;
    const steps = new Set(Array.from({ length: count + 1 }, (_, i) => i / count));
    for (let i = 0; i <= sections; i++) steps.add(i / sections);
    for (const t of [...steps].sort((a, b) => a - b)) {
      if (segment && t === 0) continue;
      const p = curve.getPoint(t);
      const index = (segment + t) * sections;
      const low = Math.min(authored.length - 2, Math.floor(index));
      const q = authored[low]!.q.clone().slerp(authored[low + 1]!.q, index - low);
      if (frames.length) length += p.distanceTo(frames[frames.length - 1]!.p);
      frames.push({ p, q, s: length });
    }
  });
  return { frames, length };
}
