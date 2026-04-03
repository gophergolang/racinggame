import * as THREE from 'three';
import { TextureFactory } from './textures.js';
import { CAR_DEFS, buildCarModel } from './cars.js';
import { buildTown } from './town.js';
import { TRACK_DEFS, buildTrackVisuals, getTrackCurve } from './tracks.js';
import { CarPhysics } from './physics.js';
import { AIDriver } from './ai.js';

// ============== GAME STATE ==============
let state = 'loading'; // loading, menu, countdown, racing, finished
let selectedCar = 0;
let selectedTrack = 0;
let scene, camera, renderer;
let texFactory;
let clock;

// Racing state
let playerPhysics, aiDriver;
let playerModel, aiModel;
let trackCurve, trackVisuals;
let raceTime = 0;
let bestLapTime = Infinity;
let lapStartTime = 0;
let playerLapTimes = [];
let countdownValue = 3;
let countdownTimer = 0;
let townGroup, trackGroup;

// Camera
let cameraOffset = new THREE.Vector3(0, 5, 10);
let cameraLookOffset = new THREE.Vector3(0, 1, 0);

// Input
const keys = {};

// ============== INITIALIZATION ==============
async function init() {
  updateLoadingBar(10, 'Creating renderer...');

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  document.body.appendChild(renderer.domElement);

  updateLoadingBar(20, 'Setting up scene...');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 100, 300);

  // Camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 20, 40);

  // Clock
  clock = new THREE.Clock();

  updateLoadingBar(30, 'Creating textures...');

  // Textures
  texFactory = new TextureFactory();

  updateLoadingBar(40, 'Adding lights...');

  // Lights
  setupLights();

  updateLoadingBar(50, 'Building town...');

  // Build the town
  townGroup = buildTown(scene, texFactory);

  updateLoadingBar(70, 'Creating sky...');

  // Sky
  createSky();

  updateLoadingBar(85, 'Setting up controls...');

  // Input
  setupInput();

  // Menu
  setupMenu();

  updateLoadingBar(100, 'Ready!');

  // Hide loading, show menu
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.add('active');
    state = 'menu';
  }, 500);

  // Start render loop
  animate();
}

function setupLights() {
  // Ambient
  const ambient = new THREE.AmbientLight(0x6688aa, 0.6);
  scene.add(ambient);

  // Directional (sun)
  const sun = new THREE.DirectionalLight(0xffffee, 1.2);
  sun.position.set(50, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Hemisphere light for sky/ground color
  const hemi = new THREE.HemisphereLight(0x88bbee, 0x445522, 0.4);
  scene.add(hemi);

  // Point lights for street lamps (just a few for performance)
  const lampColors = [0xffeeaa, 0xffeedd];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 60;
    const light = new THREE.PointLight(lampColors[i % 2], 0.3, 25);
    light.position.set(Math.cos(angle) * r, 6, Math.sin(angle) * r);
    scene.add(light);
  }
}

function createSky() {
  // Gradient sky dome
  const skyGeo = new THREE.SphereGeometry(250, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x3366aa) },
      bottomColor: { value: new THREE.Color(0x99ccee) },
      offset: { value: 20 },
      exponent: { value: 0.4 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Clouds
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.8, roughness: 1
  });
  for (let i = 0; i < 15; i++) {
    const cloudGroup = new THREE.Group();
    const numPuffs = 3 + Math.floor(Math.random() * 4);
    for (let j = 0; j < numPuffs; j++) {
      const puffGeo = new THREE.SphereGeometry(5 + Math.random() * 8, 8, 8);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 8
      );
      puff.scale.y = 0.5;
      cloudGroup.add(puff);
    }
    cloudGroup.position.set(
      (Math.random() - 0.5) * 400,
      60 + Math.random() * 40,
      (Math.random() - 0.5) * 400
    );
    scene.add(cloudGroup);
  }
}

function setupInput() {
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    e.preventDefault();
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ============== MENU ==============
function setupMenu() {
  const carSelect = document.getElementById('car-select');
  const trackSelect = document.getElementById('track-select');

  // Car options
  CAR_DEFS.forEach((car, i) => {
    const div = document.createElement('div');
    div.className = 'car-option' + (i === 0 ? ' selected' : '');
    div.innerHTML = `
      <div class="car-name">${car.name}</div>
      <div class="car-stats">
        SPD: ${'★'.repeat(Math.round(car.stats.speed / 40))}${'☆'.repeat(5 - Math.round(car.stats.speed / 40))}<br>
        ACC: ${'★'.repeat(Math.round(car.stats.accel / 2))}${'☆'.repeat(5 - Math.round(car.stats.accel / 2))}<br>
        HND: ${'★'.repeat(Math.round(car.stats.handling / 2))}${'☆'.repeat(5 - Math.round(car.stats.handling / 2))}
      </div>
    `;
    div.style.borderLeftColor = car.color;
    div.style.borderLeftWidth = '3px';
    div.addEventListener('click', () => {
      document.querySelectorAll('.car-option').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      selectedCar = i;
    });
    carSelect.appendChild(div);
  });

  // Track options
  TRACK_DEFS.forEach((track, i) => {
    const div = document.createElement('div');
    div.className = 'track-option' + (i === 0 ? ' selected' : '');
    const diffClass = track.difficulty === 'Easy' ? 'difficulty-easy' :
                      track.difficulty === 'Medium' ? 'difficulty-medium' : 'difficulty-hard';
    div.innerHTML = `
      <div class="track-name">${track.name}</div>
      <div class="track-info">${track.desc}</div>
      <div class="track-difficulty ${diffClass}">${track.difficulty}</div>
    `;
    div.addEventListener('click', () => {
      document.querySelectorAll('.track-option').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      selectedTrack = i;
    });
    trackSelect.appendChild(div);
  });

  // Start button
  document.getElementById('start-btn').addEventListener('click', startRace);
  document.getElementById('retry-btn').addEventListener('click', startRace);
  document.getElementById('menu-btn').addEventListener('click', returnToMenu);
}

function startRace() {
  document.getElementById('menu-screen').classList.remove('active');
  document.getElementById('race-result').classList.remove('active');
  document.getElementById('hud').classList.add('active');

  const carDef = CAR_DEFS[selectedCar];
  const trackDef = TRACK_DEFS[selectedTrack];

  // Clean up previous track
  if (trackVisuals && trackVisuals.trackGroup) {
    scene.remove(trackVisuals.trackGroup);
  }
  if (playerModel) scene.remove(playerModel);
  if (aiModel) scene.remove(aiModel);

  // Build track
  trackCurve = getTrackCurve(trackDef);
  trackVisuals = buildTrackVisuals(scene, trackDef, texFactory);

  // Create player car
  playerPhysics = new CarPhysics(carDef, trackDef.startPos, trackDef.startAngle);
  playerModel = buildCarModel(carDef, texFactory);
  playerModel.position.copy(playerPhysics.position);
  scene.add(playerModel);

  // Create AI car
  const aiCarIndex = (selectedCar + 1) % CAR_DEFS.length;
  const aiCarDef = CAR_DEFS[aiCarIndex];
  aiDriver = new AIDriver(aiCarDef, trackDef, trackCurve);
  aiModel = buildCarModel(aiCarDef, texFactory);
  aiModel.position.copy(aiDriver.physics.position);
  scene.add(aiModel);

  // Reset race state
  raceTime = 0;
  bestLapTime = Infinity;
  lapStartTime = 0;
  playerLapTimes = [];
  countdownValue = 3;
  countdownTimer = 0;
  state = 'countdown';

  showCountdown(3);
}

function returnToMenu() {
  document.getElementById('race-result').classList.remove('active');
  document.getElementById('hud').classList.remove('active');
  document.getElementById('menu-screen').classList.add('active');
  state = 'menu';
}

// ============== COUNTDOWN ==============
function showCountdown(value) {
  const el = document.getElementById('countdown');
  el.style.display = 'block';
  el.textContent = value > 0 ? value : 'GO!';
  el.style.color = value > 0 ? '#e94560' : '#4ecdc4';
  el.style.animation = 'none';
  void el.offsetHeight; // trigger reflow
  el.style.animation = 'countPulse 1s ease-in-out';

  if (value <= 0) {
    setTimeout(() => {
      el.style.display = 'none';
      state = 'racing';
      lapStartTime = performance.now();
    }, 800);
  }
}

// ============== GAME LOOP ==============
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === 'countdown') {
    countdownTimer += dt;
    if (countdownTimer >= 1) {
      countdownTimer = 0;
      countdownValue--;
      showCountdown(countdownValue);
    }
    // Position camera behind player during countdown
    updateCamera(dt);
    renderer.render(scene, camera);
    return;
  }

  if (state === 'racing') {
    updateRacing(dt);
  }

  if (state === 'menu') {
    // Slow orbit for menu background
    const time = performance.now() * 0.0001;
    camera.position.set(
      Math.cos(time) * 80,
      30 + Math.sin(time * 0.5) * 10,
      Math.sin(time) * 80
    );
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

function updateRacing(dt) {
  raceTime += dt;

  // Player input
  let throttle = 0, brake = 0, steer = 0;

  if (keys['KeyW'] || keys['ArrowUp']) throttle = 1;
  if (keys['KeyS'] || keys['ArrowDown']) throttle = -0.5;
  if (keys['KeyA'] || keys['ArrowLeft']) steer = 1;
  if (keys['KeyD'] || keys['ArrowRight']) steer = -1;
  if (keys['Space']) brake = 1;

  // Update player
  playerPhysics.setControls(throttle, brake, steer);
  const playerState = playerPhysics.update(dt, trackCurve, [aiDriver.physics]);

  // Update player model
  playerModel.position.copy(playerState.position);
  playerModel.position.y = 0;
  playerModel.rotation.y = playerState.rotation;

  // Animate player wheels
  animateWheels(playerModel, playerState);

  // Update AI
  const aiState = aiDriver.update(dt, playerPhysics.trackProgress, playerPhysics.lap);

  // Update AI model
  aiModel.position.copy(aiDriver.physics.position);
  aiModel.position.y = 0;
  aiModel.rotation.y = aiDriver.physics.rotation;

  animateWheels(aiModel, aiState);

  // Camera
  updateCamera(dt);

  // HUD
  updateHUD();

  // Check lap completion
  const trackDef = TRACK_DEFS[selectedTrack];
  checkLapCompletion(trackDef);

  // Update minimap
  updateMinimap();
}

function animateWheels(carModel, carState) {
  // Wheels are child groups of the car model
  // Rotate them based on speed
  let wheelIdx = 0;
  carModel.traverse((child) => {
    if (child.type === 'Group' && child.parent === carModel && child.children.length > 2) {
      // This is likely a wheel group
      const wheelRotSpeed = (carState.speed || 0) * 2;
      child.children.forEach(part => {
        if (part.geometry && part.geometry.type === 'TorusGeometry') {
          // Tire - spin around axle
          part.rotation.z += wheelRotSpeed * 0.016;
        }
      });
      wheelIdx++;
    }
  });
}

function updateCamera(dt) {
  if (!playerModel) return;

  const targetPos = playerModel.position.clone();
  const playerRotation = playerPhysics ? playerPhysics.rotation : 0;
  const speed = playerPhysics ? Math.abs(playerPhysics.speed) : 0;

  // Dynamic camera distance based on speed
  const speedRatio = speed / (playerPhysics ? playerPhysics.maxSpeed : 1);
  const dist = 10 + speedRatio * 5;
  const height = 4 + speedRatio * 3;

  // Camera position behind car
  const idealPos = new THREE.Vector3(
    targetPos.x + Math.sin(playerRotation) * dist,
    targetPos.y + height,
    targetPos.z + Math.cos(playerRotation) * dist
  );

  // Smooth camera follow
  camera.position.lerp(idealPos, 0.05);

  // Look at point ahead of car
  const lookTarget = new THREE.Vector3(
    targetPos.x - Math.sin(playerRotation) * 5,
    targetPos.y + 1.5,
    targetPos.z - Math.cos(playerRotation) * 5
  );
  const currentLookAt = new THREE.Vector3();
  camera.getWorldDirection(currentLookAt);
  camera.lookAt(lookTarget);
}

// ============== HUD ==============
function updateHUD() {
  if (!playerPhysics) return;

  const speedKmh = Math.round(playerPhysics.getSpeedKmh());
  document.getElementById('hud-speed').textContent = speedKmh;

  const trackDef = TRACK_DEFS[selectedTrack];
  const currentLap = Math.min(playerPhysics.lap + 1, trackDef.laps);
  document.getElementById('hud-lap').textContent = `${currentLap}/${trackDef.laps}`;

  // Time
  const mins = Math.floor(raceTime / 60);
  const secs = Math.floor(raceTime % 60);
  document.getElementById('hud-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Best lap
  if (bestLapTime < Infinity) {
    const bMins = Math.floor(bestLapTime / 60);
    const bSecs = (bestLapTime % 60).toFixed(1);
    document.getElementById('hud-best').textContent = `${bMins}:${bSecs.toString().padStart(4, '0')}`;
  }

  // Position
  const playerProg = playerPhysics.lap + playerPhysics.trackProgress;
  const aiProg = aiDriver.getEffectiveProgress();
  const isFirst = playerProg >= aiProg;
  document.getElementById('hud-pos').textContent = isFirst ? '1' : '2';
  document.getElementById('hud-pos-suffix').textContent = isFirst ? 'st' : 'nd';
}

function updateMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 180, 180);

  // Draw track on minimap
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const trackDef = TRACK_DEFS[selectedTrack];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const p = trackCurve.getPoint(t);
    const mx = 90 + p.x * 0.7;
    const my = 90 + p.z * 0.7;
    if (i === 0) ctx.moveTo(mx, my);
    else ctx.lineTo(mx, my);
  }
  ctx.closePath();
  ctx.stroke();

  // Player dot
  if (playerPhysics) {
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(
      90 + playerPhysics.position.x * 0.7,
      90 + playerPhysics.position.z * 0.7,
      4, 0, Math.PI * 2
    );
    ctx.fill();
  }

  // AI dot
  if (aiDriver) {
    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.arc(
      90 + aiDriver.physics.position.x * 0.7,
      90 + aiDriver.physics.position.z * 0.7,
      4, 0, Math.PI * 2
    );
    ctx.fill();
  }
}

function checkLapCompletion(trackDef) {
  // Track lap times
  const prevLap = playerLapTimes.length;
  if (playerPhysics.lap > prevLap && prevLap < trackDef.laps) {
    const lapTime = raceTime - (playerLapTimes.reduce((a, b) => a + b, 0));
    playerLapTimes.push(lapTime);
    if (lapTime < bestLapTime) {
      bestLapTime = lapTime;
    }
  }

  // Check race finish
  if (playerPhysics.lap >= trackDef.laps || aiDriver.physics.lap >= trackDef.laps) {
    finishRace();
  }
}

function finishRace() {
  state = 'finished';
  const trackDef = TRACK_DEFS[selectedTrack];

  const playerProg = playerPhysics.lap + playerPhysics.trackProgress;
  const aiProg = aiDriver.getEffectiveProgress();
  const won = playerProg >= aiProg;

  const resultEl = document.getElementById('race-result');
  const titleEl = document.getElementById('result-title');
  const timeEl = document.getElementById('result-time');
  const detailsEl = document.getElementById('result-details');

  titleEl.textContent = won ? 'YOU WIN!' : 'YOU LOSE';
  titleEl.className = won ? 'result-win' : 'result-lose';

  const mins = Math.floor(raceTime / 60);
  const secs = (raceTime % 60).toFixed(2);
  timeEl.textContent = `Race Time: ${mins}:${secs.padStart(5, '0')}`;

  let details = `Track: ${trackDef.name} | ${trackDef.laps} Laps\n`;
  if (bestLapTime < Infinity) {
    const bMins = Math.floor(bestLapTime / 60);
    const bSecs = (bestLapTime % 60).toFixed(2);
    details += `Best Lap: ${bMins}:${bSecs.padStart(5, '0')}`;
  }
  detailsEl.textContent = details;

  resultEl.classList.add('active');
  document.getElementById('hud').classList.remove('active');
}

// ============== LOADING ==============
function updateLoadingBar(percent, text) {
  document.getElementById('loading-bar').style.width = percent + '%';
  document.getElementById('loading-text').textContent = text;
}

// ============== START ==============
init();
