// =============================================================================================
// Turbo Kart Rally — Modern 3D Model Studio & Animation Inspector
// =============================================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { createKartModel, createItemModel, createCharacterPortrait } from '../src/models.js';
import { ChaseCamera } from '../src/camera.js';
import { CHARACTERS, PHYSICS } from '../src/config.js';
import { bus } from '../src/events.js';

const PI = Math.PI;
const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);

// ---------------------------------------------------------------------------------------------
// Studio State
// ---------------------------------------------------------------------------------------------
const state = {
  mode: params.get('view') || 'inspector', // 'inspector' | 'showroom' | 'items' | 'chase'
  charIndex: Math.min(Math.max(+(params.get('char') || 0), 0), CHARACTERS.length - 1),

  // Animation & Physics Controls
  speed: +(params.get('speed') || 28),
  steer: 0,
  autoSteer: true,
  steerSpeed: 1.5,
  drifting: params.get('drift') === '1',
  driftDir: 1,
  driftStage: 0, // 0: None, 1: Blue, 2: Orange, 3: Purple
  boosting: false,
  airborne: false,
  spin: 0,
  star: params.get('star') === '1',
  squashed: false,

  // Inspector & Diagnostics
  explode: 0,
  wireframe: false,
  autoRotate: false,
  rotateSpeed: 1.0,
  showSockets: false,
  showHitbox: false,
  showGrid: true,
  showFloor: true,

  // Lighting & Environment
  envPreset: 'Studio Dark',
  sunIntensity: 2.2,
  ambientIntensity: 1.2,
  fogEnabled: true,

  // Camera Settings
  camFov: 45,
};

// ---------------------------------------------------------------------------------------------
// Renderer & Canvas Setup
// ---------------------------------------------------------------------------------------------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------------------------------------------------------------------------------------------
// Scene, Camera & Controls
// ---------------------------------------------------------------------------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(state.camFov, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(4, 3, 6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow slightly below horizon
controls.minDistance = 1.0;
controls.maxDistance = 120;
controls.target.set(0, 0.6, 0);
controls.update();

// ---------------------------------------------------------------------------------------------
// Performance Stats Monitor
// ---------------------------------------------------------------------------------------------
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
const statsContainer = document.getElementById('stats-container');
if (statsContainer) statsContainer.appendChild(stats.dom);

// ---------------------------------------------------------------------------------------------
// Lighting & Studio Presets
// ---------------------------------------------------------------------------------------------
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, state.ambientIntensity);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, state.sunIntensity);
sunLight.position.set(10, 18, 12);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
Object.assign(sunLight.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 60 });
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x00d2d3, 1.0);
rimLight.position.set(-12, 8, -12);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xff9ff3, 0.8);
fillLight.position.set(12, 4, -8);
scene.add(fillLight);

// Ground Elements
const gridHelper = new THREE.GridHelper(60, 60, 0xff4757, 0x2f3542);
gridHelper.position.y = 0.001;
scene.add(gridHelper);

const shadowPlaneGeo = new THREE.PlaneGeometry(120, 120);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const studioFloorGeo = new THREE.CircleGeometry(35, 64);
const studioFloorMat = new THREE.MeshStandardMaterial({
  color: 0x12161f,
  roughness: 0.4,
  metalness: 0.2
});
const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
studioFloor.rotation.x = -Math.PI / 2;
studioFloor.position.y = -0.002;
studioFloor.receiveShadow = true;
scene.add(studioFloor);

// Environment Presets Map
const ENV_PRESETS = {
  'Studio Dark': {
    background: 0x0d1117,
    fog: 0x0d1117,
    fogNear: 25,
    fogFar: 80,
    hemiSky: 0xdfe4ea,
    hemiGround: 0x1e272e,
    hemiInt: 1.1,
    sunCol: 0xffffff,
    sunInt: 2.2,
    rimCol: 0x00d2d3,
    rimInt: 1.2,
    fillCol: 0xff6b81,
    fillInt: 0.8,
    floorCol: 0x12161f,
    floorRough: 0.45
  },
  'Palm Cove Day': {
    background: 0x8ec5ff,
    fog: 0x8ec5ff,
    fogNear: 50,
    fogFar: 160,
    hemiSky: 0xcfe8ff,
    hemiGround: 0x5a6b3a,
    hemiInt: 1.3,
    sunCol: 0xfff1d6,
    sunInt: 2.8,
    rimCol: 0xffffff,
    rimInt: 0.5,
    fillCol: 0x9be2ff,
    fillInt: 0.6,
    floorCol: 0x57606f,
    floorRough: 0.8
  },
  'Sunset Gold': {
    background: 0x3d1b3b,
    fog: 0x3d1b3b,
    fogNear: 30,
    fogFar: 90,
    hemiSky: 0xffa502,
    hemiGround: 0x2f1b41,
    hemiInt: 1.4,
    sunCol: 0xff7f50,
    sunInt: 3.2,
    rimCol: 0xff4757,
    rimInt: 1.8,
    fillCol: 0x70a1ff,
    fillInt: 0.5,
    floorCol: 0x22132e,
    floorRough: 0.35
  },
  'Cyber Neon': {
    background: 0x050510,
    fog: 0x050510,
    fogNear: 20,
    fogFar: 70,
    hemiSky: 0x1e90ff,
    hemiGround: 0xff1493,
    hemiInt: 1.2,
    sunCol: 0x00f2fe,
    sunInt: 2.0,
    rimCol: 0xff007f,
    rimInt: 2.2,
    fillCol: 0x7b2cbf,
    fillInt: 1.5,
    floorCol: 0x0a0a18,
    floorRough: 0.15
  }
};

function applyEnvPreset(name) {
  const p = ENV_PRESETS[name] || ENV_PRESETS['Studio Dark'];
  state.envPreset = name;
  scene.background = new THREE.Color(p.background);
  if (state.fogEnabled) {
    scene.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar);
  } else {
    scene.fog = null;
  }
  hemiLight.color.setHex(p.hemiSky);
  hemiLight.groundColor.setHex(p.hemiGround);
  hemiLight.intensity = p.hemiInt * (state.ambientIntensity / 1.2);

  sunLight.color.setHex(p.sunCol);
  sunLight.intensity = p.sunInt * (state.sunIntensity / 2.2);

  rimLight.color.setHex(p.rimCol);
  rimLight.intensity = p.rimInt;

  fillLight.color.setHex(p.fillCol);
  fillLight.intensity = p.fillInt;

  studioFloorMat.color.setHex(p.floorCol);
  studioFloorMat.roughness = p.floorRough;
}

// ---------------------------------------------------------------------------------------------
// Visual FX & Particle Systems
// ---------------------------------------------------------------------------------------------
class StudioParticleSystem {
  constructor() {
    this.maxSparks = 180;
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPos = new Float32Array(this.maxSparks * 3);
    this.sparkCol = new Float32Array(this.maxSparks * 3);
    this.sparkSizes = new Float32Array(this.maxSparks);
    this.sparkLife = new Float32Array(this.maxSparks);
    this.sparkVels = [];

    for (let i = 0; i < this.maxSparks; i++) {
      this.sparkVels.push(new THREE.Vector3());
    }

    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkCol, 3));
    this.sparkGeo.setAttribute('size', new THREE.BufferAttribute(this.sparkSizes, 1));

    // Particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64; pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const radGrd = pCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
    radGrd.addColorStop(0, 'rgba(255,255,255,1)');
    radGrd.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    radGrd.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    radGrd.addColorStop(1, 'rgba(255,255,255,0)');
    pCtx.fillStyle = radGrd;
    pCtx.fillRect(0, 0, 64, 64);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    this.sparkMat = new THREE.PointsMaterial({
      size: 0.35,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });

    this.points = new THREE.Points(this.sparkGeo, this.sparkMat);
    scene.add(this.points);
    this.nextIdx = 0;
  }

  emit(origin, colorHex, velSpread = 1.0, count = 2) {
    const col = new THREE.Color(colorHex);
    for (let c = 0; c < count; c++) {
      const idx = this.nextIdx;
      this.nextIdx = (this.nextIdx + 1) % this.maxSparks;

      this.sparkPos[idx * 3] = origin.x + (Math.random() - 0.5) * 0.15;
      this.sparkPos[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.1;
      this.sparkPos[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.15;

      this.sparkCol[idx * 3] = col.r;
      this.sparkCol[idx * 3 + 1] = col.g;
      this.sparkCol[idx * 3 + 2] = col.b;

      this.sparkLife[idx] = 1.0;
      this.sparkVels[idx].set(
        (Math.random() - 0.5) * 2.5 * velSpread,
        1.5 + Math.random() * 2.5,
        -1.5 - Math.random() * 3.0
      );
    }
  }

  update(dt) {
    for (let i = 0; i < this.maxSparks; i++) {
      if (this.sparkLife[i] <= 0) continue;
      this.sparkLife[i] -= dt * 2.8;
      if (this.sparkLife[i] <= 0) {
        this.sparkPos[i * 3 + 1] = -1000;
        continue;
      }
      this.sparkVels[i].y -= 9.8 * dt; // gravity
      this.sparkPos[i * 3] += this.sparkVels[i].x * dt;
      this.sparkPos[i * 3 + 1] += this.sparkVels[i].y * dt;
      this.sparkPos[i * 3 + 2] += this.sparkVels[i].z * dt;
    }
    this.sparkGeo.attributes.position.needsUpdate = true;
    this.sparkGeo.attributes.color.needsUpdate = true;
  }
}
const fxSystem = new StudioParticleSystem();

// ---------------------------------------------------------------------------------------------
// Diagnostics Helpers (Hitboxes, Sockets, Exploded View)
// ---------------------------------------------------------------------------------------------
const hitboxGeo = new THREE.CylinderGeometry(PHYSICS.kartRadius, PHYSICS.kartRadius, 1.2, 32, 1, true);
const hitboxMat = new THREE.MeshBasicMaterial({ color: 0x2ed573, wireframe: true, transparent: true, opacity: 0.6 });
const hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
hitboxMesh.position.y = 0.6;
hitboxMesh.visible = false;
scene.add(hitboxMesh);

const socketHelpersGroup = new THREE.Group();
socketHelpersGroup.visible = false;
scene.add(socketHelpersGroup);

function updateSocketHelpers(kartInstance) {
  while (socketHelpersGroup.children.length) {
    socketHelpersGroup.remove(socketHelpersGroup.children[0]);
  }
  if (!kartInstance || !kartInstance.anchors) return;

  const colors = {
    exhaustL: 0xff4757,
    exhaustR: 0xff4757,
    itemHold: 0xffa502,
    wheelFL: 0x2ed573,
    wheelFR: 0x2ed573,
    wheelRL: 0x1e90ff,
    wheelRR: 0x1e90ff,
  };

  for (const [name, anchor] of Object.entries(kartInstance.anchors)) {
    const helper = new THREE.AxesHelper(0.4);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: colors[name] || 0xffffff })
    );
    sphere.position.copy(anchor.position);
    helper.position.copy(anchor.position);
    socketHelpersGroup.add(sphere);
    socketHelpersGroup.add(helper);
  }
}

// ---------------------------------------------------------------------------------------------
// Mode 1: Single Kart Inspector
// ---------------------------------------------------------------------------------------------
let singleKart = null;
let singleKartGroup = new THREE.Group();
scene.add(singleKartGroup);

function loadSingleKart(index) {
  if (singleKart) {
    singleKart.dispose();
    singleKartGroup.remove(singleKart.root);
  }
  state.charIndex = index;
  const charDef = CHARACTERS[index];
  singleKart = createKartModel(charDef);
  singleKartGroup.add(singleKart.root);

  updateCharacterCard(charDef);
  updateSocketHelpers(singleKart);
  applyWireframe(state.wireframe);

  // Update carousel active state
  document.querySelectorAll('.carousel-item').forEach((item, idx) => {
    item.classList.toggle('active', idx === index);
  });
}

function updateExplodedView(amount) {
  if (!singleKart || !singleKart.parts) return;
  const { body, driver, head, wheels } = singleKart.parts;

  if (body) body.position.y = amount * 0.5;
  if (driver) driver.position.set(0, (amount * 0.8), -amount * 0.3);
  if (head) head.position.set(0, (amount * 0.6), amount * 0.2);

  if (wheels && Array.isArray(wheels)) {
    wheels.forEach((w) => {
      const sx = Math.sign(w.position.x || 1);
      const sz = Math.sign(w.position.z || 1);
      w.position.x = (Math.abs(w.position.x) + amount * 0.6) * sx;
      w.position.z = (Math.abs(w.position.z) + amount * 0.4) * sz;
    });
  }
}

// ---------------------------------------------------------------------------------------------
// Mode 2: Showroom Lineup (8 Racers on Grid)
// ---------------------------------------------------------------------------------------------
const showroomGroup = new THREE.Group();
showroomGroup.visible = false;
scene.add(showroomGroup);
const showroomKarts = [];

function buildShowroom() {
  CHARACTERS.forEach((charDef, i) => {
    const kart = createKartModel(charDef);
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.7, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.4, roughness: 0.3 })
    );
    pedestal.receiveShadow = true;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.52, 0.03, 16, 48),
      new THREE.MeshBasicMaterial({ color: charDef.color })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    pedestal.add(ring);

    const col = i % 4;
    const row = Math.floor(i / 4);
    const posX = (col - 1.5) * 3.8;
    const posZ = (row - 0.5) * 4.6;

    const kartContainer = new THREE.Group();
    kartContainer.position.set(posX, 0.08, posZ);
    kartContainer.rotation.y = 0.35;
    kartContainer.add(kart.root);

    pedestal.position.set(posX, 0.075, posZ);

    showroomGroup.add(pedestal);
    showroomGroup.add(kartContainer);
    showroomKarts.push({ kart, container: kartContainer, charDef });
  });
}

// ---------------------------------------------------------------------------------------------
// Mode 3: Item Arsenal Showcase
// ---------------------------------------------------------------------------------------------
const itemGroup = new THREE.Group();
itemGroup.visible = false;
scene.add(itemGroup);
const itemShowcaseModels = [];

const ALL_ITEM_TYPES = [
  { id: 'item_box', name: 'Item Box' },
  { id: 'banana', name: 'Banana Peel' },
  { id: 'green_shell', name: 'Green Shell' },
  { id: 'red_shell', name: 'Red Shell' },
  { id: 'blue_shell', name: 'Spiny Blue Shell' },
  { id: 'mushroom', name: 'Dash Mushroom' },
  { id: 'triple_mushroom', name: 'Triple Mushrooms' },
  { id: 'star', name: 'Super Star' },
  { id: 'lightning', name: 'Lightning Bolt' }
];

function buildItemArsenal() {
  ALL_ITEM_TYPES.forEach((t, i) => {
    const model = createItemModel(t.id);
    const col = i % 3;
    const row = Math.floor(i / 3);
    const posX = (col - 1) * 3.2;
    const posZ = (row - 1) * 3.2;

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.3, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a2130, roughness: 0.5 })
    );
    pedestal.position.set(posX, 0.05, posZ);
    pedestal.receiveShadow = true;
    itemGroup.add(pedestal);

    const container = new THREE.Group();
    container.position.set(posX, t.id === 'item_box' ? 1.3 : t.id === 'star' || t.id === 'lightning' ? 1.0 : 0.4, posZ);
    container.add(model);
    itemGroup.add(container);

    itemShowcaseModels.push({ model, container, type: t.id, basePosY: container.position.y });
  });
}

// ---------------------------------------------------------------------------------------------
// Mode 4: Dynamic Chase Camera Simulator
// ---------------------------------------------------------------------------------------------
const chaseGroup = new THREE.Group();
chaseGroup.visible = false;
scene.add(chaseGroup);

let chaseCamInstance = null;
let simulatedPlayerKart = null;
const circuitTrackRadius = 32;
let trackSimAngle = 0;

function buildChaseSimulator() {
  // Track road loop
  const circuitRoad = new THREE.Mesh(
    new THREE.RingGeometry(circuitTrackRadius - 4.5, circuitTrackRadius + 4.5, 120),
    new THREE.MeshStandardMaterial({ color: 0x3d434f, roughness: 0.75 })
  );
  circuitRoad.rotation.x = -Math.PI / 2;
  circuitRoad.position.y = 0.02;
  circuitRoad.receiveShadow = true;
  chaseGroup.add(circuitRoad);

  // Boost pads along track
  for (let b = 0; b < 4; b++) {
    const bAngle = (b / 4) * TAU + 0.3;
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 2.0),
      new THREE.MeshBasicMaterial({ color: 0x00d2d3, side: THREE.DoubleSide })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = -bAngle;
    pad.position.set(Math.cos(bAngle) * circuitTrackRadius, 0.03, Math.sin(bAngle) * circuitTrackRadius);
    chaseGroup.add(pad);
  }

  // AI traffic karts
  for (let i = 1; i < 5; i++) {
    const aiChar = CHARACTERS[(state.charIndex + i) % CHARACTERS.length];
    const aiKart = createKartModel(aiChar);
    const aiContainer = new THREE.Group();
    aiContainer.add(aiKart.root);
    aiContainer.userData = { offsetAngle: (i / 5) * TAU, laneOffset: (i % 2 === 0 ? 2 : -2) };
    chaseGroup.add(aiContainer);
  }

  chaseCamInstance = new ChaseCamera(camera);
  simulatedPlayerKart = {
    object3D: singleKartGroup,
    position: singleKartGroup.position,
    velocity: new THREE.Vector3(),
    heading: 0,
    speed: 34,
    drifting: false,
    driftDir: 1,
    boostTimer: 0,
    starTimer: 0,
    airborne: false,
    groundNormal: new THREE.Vector3(0, 1, 0),
    m: singleKart
  };
}

// ---------------------------------------------------------------------------------------------
// Mode Switching
// ---------------------------------------------------------------------------------------------
function setViewMode(modeName) {
  state.mode = modeName;

  // Toggle group visibilities
  singleKartGroup.visible = (modeName === 'inspector' || modeName === 'chase');
  showroomGroup.visible = (modeName === 'showroom');
  itemGroup.visible = (modeName === 'items');
  chaseGroup.visible = (modeName === 'chase');

  // Toggle HUD Elements
  const charCard = document.getElementById('character-card');
  const bottomCarousel = document.getElementById('character-carousel').parentElement;
  if (charCard) charCard.style.display = (modeName === 'inspector') ? 'block' : 'none';
  if (bottomCarousel) bottomCarousel.style.display = (modeName === 'inspector') ? 'flex' : 'none';

  // Camera handling per mode
  if (modeName === 'inspector') {
    camera.fov = state.camFov;
    camera.position.set(3.8, 2.5, 4.8);
    controls.target.set(0, 0.6, 0);
    controls.enabled = true;
    controls.update();
    singleKartGroup.position.set(0, 0, 0);
    singleKartGroup.rotation.set(0, 0, 0);
  } else if (modeName === 'showroom') {
    camera.fov = 50;
    camera.position.set(0, 8, 14);
    controls.target.set(0, 0.8, 0);
    controls.enabled = true;
    controls.update();
  } else if (modeName === 'items') {
    camera.fov = 48;
    camera.position.set(0, 6, 8.5);
    controls.target.set(0, 0.8, 0);
    controls.enabled = true;
    controls.update();
  } else if (modeName === 'chase') {
    controls.enabled = false;
    camera.fov = 70;
    camera.updateProjectionMatrix();
  }

  // Update tabs UI
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === modeName);
  });
}

// ---------------------------------------------------------------------------------------------
// UI Updates (Character Card & Carousel)
// ---------------------------------------------------------------------------------------------
function updateCharacterCard(c) {
  document.getElementById('char-name').textContent = c.name;
  document.getElementById('char-hat').textContent = `${c.hat.toUpperCase()} RACER`;
  document.getElementById('char-portrait').src = createCharacterPortrait(c);

  // Palette swatches
  document.getElementById('swatch-paint').style.background = '#' + c.color.toString(16).padStart(6, '0');
  document.getElementById('swatch-accent').style.background = '#' + c.accent.toString(16).padStart(6, '0');
  document.getElementById('swatch-skin').style.background = '#' + c.skin.toString(16).padStart(6, '0');

  // Stats bars
  const stats = c.stats;
  ['speed', 'accel', 'handling', 'weight'].forEach((s) => {
    const val = stats[s] || 3;
    const bar = document.getElementById(`stat-bar-${s}`);
    const lbl = document.getElementById(`stat-val-${s}`);
    if (bar) bar.style.width = `${(val / 5) * 100}%`;
    if (lbl) lbl.textContent = `${val} / 5`;
  });
}

function buildCharacterCarousel() {
  const container = document.getElementById('character-carousel');
  container.innerHTML = '';
  CHARACTERS.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = `carousel-item ${i === state.charIndex ? 'active' : ''}`;
    item.title = `${c.name} (${c.hat})`;

    const img = document.createElement('img');
    img.src = createCharacterPortrait(c);
    img.alt = c.name;

    const span = document.createElement('span');
    span.textContent = c.name;

    item.appendChild(img);
    item.appendChild(span);

    item.addEventListener('click', () => {
      loadSingleKart(i);
    });

    container.appendChild(item);
  });
}

function applyWireframe(wireframe) {
  scene.traverse((o) => {
    if (o.isMesh && o.material && !o.material.userData?.sharedHelper) {
      if (Array.isArray(o.material)) {
        o.material.forEach((m) => { m.wireframe = wireframe; });
      } else {
        o.material.wireframe = wireframe;
      }
    }
  });
}

// ---------------------------------------------------------------------------------------------
// lil-gui Controls Panel
// ---------------------------------------------------------------------------------------------
let gui = null;
function initGUI() {
  if (gui) gui.destroy();
  gui = new GUI({ title: 'Kart Studio Controls', width: 310 });

  // 1. Racer & Mode Folder
  const fMode = gui.addFolder('🏎️ Racer & Viewing Mode');
  fMode.add(state, 'mode', { 'Single Inspector': 'inspector', 'Showroom Grid': 'showroom', 'Item Arsenal': 'items', 'Chase Camera': 'chase' })
    .name('Studio Mode')
    .onChange((v) => setViewMode(v));

  const charNames = Object.fromEntries(CHARACTERS.map((c, idx) => [c.name, idx]));
  fMode.add(state, 'charIndex', charNames)
    .name('Character')
    .listen()
    .onChange((idx) => loadSingleKart(idx));

  // 2. Animation & Driving Dynamics
  const fAnim = gui.addFolder('🎬 Animation & Dynamics');
  fAnim.add(state, 'speed', 0, 50, 1).name('Speed (km/h)');
  fAnim.add(state, 'autoSteer').name('Auto Steer Sweep');
  fAnim.add(state, 'steer', -1, 1, 0.02).name('Manual Steer').listen();
  fAnim.add(state, 'drifting').name('Hold Drift');
  fAnim.add(state, 'driftDir', { 'Left (-1)': -1, 'Right (+1)': 1 }).name('Drift Side');
  fAnim.add(state, 'driftStage', { 'None': 0, 'Level 1 (Blue)': 1, 'Level 2 (Orange)': 2, 'Level 3 (Purple)': 3 }).name('Drift Stage');
  fAnim.add(state, 'boosting').name('Rocket Boost');
  fAnim.add(state, 'airborne').name('Jump / Airborne');
  fAnim.add(state, 'star').name('Star Power');
  fAnim.add(state, 'squashed').name('Lightning Shrink').onChange((v) => {
    if (singleKart) singleKart.setShrunk(v ? 0.45 : 1.0);
  });

  const actionsObj = {
    triggerSpin: () => {
      let tSpin = 0;
      const spinInterval = setInterval(() => {
        tSpin += 0.05;
        state.spin = Math.sin(tSpin * PI);
        if (tSpin >= 1.0) {
          clearInterval(spinInterval);
          state.spin = 0;
        }
      }, 30);
    },
    triggerHop: () => {
      state.airborne = true;
      setTimeout(() => { state.airborne = false; }, 400);
    },
    triggerBoost: () => {
      state.boosting = true;
      setTimeout(() => { state.boosting = false; }, 900);
    }
  };
  fAnim.add(actionsObj, 'triggerHop').name('⚡ Hop Action (Space)');
  fAnim.add(actionsObj, 'triggerBoost').name('🔥 Boost Action (B)');
  fAnim.add(actionsObj, 'triggerSpin').name('🌀 360 Spinout (S)');

  // 3. Diagnostics & Model Tools
  const fDiag = gui.addFolder('🔍 Model Diagnostics & Parts');
  fDiag.add(state, 'explode', 0, 1, 0.01).name('Exploded View (E)').onChange(updateExplodedView);
  fDiag.add(state, 'wireframe').name('Wireframe (W)').onChange(applyWireframe);
  fDiag.add(state, 'autoRotate').name('Turntable Rotate');
  fDiag.add(state, 'rotateSpeed', 0.1, 5, 0.1).name('Rotate Speed');
  fDiag.add(state, 'showSockets').name('Show Sockets / Anchors').onChange((v) => { socketHelpersGroup.visible = v; });
  fDiag.add(state, 'showHitbox').name('Show Collision Hitbox').onChange((v) => { hitboxMesh.visible = v; });
  fDiag.add(state, 'showGrid').name('Show Floor Grid').onChange((v) => { gridHelper.visible = v; });
  fDiag.add(state, 'showFloor').name('Show Shadow Floor').onChange((v) => {
    studioFloor.visible = v;
    shadowPlane.visible = v;
  });

  // 4. Lighting & Environment Studio
  const fEnv = gui.addFolder('💡 Studio Lighting & Environment');
  fEnv.add(state, 'envPreset', Object.keys(ENV_PRESETS)).name('Preset').onChange(applyEnvPreset);
  fEnv.add(state, 'sunIntensity', 0.5, 6, 0.1).name('Sun Intensity').onChange(() => applyEnvPreset(state.envPreset));
  fEnv.add(state, 'ambientIntensity', 0.2, 3, 0.1).name('Ambient Light').onChange(() => applyEnvPreset(state.envPreset));
  fEnv.add(state, 'fogEnabled').name('Atmosphere Fog').onChange(() => applyEnvPreset(state.envPreset));

  // 5. Camera Angles
  const fCam = gui.addFolder('📷 Camera Angles');
  const camAngles = {
    'Perspective Orbit': () => { camera.position.set(3.8, 2.5, 4.8); controls.target.set(0, 0.6, 0); },
    'Isometric': () => { camera.position.set(6, 5, 6); controls.target.set(0, 0.5, 0); },
    'Front 3/4 View': () => { camera.position.set(3, 1.4, 3.2); controls.target.set(0, 0.5, 0); },
    'Driver Cockpit': () => { camera.position.set(0, 1.8, 1.4); controls.target.set(0, 1.1, 0); },
    'Rear Exhaust': () => { camera.position.set(0, 0.9, -3.2); controls.target.set(0, 0.5, 0); },
    'Side Profile': () => { camera.position.set(4.5, 0.8, 0); controls.target.set(0, 0.5, 0); },
    'Top-Down Blueprint': () => { camera.position.set(0, 7.5, 0.01); controls.target.set(0, 0, 0); }
  };
  Object.keys(camAngles).forEach((preset) => {
    fCam.add(camAngles, preset).name(preset);
  });

  fMode.open();
  fAnim.open();
  fDiag.close();
  fEnv.close();
  fCam.close();
}

// ---------------------------------------------------------------------------------------------
// Keyboard Event Listeners
// ---------------------------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key;

  if (k >= '1' && k <= '8') {
    loadSingleKart(parseInt(k, 10) - 1);
  } else if (k === ' ') {
    e.preventDefault();
    state.airborne = !state.airborne;
  } else if (k.toLowerCase() === 'd') {
    state.drifting = !state.drifting;
  } else if (k.toLowerCase() === 'b') {
    state.boosting = !state.boosting;
  } else if (k.toLowerCase() === 's') {
    state.spin = 1.0;
    setTimeout(() => { state.spin = 0; }, 800);
  } else if (k.toLowerCase() === 'e') {
    state.explode = state.explode > 0 ? 0 : 0.75;
    updateExplodedView(state.explode);
  } else if (k.toLowerCase() === 'w') {
    state.wireframe = !state.wireframe;
    applyWireframe(state.wireframe);
  } else if (k.toLowerCase() === 'c') {
    camera.position.set(3.8, 2.5, 4.8);
    controls.target.set(0, 0.6, 0);
    controls.update();
  }
});

// Mode Tabs Click Listeners
document.querySelectorAll('.mode-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    setViewMode(btn.dataset.mode);
  });
});

// Reset Cam & Screenshot Buttons
document.getElementById('btn-reset-cam')?.addEventListener('click', () => {
  camera.position.set(3.8, 2.5, 4.8);
  controls.target.set(0, 0.6, 0);
  controls.update();
});

document.getElementById('btn-screenshot')?.addEventListener('click', () => {
  renderer.render(scene, camera);
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `turbo-kart-${CHARACTERS[state.charIndex].id}-studio.png`;
  link.href = dataURL;
  link.click();
});

// Window Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------------------------
// Animation Loop
// ---------------------------------------------------------------------------------------------
const clock = new THREE.Clock();
let elapsed = 0;

function animateFrame() {
  requestAnimationFrame(animateFrame);
  stats.begin();

  const dt = Math.min(clock.getDelta(), 0.1);
  elapsed += dt;

  // 1. Steering & Turntable Logic
  if (state.autoSteer && state.mode === 'inspector') {
    state.steer = Math.sin(elapsed * state.steerSpeed);
  }

  if (state.autoRotate && state.mode === 'inspector' && singleKartGroup) {
    singleKartGroup.rotation.y += dt * state.rotateSpeed * 0.8;
  }

  // 2. Single Inspector Kart Animation
  if (state.mode === 'inspector' && singleKart) {
    singleKart.animate({
      dt,
      speed: state.speed,
      steer: state.steer,
      drifting: state.drifting,
      driftDir: state.driftDir,
      boosting: state.boosting,
      airborne: state.airborne,
      spin: state.spin,
      star: state.star,
      time: elapsed
    });

    // Particle FX emission for drift sparks and boost flames
    if (state.drifting || state.driftStage > 0) {
      const sparkColors = [0x1e90ff, 0x1e90ff, 0xffa502, 0x9b59b6];
      const col = sparkColors[state.driftStage] || 0x1e90ff;
      if (singleKart.anchors) {
        fxSystem.emit(singleKart.anchors.wheelRL.position, col, 1.2, 1);
        fxSystem.emit(singleKart.anchors.wheelRR.position, col, 1.2, 1);
      }
    }

    if (state.boosting && singleKart.anchors) {
      fxSystem.emit(singleKart.anchors.exhaustL.position, 0xff4757, 1.5, 2);
      fxSystem.emit(singleKart.anchors.exhaustR.position, 0xff4757, 1.5, 2);
    }
  }

  // 3. Showroom Karts Animation
  if (state.mode === 'showroom') {
    showroomKarts.forEach(({ kart, charDef }, i) => {
      kart.animate({
        dt,
        speed: 25,
        steer: Math.sin(elapsed * 1.5 + i) * 0.4,
        drifting: false,
        driftDir: 1,
        time: elapsed + i
      });
    });
  }

  // 4. Item Arsenal Bob & Rotation
  if (state.mode === 'items') {
    itemShowcaseModels.forEach(({ container, basePosY }, i) => {
      container.rotation.y = elapsed * 1.4 + i * 0.5;
      container.position.y = basePosY + Math.sin(elapsed * 3.0 + i) * 0.12;
    });
  }

  // 5. Chase Camera Simulator Mode
  if (state.mode === 'chase' && singleKart && simulatedPlayerKart && chaseCamInstance) {
    const trackSpeed = 36;
    const w = trackSpeed / circuitTrackRadius;
    trackSimAngle += w * dt;

    const k = simulatedPlayerKart;
    k.position.set(
      Math.cos(trackSimAngle) * circuitTrackRadius,
      state.airborne ? 1.4 : 0,
      Math.sin(trackSimAngle) * circuitTrackRadius
    );

    const travelYaw = Math.atan2(-Math.sin(trackSimAngle), Math.cos(trackSimAngle));
    k.velocity.set(Math.sin(travelYaw) * trackSpeed, 0, Math.cos(travelYaw) * trackSpeed);
    k.heading = travelYaw + (state.drifting ? 0.35 * state.driftDir : 0.05);
    k.object3D.rotation.y = k.heading;
    k.speed = trackSpeed;
    k.drifting = state.drifting;
    k.driftDir = state.driftDir;

    singleKart.animate({
      dt,
      speed: trackSpeed,
      steer: state.drifting ? 0.8 * state.driftDir : 0.2,
      drifting: state.drifting,
      driftDir: state.driftDir,
      boosting: state.boosting,
      airborne: state.airborne,
      time: elapsed
    });

    chaseCamInstance.update(dt, k, { mode: 'race', lookBack: false });
  }

  // 6. Particle Systems & Helpers
  fxSystem.update(dt);
  if (controls && controls.enabled) controls.update();

  renderer.render(scene, camera);

  // Diagnostics DOM info
  const diagTri = document.getElementById('diag-triangles');
  const diagCalls = document.getElementById('diag-calls');
  if (diagTri) diagTri.textContent = renderer.info.render.triangles.toLocaleString();
  if (diagCalls) diagCalls.textContent = renderer.info.render.calls.toLocaleString();

  stats.end();
}

// ---------------------------------------------------------------------------------------------
// Initialize Studio
// ---------------------------------------------------------------------------------------------
applyEnvPreset(state.envPreset);
buildCharacterCarousel();
loadSingleKart(state.charIndex);
buildShowroom();
buildItemArsenal();
buildChaseSimulator();
initGUI();
setViewMode(state.mode);

// Start Animation Loop
animateFrame();
