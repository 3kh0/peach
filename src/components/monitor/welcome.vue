<template>
  <!-- renderless -->
</template>

<script setup>
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Euler,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { onBeforeUnmount, onMounted } from "vue";
import { MONITOR_PROPS, SAMPLE_SIZE, randomBetween, readSampleLines } from "./utils";

const props = defineProps(MONITOR_PROPS);
const emit = defineEmits(["title"]);

const COUNT = 5;
const TRAVEL = 1.18;
const LANE_SPREAD = 0.48;
const BASE_SPEED = 0.68;
const SHADES = [0.18, 0.34, 0.52, 0.72, 0.94];
const ALPHA = (-10 * Math.PI) / 180;
const BETA = (20 * Math.PI) / 180;
const GAMMA = (-45 * Math.PI) / 180;

const railEuler = new Euler(ALPHA, BETA, GAMMA);
const axis = (x, y, z) => new Vector3(x, y, z).applyEuler(railEuler).normalize();
const railDir = axis(1, 0, 0);
const railSide = axis(0, 1, 0);
const railNormal = axis(0, 0, 1);

const fmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/New_York",
});

let glCanvas, renderer, scene, camera, geometry;
let boards = [];
let timer = 0;

function emitTime() {
  emit("title", `local time: ${fmt.format(new Date())} et`);
}

function makeBoard(mesh, i) {
  const lane = i - (COUNT - 1) / 2;
  const origin = railSide
    .clone()
    .multiplyScalar(lane * LANE_SPREAD)
    .addScaledVector(railNormal, lane * -0.1);

  return {
    mesh,
    origin,
    phase: i * ((Math.PI * 2) / COUNT) + randomBetween(-0.08, 0.08),
    speed: BASE_SPEED + randomBetween(-0.035, 0.035),
    travel: TRAVEL + randomBetween(-0.08, 0.08),
  };
}

function buildLines(elapsed) {
  const sc = props.sampleContext;
  const l = props.layout;
  if (!renderer || !sc || !l) return [];

  boards.forEach((b) => {
    const t = Math.sin(elapsed * b.speed + b.phase) * b.travel;
    b.mesh.position.copy(b.origin).addScaledVector(railDir, t);
    b.mesh.rotation.set(ALPHA, BETA, GAMMA);
  });

  renderer.render(scene, camera);
  sc.clearRect(0, 0, l.cols, l.rows);
  sc.imageSmoothingEnabled = false;
  sc.drawImage(glCanvas, 0, 0, l.cols, l.rows);

  return readSampleLines(sc, l.cols, l.rows);
}

defineExpose({ buildLines });

onMounted(() => {
  glCanvas = document.createElement("canvas");
  glCanvas.width = SAMPLE_SIZE;
  glCanvas.height = SAMPLE_SIZE;

  renderer = new WebGLRenderer({
    canvas: glCanvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });
  renderer.setSize(SAMPLE_SIZE, SAMPLE_SIZE, false);
  renderer.setClearColor(new Color("#000000"));

  scene = new Scene();
  camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.05, 4.85);

  const key = new DirectionalLight("#ffffff", 2.2);
  key.position.set(3.2, 2.8, 4.2);
  const fill = new DirectionalLight("#c0c0c0", 0.9);
  fill.position.set(-3.8, -1.2, 2.8);
  const rim = new DirectionalLight("#8e8e8e", 0.55);
  rim.position.set(0.5, -3.2, 2.1);
  scene.add(new AmbientLight("#ffffff", 0.85), key, fill, rim);

  geometry = new BoxGeometry(2.08, 0.66, 0.08);
  boards = Array.from({ length: COUNT }, (_, i) => {
    const mesh = new Mesh(
      geometry,
      new MeshStandardMaterial({
        color: new Color().setScalar(SHADES[i % SHADES.length]),
        roughness: 0.48,
        metalness: 0.03,
      }),
    );
    scene.add(mesh);
    return makeBoard(mesh, i);
  });

  emitTime();
  timer = window.setInterval(emitTime, 1000);
});

onBeforeUnmount(() => {
  window.clearInterval(timer);
  renderer?.dispose();
  geometry?.dispose();
  boards.forEach((b) => b.mesh.material.dispose());
  boards = [];
});
</script>
