import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Quaternion,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  Vector4,
  WebGLRenderer,
  CanvasTexture,
  PlaneGeometry,
  ShaderMaterial,
  DataTexture,
  RGBAFormat,
  Points,
  PointsMaterial,
  AdditiveBlending,
  type Texture,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GameBloom } from "./game-bloom";
import {
  roadDifficulty,
  roadFrames,
  roadMovementFrames,
  roadObjectPose,
  roadRotation,
  type RoadFrame as Frame,
  type RoadPathData,
} from "./game-path";
import { createRoadCourse } from "./game-course";
import { roadIsReadable } from "./game-visibility";
import {
  blockerBoxes,
  createObstacleSequence,
  RoadLane,
  roadSpeed,
  sweepSphereBox,
  type GameplayData,
} from "./game-gameplay";

interface MeshData {
  positions: number[];
  uv: number[];
  indices: number[];
}
interface RoadData extends RoadPathData {
  name: string;
  left: MeshData;
  right: MeshData;
  nativeLength: number | null;
}
interface Bundle {
  roads: RoadData[];
  ball: MeshData;
  obstacle: MeshData;
  gameplay: GameplayData;
}
interface Road {
  name: string;
  geometry: BufferGeometry[];
  frames: Frame[];
  length: number;
  movement: Frame[];
  source: RoadData;
  nativeLength: number;
}
interface Chunk {
  group: Group;
  from: number;
  to: number;
  frames: Frame[];
  movement: Frame[];
  nativeFrom: number;
  road: Road;
}
interface Obstacle {
  mesh: Group;
  at: number;
  lane: number;
  passed: boolean;
  score: number;
  inverse: Matrix4;
  boxes: ReturnType<typeof blockerBoxes>;
}
interface Gem {
  mesh: Mesh;
  at: number;
  lane: number;
  taken: boolean;
}
export type GamePhase = "ready" | "running" | "paused" | "crashing" | "dead";
interface Callbacks {
  score(value: number): void;
  gem(): void;
  crash(): void;
  dead(): void;
  gate(value: number): void;
}

const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);
const BACK = new Vector3(0, 0, 1);
const LANE = 2.5;
const RADIUS = 1.7;
const AHEAD = 800;
const COLOR_RATE = 0.5;
const EXPLOSION_DURATION = 1.1;

function geometry(data: MeshData) {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(data.positions, 3));
  if (data.uv.length) g.setAttribute("uv", new Float32BufferAttribute(data.uv, 2));
  g.setIndex(data.indices);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function makeRoad(data: RoadData): Road {
  const surface = roadFrames(data);
  const movement = roadMovementFrames(data);
  return {
    name: data.name,
    geometry: [geometry(data.left), geometry(data.right)],
    frames: surface.frames.map((f) => ({ ...f, s: (f.s * movement.length) / surface.length })),
    movement: movement.frames,
    length: movement.length,
    source: data,
    nativeLength: data.nativeLength || movement.length,
  };
}

/** Runs exclusively on exported Three.js geometry; no Unity runtime or emulation. */
export async function createGameEngine(host: HTMLElement, cb: Callbacks, signal: AbortSignal) {
  const response = await fetch("/game/scene.json", { signal });
  if (!response.ok) throw new Error("Could not load the road. Please reload to try again.");
  const data: Bundle = await response.json();
  const { gameplay } = data;
  const [texture, flareTexture, vertexShader, fragmentShader] = await Promise.all([
    new TextureLoader().loadAsync("/game/road.png"),
    new TextureLoader().loadAsync("/game/ParticleFlare.png"),
    fetch("/game/road.vertex.glsl", { signal }).then((r) => {
      if (!r.ok) throw new Error("Road shader failed to load");
      return r.text();
    }),
    fetch("/game/road.fragment.glsl", { signal }).then((r) => {
      if (!r.ok) throw new Error("Road shader failed to load");
      return r.text();
    }),
    document.fonts.load("192px RoadAthletic", "0123456789"),
  ]);
  if (signal.aborted) {
    texture.dispose();
    throw new DOMException("Aborted", "AbortError");
  }
  const roads = data.roads.map(makeRoad);
  const difficulty = new Map(roads.map((road) => [road, roadDifficulty(road.frames)]));
  const readable = new Map(roads.map((road) => [road, roadIsReadable(road.frames)]));
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  const white = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat);
  white.needsUpdate = true;
  const shaderTime = new Vector4();
  function nativeMaterial(map: Texture = white) {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: DoubleSide,
      uniforms: {
        _MainTex: { value: map },
        _MainTex_ST: { value: new Vector4(1, 1, 0, 0) },
        _Color: { value: new Vector4(1, 0.218104, 0, 1) },
        _WorldSpaceLightPos0: { value: new Vector4(0.3, 0.8, 0.4, 0) },
        _LightColor0: { value: new Vector4(1, 1, 1, 1) },
        glstate_lightmodel_ambient: { value: new Vector4(0.5, 0.5, 0.5, 1) },
        _refl: { value: 0.1 },
        _saturation: { value: 1 },
        _brightness: { value: 1 },
        _Time: { value: shaderTime },
        _timeScale: { value: 0.7 * COLOR_RATE },
        _scale: { value: 0.02 * COLOR_RATE },
        _offset: { value: 0 },
        _freeze: { value: 0 },
        _colorOffset: { value: 0 },
        _lastChunk: { value: 0 },
        _pathLength: { value: 1 },
        _startWorldPos: { value: new Vector4(0, 0, 0, 0) },
        _EndWorldPos: { value: new Vector4(0, 0, -80, 0) },
        inverseModelMatrix: { value: new Matrix4() },
        viewProjectionMatrix: { value: new Matrix4() },
      },
    });
  }
  const roadMaterial = nativeMaterial(texture);
  const solid = nativeMaterial();
  const gemMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const ballGeometry = geometry(data.ball).scale(170, 170, 170);
  const obstacleGeometry = geometry(data.obstacle);
  const obstacleMaterial = nativeMaterial();
  const gemGeometry = new OctahedronGeometry(0.6);
  const labelGeometry = new PlaneGeometry(2.8, 2.8);
  const labels: MeshBasicMaterial[] = [];
  for (let i = 0; i < 10; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#09000e";
    context.font = "192px RoadAthletic";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(i), 128, 140);
    labels.push(
      new MeshBasicMaterial({
        map: new CanvasTexture(canvas),
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    );
  }
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.domElement.setAttribute("aria-label", "Game playing field");
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
  host.appendChild(renderer.domElement);
  const scene = new Scene();
  scene.background = new Color(0);
  const camera = new PerspectiveCamera(100, 1, 4, 600);
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new GameBloom();
  composer.addPass(renderPass);
  composer.addPass(bloom);
  const ball = new Mesh(ballGeometry, solid);
  scene.add(ball);
  const sparkCount = 220;
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkVelocities: Vector3[] = [];
  const sparkGeometry = new BufferGeometry();
  sparkGeometry.setAttribute("position", new Float32BufferAttribute(sparkPositions, 3));
  const sparkMaterial = new PointsMaterial({
    map: flareTexture,
    size: 1.4,
    color: 0xffddab,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    opacity: 0,
    sizeAttenuation: true,
  });
  const sparks = new Points(sparkGeometry, sparkMaterial);
  sparks.frustumCulled = false;
  scene.add(sparks);
  let chunks: Chunk[] = [];
  let obstacles: Obstacle[] = [];
  let gems: Gem[] = [];
  let phase: GamePhase = "ready";
  let autoplay = false;
  let distance = 0;
  let score = 0;
  let elapsed = 0;
  let laneMotion = new RoadLane();
  let lateral = 0;
  let speed = 100;
  let built = 0;
  let nativeBuilt = 0;
  let obstacleSequence: ReturnType<typeof createObstacleSequence>;
  let nextSlot: ReturnType<ReturnType<typeof createObstacleSequence>["next"]>;
  let nextRoad: (clearance: (road: Road) => number) => Road;
  let random: () => number;
  let courseSeed = 0;
  let runTime = 0;
  let cameraX = 1.5;
  let crashTime = 0;
  let raf = 0;
  let previous = 0;
  let disposed = false;
  const endPosition = new Vector3();
  const endRotation = new Quaternion();
  const p = new Vector3();
  const q = new Quaternion();
  const right = new Vector3();
  const up = new Vector3();
  const back = new Vector3();
  const target = new Vector3();
  const ballFrame = new Quaternion();
  const beforeBall = new Vector3();
  const collisionStart = new Vector3();
  const collisionEnd = new Vector3();

  function bindNative(
    mesh: Mesh,
    from: number,
    length: number,
    start: Vector3,
    end: Vector3,
    flip = false,
  ) {
    mesh.onBeforeRender = (_renderer, _scene, cam, _geometry, material) => {
      const m = material as ShaderMaterial;
      m.uniforms.inverseModelMatrix!.value.copy(mesh.matrixWorld).invert();
      m.uniforms.viewProjectionMatrix!.value.multiplyMatrices(
        cam.projectionMatrix,
        cam.matrixWorldInverse,
      );
      m.uniforms._startWorldPos!.value.set(start.x, start.y, start.z, 0);
      m.uniforms._EndWorldPos!.value.set(end.x, end.y, end.z, 0);
      m.uniforms._offset!.value = from / 700;
      m.uniforms._pathLength!.value = length / 700;
      m.uniforms._MainTex_ST!.value.x = flip ? -1 : 1;
      m.uniformsNeedUpdate = true;
    };
  }
  ball.onBeforeRender = (_renderer, _scene, cam) => {
    const chunk = chunks.find((c) => c.to >= distance) ?? chunks[0]!;
    const first = chunk.frames[0]!.p,
      last = chunk.frames[chunk.frames.length - 1]!.p;
    solid.uniforms.inverseModelMatrix!.value.copy(ball.matrixWorld).invert();
    solid.uniforms.viewProjectionMatrix!.value.multiplyMatrices(
      cam.projectionMatrix,
      cam.matrixWorldInverse,
    );
    solid.uniforms._startWorldPos!.value.set(first.x, first.y, first.z, 0);
    solid.uniforms._EndWorldPos!.value.set(last.x, last.y, last.z, 0);
    solid.uniforms._offset!.value = chunk.from / 700;
    solid.uniforms._pathLength!.value = (chunk.to - chunk.from) / 700;
    solid.uniformsNeedUpdate = true;
  };

  function append(road: Road) {
    const group = new Group();
    for (const geo of road.geometry) group.add(new Mesh(geo, roadMaterial));
    const first = road.frames[0]!;
    group.quaternion.copy(endRotation).multiply(first.q.clone().invert());
    group.position.copy(endPosition).sub(first.p.clone().applyQuaternion(group.quaternion));
    scene.add(group);
    const transform = (path: Frame[]) =>
      path.map((f) => ({
        p: f.p.clone().applyQuaternion(group.quaternion).add(group.position),
        q: group.quaternion.clone().multiply(f.q),
        s: f.s + built,
      }));
    const frames = transform(road.frames),
      movement = transform(road.movement);
    chunks.push({
      group,
      from: built,
      to: built + road.length,
      frames,
      movement,
      road,
      nativeFrom: nativeBuilt,
    });
    nativeBuilt += road.nativeLength;
    built += road.length;
    const end = frames[frames.length - 1]!;
    group.children.forEach((mesh, i) =>
      bindNative(mesh as Mesh, built - road.length, road.length, frames[0]!.p, end.p, i === 1),
    );
    endPosition.copy(end.p);
    endRotation.copy(end.q);
  }

  function extend() {
    while (built < distance + AHEAD) append(nextRoad(placementClearance));
  }

  function placementClearance(road: Road) {
    const rotation = endRotation.clone().multiply(road.frames[0]!.q.clone().invert());
    const offset = endPosition.clone().sub(road.frames[0]!.p.clone().applyQuaternion(rotation));
    // Check the join too: two readable pieces can form a blind crest together.
    const tail = chunks.flatMap((chunk) => chunk.frames).filter((f) => f.s >= built - 80);
    const head = road.frames
      .filter((f) => f.s <= 90)
      .map((f) => ({
        p: f.p.clone().applyQuaternion(rotation).add(offset),
        q: rotation.clone().multiply(f.q),
        s: built + f.s,
      }));
    const joined = [...tail, ...head];
    if (joined.length > 1) {
      const start = joined[0]!.s;
      if (!roadIsReadable(joined.map((f) => ({ ...f, s: f.s - start })))) return -Infinity;
    }
    let minimum = Infinity;
    let checkedAt = -Infinity;
    const world = new Vector3();
    for (let i = 0; i < road.frames.length; i++) {
      const frame = road.frames[i]!;
      if (i !== road.frames.length - 1 && frame.s - checkedAt < 8) continue;
      checkedAt = frame.s;
      world.copy(frame.p).applyQuaternion(rotation).add(offset);
      for (const chunk of chunks) {
        let previous: Frame | undefined;
        for (const old of chunk.frames) {
          if (previous && old.s - previous.s < 8 && old !== chunk.frames.at(-1)) continue;
          if (previous && built + frame.s - old.s > 65) {
            const ax = old.p.x - previous.p.x,
              ay = old.p.y - previous.p.y,
              az = old.p.z - previous.p.z;
            const dx = world.x - previous.p.x,
              dy = world.y - previous.p.y,
              dz = world.z - previous.p.z;
            const t = Math.max(
              0,
              Math.min(
                1,
                (dx * ax + dy * ay + dz * az) / Math.max(0.001, ax * ax + ay * ay + az * az),
              ),
            );
            minimum = Math.min(minimum, Math.hypot(dx - ax * t, dy - ay * t, dz - az * t));
          }
          previous = old;
        }
      }
    }
    return minimum;
  }

  function sample(s: number, out: Vector3, rot: Quaternion, movement = false) {
    const chunk = chunks.find((c) => s <= c.to) ?? chunks[chunks.length - 1]!;
    const frames = movement ? chunk.movement : chunk.frames;
    if (s < chunk.from) {
      out
        .copy(frames[0]!.p)
        .addScaledVector(back.copy(BACK).applyQuaternion(frames[0]!.q), chunk.from - s);
      rot.copy(frames[0]!.q);
      return;
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
    const t = Math.max(0, Math.min(1, (s - a.s) / Math.max(0.001, b.s - a.s)));
    out.lerpVectors(a.p, b.p, t);
    if (movement) roadRotation(rot, a.q, b.q, t);
    else rot.slerpQuaternions(a.q, b.q, t);
  }

  function place(s: number, x: number, y: number, out: Vector3, rot: Quaternion, movement = false) {
    sample(s, out, rot, movement);
    out
      .addScaledVector(right.copy(RIGHT).applyQuaternion(rot), x)
      .addScaledVector(up.copy(UP).applyQuaternion(rot), y);
  }

  function planObstacles() {
    while (nextSlot.at < Math.min(nativeBuilt, distance + 650)) {
      const slot = nextSlot;
      nextSlot = obstacleSequence.next();
      const chunk = chunks.find((c) => slot.at <= c.nativeFrom + c.road.nativeLength)!;
      const fraction = (slot.at - chunk.nativeFrom) / chunk.road.nativeLength;
      const pose = roadObjectPose(chunk.road.source, fraction);
      pose.p.applyQuaternion(chunk.group.quaternion).add(chunk.group.position);
      pose.q.premultiply(chunk.group.quaternion);
      const index = Math.min(
        chunk.movement.length - 2,
        Math.floor(fraction * (chunk.movement.length - 1)),
      );
      const t = fraction * (chunk.movement.length - 1) - index;
      const at = chunk.movement[index]!.s * (1 - t) + chunk.movement[index + 1]!.s * t;
      const side = slot.lane;
      if (slot.kind === "gem") {
        const gem = new Mesh(gemGeometry, gemMaterial);
        gem.position
          .copy(pose.p)
          .addScaledVector(right.copy(RIGHT).applyQuaternion(pose.q), side * 3)
          .addScaledVector(up.copy(UP).applyQuaternion(pose.q), 2.4);
        gem.quaternion.copy(pose.q);
        scene.add(gem);
        gems.push({ mesh: gem, at, lane: side, taken: false });
        continue;
      }
      const mesh = new Group();
      const diamond = new Mesh(obstacleGeometry, obstacleMaterial);
      // The extracted diamond's inner tip is at x=0; its body extends outward.
      diamond.scale.x = side;
      diamond.position.x = side * 0.5;
      mesh.add(diamond);
      const text = String(slot.score);
      for (let i = 0; i < text.length; i++) {
        const label = new Mesh(labelGeometry, labels[Number(text[i])]!);
        const spacing = 1.55 * Math.min(1, 3 / text.length);
        label.scale.setScalar(Math.min(1, 3 / text.length));
        label.position.set(side * 4 + (i - (text.length - 1) / 2) * spacing, 2.65, 2.95);
        mesh.add(label);
      }
      mesh.position.copy(pose.p);
      mesh.quaternion.copy(pose.q);
      bindNative(
        diamond,
        at,
        1,
        mesh.position.clone(),
        mesh.position.clone().add(new Vector3(0, 0, -1)),
      );
      scene.add(mesh);
      mesh.updateMatrixWorld(true);
      obstacles.push({
        mesh,
        at,
        lane: side,
        passed: false,
        score: slot.score,
        inverse: mesh.matrixWorld.clone().invert(),
        boxes: blockerBoxes(side, gameplay),
      });
    }
  }

  function cleanWorld() {
    for (const c of chunks) scene.remove(c.group);
    for (const o of obstacles) scene.remove(o.mesh);
    for (const g of gems) scene.remove(g.mesh);
    chunks = [];
    obstacles = [];
    gems = [];
  }

  function reset() {
    cleanWorld();
    const previousSeed = courseSeed;
    do {
      courseSeed = crypto.getRandomValues(new Uint32Array(1))[0]!;
    } while (courseSeed === previousSeed);
    const course = createRoadCourse(roads, courseSeed, (road) => {
      const d = difficulty.get(road)!;
      return d.roll <= 65 && d.bendRate <= 0.9 && readable.get(road)!;
    });
    random = course.random;
    nextRoad = course.nextRoad;
    distance = score = elapsed = runTime = 0;
    built = -80;
    nativeBuilt = -80;
    laneMotion = new RoadLane();
    lateral = 0;
    speed = 0;
    obstacleSequence = createObstacleSequence(random);
    nextSlot = obstacleSequence.next();
    cameraX = 0;
    endPosition.set(0, 0, 80);
    endRotation.identity();
    ball.visible = true;
    phase = "ready";
    append(roads.find((r) => r.name === "StraightRoad")!);
    // Two flat pieces give about two seconds to settle in before the first bend.
    append(roads.find((r) => r.name === "StraightRoad")!);
    append(roads.find((r) => r.name === "StraightRoad")!);
    append(course.startingRoad);
    extend();
    planObstacles();
    for (const c of chunks) c.group.visible = false;
    for (const o of obstacles) o.mesh.visible = false;
    for (const g of gems) g.mesh.visible = false;
    sparkMaterial.opacity = 0;
    positionCamera();
    place(0, lateral, 2.5, ball.position, ballFrame, true);
    cb.score(0);
  }

  function positionCamera() {
    sample(distance, p, q, true);
    right.copy(RIGHT).applyQuaternion(q);
    up.copy(UP).applyQuaternion(q);
    back.copy(BACK).applyQuaternion(q);
    camera.position
      .copy(p)
      .addScaledVector(right, cameraX)
      .addScaledVector(up, 7)
      .addScaledVector(back, 8.8);
    target
      .copy(camera.position)
      .addScaledVector(back, -30)
      .addScaledVector(up, -30 * Math.tan(Math.PI / 15));
    camera.up.copy(up);
    camera.lookAt(target);
  }

  function crash() {
    phase = "crashing";
    crashTime = 0;
    ball.visible = false;
    cb.crash();
    const attr = sparkGeometry.getAttribute("position");
    sparkVelocities.length = 0;
    for (let i = 0; i < sparkCount; i++) {
      attr.setXYZ(i, ball.position.x, ball.position.y, ball.position.z);
      sparkVelocities.push(
        new Vector3(random() - 0.5, random() - 0.3, random() - 0.5)
          .normalize()
          .multiplyScalar(6 + random() * 32),
      );
    }
    attr.needsUpdate = true;
    sparkMaterial.opacity = 1;
  }

  function step(dt: number) {
    if (phase === "paused" || phase === "dead") return;
    elapsed += dt;
    shaderTime.set(elapsed / 20, elapsed, elapsed * 2, elapsed * 3);
    if (phase === "running") {
      if (autoplay) {
        const next = obstacles.find((o) => !o.passed && o.at >= distance - 2.2);
        if (
          next &&
          next.lane === laneMotion.lane &&
          next.at - distance <= Math.max(25, speed * 0.36)
        ) {
          laneMotion.turn(-next.lane);
        }
      }
      const before = distance;
      beforeBall.copy(ball.position);
      runTime += dt;
      speed = roadSpeed(score, gameplay.speedKeys) * Math.min(1, runTime);
      distance += speed * dt;
      lateral = laneMotion.advance(dt);
      place(distance, lateral, 2.5, ball.position, ballFrame, true);
      for (const o of obstacles) {
        if (o.at < before - 15 || o.at > distance + 15) continue;
        collisionStart.copy(beforeBall).applyMatrix4(o.inverse);
        collisionEnd.copy(ball.position).applyMatrix4(o.inverse);
        const { hazard, gate } = o.boxes;
        const hit = sweepSphereBox(
          collisionStart,
          collisionEnd,
          hazard.center,
          hazard.half,
          gameplay.ballRadius,
        );
        const pass = o.passed
          ? null
          : sweepSphereBox(
              collisionStart,
              collisionEnd,
              gate.center,
              gate.half,
              gameplay.ballRadius,
            );
        if (pass !== null && (hit === null || pass < hit)) {
          o.passed = true;
          score = o.score;
          cb.score(score);
          cb.gate(score);
        }
        // A scored trigger never disables the adjacent hazard: switching back
        // into a blocker while alongside it must still collide.
        if (hit !== null) {
          distance = before + (distance - before) * hit;
          ball.position.lerpVectors(beforeBall, ball.position, hit);
          score = o.score;
          cb.score(score);
          crash();
          break;
        }
      }
      if (phase === "running") {
        ball.rotation.x -= (speed * dt) / RADIUS;
      }
      for (const g of gems) {
        if (g.taken) continue;
        g.mesh.rotation.y += dt * 2;
        if (before <= g.at + 2 && distance >= g.at - 2 && Math.abs(lateral - g.lane * LANE) < 2) {
          g.taken = true;
          g.mesh.visible = false;
          cb.gem();
        }
      }
      extend();
      planObstacles();
      chunks = chunks.filter((c) => {
        if (c.to > distance - 45) return true;
        scene.remove(c.group);
        return false;
      });
      obstacles = obstacles.filter((o) => {
        if (o.at > distance - 35) return true;
        scene.remove(o.mesh);
        return false;
      });
      gems = gems.filter((g) => {
        if (g.at > distance - 35) return true;
        scene.remove(g.mesh);
        return false;
      });
    } else if (phase === "crashing") {
      crashTime += dt;
      distance += speed * Math.exp(-crashTime * 6) * dt;
      const attr = sparkGeometry.getAttribute("position");
      for (let i = 0; i < sparkCount; i++) {
        const v = sparkVelocities[i]!;
        v.multiplyScalar(Math.exp(-dt * 1.2));
        attr.setXYZ(i, attr.getX(i) + v.x * dt, attr.getY(i) + v.y * dt, attr.getZ(i) + v.z * dt);
      }
      attr.needsUpdate = true;
      sparkMaterial.opacity = Math.max(0, 1 - crashTime / EXPLOSION_DURATION) ** 2;
      if (crashTime > EXPLOSION_DURATION) {
        phase = "dead";
        cb.dead();
      }
    }
  }

  function frame(now: number) {
    if (disposed) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    // Small steps keep lane transitions and collision fair on slow devices.
    let remaining = dt;
    while (remaining > 0) {
      const d = Math.min(remaining, 1 / 120);
      step(d);
      remaining -= d;
    }
    if (phase !== "paused" && phase !== "dead") {
      cameraX = Math.max(-1.5, Math.min(1.5, cameraX + (lateral - cameraX) * Math.min(1, 3 * dt)));
      positionCamera();
    }
    composer.render();
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    const w = Math.max(1, host.clientWidth),
      h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = 100;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  reset();
  resize();
  raf = requestAnimationFrame(frame);
  return {
    reset,
    setAutoplay(value: boolean) {
      autoplay = value;
    },
    start() {
      phase = "running";
      previous = 0;
      for (const c of chunks) c.group.visible = true;
      for (const o of obstacles) o.mesh.visible = true;
      for (const g of gems) g.mesh.visible = true;
    },
    turn(to?: number) {
      if (phase !== "running") return;
      laneMotion.turn(to);
    },
    pause() {
      if (phase === "running") phase = "paused";
    },
    resume() {
      if (phase === "paused") {
        phase = "running";
        previous = 0;
      }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      cleanWorld();
      for (const r of roads) for (const g of r.geometry) g.dispose();
      for (const g of [ballGeometry, obstacleGeometry, gemGeometry, labelGeometry]) g.dispose();
      for (const m of [roadMaterial, solid, obstacleMaterial, gemMaterial, ...labels]) m.dispose();
      for (const m of labels) m.map?.dispose();
      white.dispose();
      flareTexture.dispose();
      sparkGeometry.dispose();
      sparkMaterial.dispose();
      texture.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export type GameEngine = Awaited<ReturnType<typeof createGameEngine>>;
