// DonLotto 3D – Presets, Farben & 3D-Sterne, überarbeitetes Design

// ===== DOM-Elemente =====
const canvas       = document.getElementById('lotto-canvas');
const drawButton   = document.getElementById('drawButton');
const statButton   = document.getElementById('statButton');
const resetButton  = document.getElementById('resetButton');

const lastDrawnEl  = document.getElementById('lastDrawn');
const ballsRowEl   = document.getElementById('ballsRow');
const mixTimeInput = document.getElementById('mixTimeInput');

let resultsBannerGroup = null;
let showcaseGroup = null;
let showcaseLabels = []; // alle Nummern-Planes im Showcase

// Zweite Phase (Sterne/Zusatzzahlen)
const secondLabel  = document.getElementById('second-phase-label');
const secondValues = document.getElementById('output-stars');
const secondType   = document.getElementById('second-type');

// Farbauswahl
const ballColorSelect = document.getElementById('ball-color');
const starColorSelect = document.getElementById('star-color');

// Presets
const presetSelect = document.getElementById('presetSelect');
const blowerModeSelect = document.getElementById('blower-mode');
const blowHintEl = document.getElementById('blow-hint');

// Audio
const soundAir     = document.getElementById('sound-air');
const soundBall    = document.getElementById('sound-ball');
const soundFanfare = document.getElementById('sound-fanfare');
const soundKnock   = document.getElementById('sound-knock');
let lastKnockTime  = 0;

// Benutzer-Eingaben
const ballDrawInput  = document.getElementById('ball-drawtarget');
const ballCountInput = document.getElementById('ball-count');
const starDrawInput  = document.getElementById('star-drawtarget');
const starCountInput = document.getElementById('star-count');

// Statistik-UI
const statsButton   = document.getElementById('statsButton');
const statsOverlay  = document.getElementById('statsOverlay');
const statsClose    = document.getElementById('statsClose');
const statsMainList = document.getElementById('statsMainList');
const statsStarList = document.getElementById('statsStarList');

// Statistik-Parameter
// let euroDraws         = null;11:34 21.11.2025
// let statsWeightsMain  = null;  // 1..50
// let statsWeightsStars = null;  // 1..12

// const STAT_WEIGHT = 0.35; // wie stark Frequency+Delay die Verteilung beeinflussen

const metalMat = new THREE.MeshStandardMaterial({
  color: 0xdddddd,
  metalness: 0.85,
  roughness: 0.35
});

const muteButton = document.getElementById('muteButton');
let soundMuted = false;

function updateMuteState() {
  const audios = [soundAir, soundBall, soundFanfare, soundKnock];
  audios.forEach(a => { if (a) a.muted = soundMuted; });

  muteButton.textContent = soundMuted ? "🔇 Sound" : "🔊 Sound";
}

muteButton.addEventListener("click", () => {
  soundMuted = !soundMuted;
  updateMuteState();
});

function playSafe(audio) {
  if (!audio || soundMuted) return;

  // Wind-Sound nur im Auto-Gebläse-Modus erlauben
  if (audio === soundAir && blowerMode !== 'auto') {
    return;
  }

  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {}
}

function stopSafe(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (e) {}
}

function playKnock() {
  const now = performance.now();
  if (now - lastKnockTime < 80) return; // 80ms Cooldown
  lastKnockTime = now;
  playSafe(soundKnock);
}

if (!canvas || typeof THREE === 'undefined') {
  console.error('Fehlendes <canvas> oder Three.js – 3D-Version kann nicht starten.');
}

// ===== Three.js Grundsetup =====
const W = canvas.width;
const H = canvas.height;

const scene = new THREE.Scene();
// Hintergrund durchsichtig – der CSS-Farbverlauf scheint durch
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
camera.position.set(0, 4, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;


// Nichts deckend löschen → komplett transparent
renderer.setClearColor(0x000000, 0);

// ===== Licht – frisches Studio-Setup =====
// etwas wärmer & heller
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.1);
hemiLight.position.set(0, 10, 0);
scene.add(hemiLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);

const frontLight = new THREE.DirectionalLight(0xffffff, 1.8);
frontLight.position.set(90, 100, -50);   // aus Kamerarichtung
scene.add(frontLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.10);
rimLight.position.set(3, 3, 6);
scene.add(rimLight);

const keyLight = new THREE.SpotLight(0xffffff, 2.1);
keyLight.position.set(6, 10, 6);
keyLight.angle = Math.PI / 6;
keyLight.penumbra = 0.5;
keyLight.decay = 2;
scene.add(keyLight);

// kräftigere Rim-Lichter für schöne Kanten-Highlights
const rimPink = new THREE.PointLight(0xff99dd, 0.9, 35);
rimPink.position.set(-6, 5, -4);
 scene.add(rimPink);

const rimBlue = new THREE.PointLight(0x99ccff, 0.9, 35);
rimBlue.position.set(5, 3, -6);
scene.add(rimBlue);

// Fake Environment für metallische Materialien
const fakeEnv = new THREE.CubeTextureLoader().load([
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B6dLJXc8AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B6dLJXc8AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B6dLJXc8AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B6dLJXc8AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B6dLJXc8AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B6dLJXc8AAAAASUVORK5CYII='
]);

// ===== Physik-Konstanten =====
const SPHERE_RADIUS = 190;
const BALL_RADIUS   = 18;

const DRUM_RADIUS_WORLD  = 4.0;
const WORLD_SCALE        = DRUM_RADIUS_WORLD / SPHERE_RADIUS;
const BALL_RADIUS_WORLD  = BALL_RADIUS * WORLD_SCALE;

// Fokus-Animation: gezoomte Kugel in der Mitte
const FOCUS_SCALE         = (0.95 * DRUM_RADIUS_WORLD) / BALL_RADIUS_WORLD;
const FOCUS_MOVE_DURATION = 0.8; // Sekunden: von Auswurf zur Mitte
const FOCUS_HOLD_DURATION = 2.0; // Sekunden: in der Mitte stehen
const FOCUS_FADE_DURATION = 0.5; // Sekunden: ausblenden

// Zielpose der Kugel/Stern im Fokus:
// - leicht nach hinten gekippt, damit die Zahl "nach oben" zeigt
// - nach vorne ausgerichtet (Zahl zeigt Richtung Kamera)
const FOCUS_FINAL_ROT_X = -0.35;  // mehr oder weniger Neigung: -0.2 bis -0.5
const FOCUS_FINAL_ROT_Y = -0.18;   // Zahl nach vorne
const FOCUS_FINAL_ROT_Z =  0.0;

// Drehrichtung: 1 = eine Umdrehung in bisheriger Richtung,
// -1 = genau in die andere Richtung
const FOCUS_ROT_DIRECTION = -1;

const DAMPING       = 0.975;
const BOUNCE        = 0.95;
const MAX_SPEED     = 700;
const GRAVITY       = 800;
const OUTWARD_FORCE = 130;
const GENTLE_FORCE  = 12;

const SPIN_FACTOR   = 0.010;

const JET_STRENGTH  = 145000;
const JET_RADIUS    = 120;
const JET_HEIGHT    = 150;

const ROT_OMEGA = { x: 0.2, y: 0.1, z: 0.05 };
const ROT_FORCE_SCALE = 15;
const DRUM_ROT_SPEED  = 0.2;

// Zieh-Einstellungen
let BALL_COUNT      = 50;
let STAR_COUNT      = 10;
let BALL_DRAWTARGET = 6;
let STAR_DRAWTARGET = 2;

let DEFAULT_AUTO_MIX_TIME = 5;
let AUTO_MIX_TIME         = DEFAULT_AUTO_MIX_TIME;

function readInputs() {
  if (ballDrawInput && ballCountInput) {
    let bd = parseInt(ballDrawInput.value, 10);
    let bc = parseInt(ballCountInput.value, 10);
    if (isNaN(bd) || bd < 0) bd = 0;
    if (isNaN(bc) || bc < 0) bc = 0;
    if (bc > 200) bc = 200;
    if (bd > bc) bd = bc;
    BALL_DRAWTARGET = bd;
    BALL_COUNT      = bc;
    ballDrawInput.value  = String(bd);
    ballCountInput.value = String(bc);
  }

  if (starDrawInput && starCountInput) {
    let sd = parseInt(starDrawInput.value, 10);
    let sc = parseInt(starCountInput.value, 10);
    if (isNaN(sd) || sd < 0) sd = 0;
    if (isNaN(sc) || sc < 0) sc = 0;
    if (sc > 200) sc = 200;
    if (sd > sc) sd = sc;
    STAR_DRAWTARGET = sd;
    STAR_COUNT      = sc;
    starDrawInput.value  = String(sd);
    starCountInput.value = String(sc);
  }

  if (mixTimeInput) {
    let mt = parseFloat(mixTimeInput.value);
    if (isNaN(mt) || mt <= 0) mt = DEFAULT_AUTO_MIX_TIME;
    if (mt > 60) mt = 60;
    AUTO_MIX_TIME = mt;
    mixTimeInput.value = String(mt);
  }
}

// Glas-Material (PBR)
const glasMaterial = new THREE.MeshStandardMaterial({
  color: 0xFFF4C8,   // heller Silberton
  metalness: 0.2,    // stark metallisch
  roughness: 0.22,   // bisschen „satiniert“, nicht komplett spiegelnd
  envMap: fakeEnv,   // <- ganz wichtig, sonst wird es dunkel
  envMapIntensity: 1.0
});


// ===== Trommel (3D-Kugel) =====
const drumGeo = new THREE.SphereGeometry(DRUM_RADIUS_WORLD, 48, 32);
const drumMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.01,     // weniger rau → mehr Glanz
  metalness: 1.90,     // stärker metallisch → mehr Spiegelung
  transparent: true,
  opacity: 0.15,        // minimal kräftiger sichtbar
  side: THREE.DoubleSide,
  depthWrite: false
});
const drumMesh = new THREE.Mesh(drumGeo, drumMat);
scene.add(drumMesh);

// ===== Metall-Rahmen (Front) exakt um die Trommel =====

// Innen-/Außenradius des Rahmens leicht über dem Trommel-Radius
const FRAME_INNER = DRUM_RADIUS_WORLD * 1.03; // fast bündig
const FRAME_OUTER = DRUM_RADIUS_WORLD * 1.15; // etwas dicker

// Der Ring ist in seiner eigenen lokalen XY-Ebene ein perfekter Kreis
const frameGeo = new THREE.RingGeometry(FRAME_INNER, FRAME_OUTER, 80);
const frameMat = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF,     // heller Silberton
  metalness: 0.1,      // echtes Metall
  roughness: 0.01,     // leicht glänzend, nicht spiegelglatt
  reflectivity: 0.9,   // starke Reflexionen
  clearcoat: 1.0,      // zusätzliche Glanzschicht
  clearcoatRoughness: 0.1,
});

const frameMesh = new THREE.Mesh(frameGeo, frameMat);


// Rahmen-Mittelpunkt = Trommel-Mittelpunkt
frameMesh.position.copy(drumMesh.position);

// WICHTIG: Rahmen so drehen, dass seine Fläche genau senkrecht zur Kamera steht
// Dann erscheint der Ring in der Projektion als perfekter Kreis.
frameMesh.lookAt(camera.position);

// minimal vor die Trommel schieben, damit nichts ineinanderclippt
frameMesh.position.addScaledVector(
  frameMesh.getWorldDirection(new THREE.Vector3()),
  0.02
);
scene.add(frameMesh);


// Metallring (Rahmen)
const ringRadius = DRUM_RADIUS_WORLD * 1.07;   // leicht größer als Trommel
const ringThickness = 0.12;

const ringGeo = new THREE.TorusGeometry(
  ringRadius,
  ringThickness,
  16,    // Torus-Radialsegmente
  80     // Torus-Tubsegmente → schön rund
);

const ring = new THREE.Mesh(ringGeo, metalMat);

ring.position.y = -0.0;
// scene.add(ring);


// ===== Nieten / Schrauben auf dem Rahmen =====
const screwGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10);
const screwMat = new THREE.MeshStandardMaterial({
  color: 0xb0b4be,
  metalness: 0.9,
  roughness: 0.45
});

const screwCount = 24;
const screwRadius = (FRAME_INNER + FRAME_OUTER) / 2; // mittig im Rahmen

for (let i = 0; i < screwCount; i++) {
  const angle = (i / screwCount) * Math.PI * 2;

  const sx = Math.cos(angle) * screwRadius;
  const sy = Math.sin(angle) * screwRadius;

  const screw = new THREE.Mesh(screwGeo, screwMat);

  // Schraube zeigt in lokalen Koordinaten nach "vorne" aus dem Rahmen
  screw.rotation.x = Math.PI / 2;

  // Position im lokalen Raum des Rahmens
  screw.position.set(sx, sy, 0.01);

  frameMesh.add(screw);
}

// ===== Neuer Holzsockel mit runder Mulde für die Trommel =====

// Basis-Parameter
const BASE_OUTER_RADIUS = DRUM_RADIUS_WORLD * 1.02;   // Gesamtgröße des Bodens
const INNER_RADIUS      = DRUM_RADIUS_WORLD * 0.72;  // Radius der Mulde (knapp größer als Trommel)
const BASE_HEIGHT       = DRUM_RADIUS_WORLD * 0.7;   // Gesamt-Höhe des Sockels
const RECESS_DEPTH      = DRUM_RADIUS_WORLD * 0.5;   // Tiefe der Mulde

// Profil für LatheGeometry (Schnitt durch den Sockel, um die Y-Achse gedreht)
const profile = [];

// 0. Start im Zentrum unten -> schließt den Boden
profile.push(new THREE.Vector2(0, 0));

// 1. Außenseite unten
profile.push(new THREE.Vector2(BASE_OUTER_RADIUS, 0));

// 2. Außenseite etwas höher (leicht ansteigend)
profile.push(new THREE.Vector2(BASE_OUTER_RADIUS, BASE_HEIGHT * 0.25));
profile.push(new THREE.Vector2(BASE_OUTER_RADIUS * 0.98, BASE_HEIGHT * 0.35));

// 3. Übergang zur Kante der Mulde (kleiner Ring um die Trommel)
profile.push(new THREE.Vector2(INNER_RADIUS + 0.5, BASE_HEIGHT * 0.4));

// 4. Mulde nach innen abfallend
profile.push(new THREE.Vector2(INNER_RADIUS + 0.2, BASE_HEIGHT * 0.4 - RECESS_DEPTH * 0.4));

// 5. Tiefster Punkt der Mulde
const holeBottomY = BASE_HEIGHT * 0.4 - RECESS_DEPTH;
profile.push(new THREE.Vector2(INNER_RADIUS, holeBottomY));

// 6. Zurück ins Zentrum unter der Mulde -> schließt auch innen
profile.push(new THREE.Vector2(0, holeBottomY));


// Lathe-Geometrie erzeugen (rotationssymmetrischer Sockel)
const woodLatheGeo = new THREE.LatheGeometry(profile, 72);

// Holztextur (wie vorher, leicht angepasst)
const woodCanvas = document.createElement('canvas');
woodCanvas.width = 512;
woodCanvas.height = 512;
const ctx = woodCanvas.getContext('2d');

ctx.fillStyle = "#d6a36a";
ctx.fillRect(0, 0, 512, 512);

ctx.strokeStyle = "#b8834c";
ctx.globalAlpha = 0.22;
ctx.lineWidth = 4;

for (let i = 0; i < 45; i++) {
  const y = i * 11 + Math.random() * 8;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x < 512; x++) {
    const wobble = Math.sin(x * 0.02 + i) * 3;
    ctx.lineTo(x, y + wobble);
  }
  ctx.stroke();
}

const woodTexture = new THREE.CanvasTexture(woodCanvas);
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(1, 1);

const woodMat = new THREE.MeshStandardMaterial({
  map: woodTexture,
  color: 0xffffff,
  roughness: 0.65,
  metalness: 0.05,
});

// Mesh erstellen
const woodBase = new THREE.Mesh(woodLatheGeo, glasMaterial);


// Ellipsen-Scaling: X breiter, Z etwas kompakter
const ELLIPSE_SCALE_X = 1.15; // links/rechts breiter
const ELLIPSE_SCALE_Z = 0.75; // vorne/hinten minimal schmaler
woodBase.scale.set(ELLIPSE_SCALE_X, 1.0, ELLIPSE_SCALE_Z);

// Positionierung unter der Trommel
woodBase.rotation.x = 0;
woodBase.position.set(0, -DRUM_RADIUS_WORLD - BASE_HEIGHT * 0.15, 0);

scene.add(woodBase);

// ===== Mathe-Helfer =====
function randRange(min, max) {
  return min + Math.random() * (max - min);
}
function length3(x, y, z) {
  return Math.sqrt(x*x + y*y + z*z);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// ===== Statistik-Helfer für Euromillions (Freq + Delay) =====

// JSON einmalig laden
async function loadEuromillionsDraws() {
  if (euroDraws) return euroDraws;
  try {
    const res = await fetch('locked/euromillions-draws.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    euroDraws = Array.isArray(data.draws) ? data.draws : [];
    console.log('Euromillions-Ziehungen geladen:', euroDraws.length);
  } catch (err) {
    console.error('Fehler beim Laden von euromillions-draws.json:', err);
    euroDraws = null;
  }
  return euroDraws;
}

// Frequenz & Delay für 1..maxNumber berechnen
function buildStatsFreqDelay(draws, fieldName, maxNumber) {
  const freq     = new Array(maxNumber + 1).fill(0);
  const lastSeen = new Array(maxNumber + 1).fill(-1);

  draws.forEach((d, index) => {
    const arr = d[fieldName];
    if (!Array.isArray(arr)) return;
    for (const n of arr) {
      if (typeof n === 'number' && n >= 1 && n <= maxNumber) {
        freq[n]++;
        lastSeen[n] = index;
      }
    }
  });

  const totalDraws = draws.length;
  const delay = new Array(maxNumber + 1).fill(0);

  for (let n = 1; n <= maxNumber; n++) {
    if (lastSeen[n] === -1) {
      delay[n] = totalDraws;
    } else {
      delay[n] = (totalDraws - 1) - lastSeen[n];
    }
  }

  function normalize(arr) {
    const slice = arr.slice(1);
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    const range = Math.max(max - min, 1);
    return arr.map((v, idx) => (idx === 0 ? 0 : (v - min) / range));
  }

  const freqNorm  = normalize(freq);
  const delayNorm = normalize(delay);

  return { freq, delay, freqNorm, delayNorm };
}

// Frequency+Delay → Gewichte, moduliert durch STAT_WEIGHT
function buildWeightsFromStats(stats, statWeight) {
  const { freqNorm, delayNorm } = stats;
  const n = freqNorm.length - 1; // 1..n
  const base = 1 / n;

  const weights = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    const statScore = 0.5 * freqNorm[i] + 0.5 * delayNorm[i]; // 0..1
    const delta = statScore - 0.5;                             // -0.5..+0.5

    const w = base * (1 + statWeight * 2 * delta);
    weights[i] = Math.max(w, base * 0.05);
  }

  const sum = weights.slice(1).reduce((a, b) => a + b, 0);
  for (let i = 1; i <= n; i++) {
    weights[i] /= sum;
  }
  weights[0] = 0;

  return weights;
}

// Berechnet die Listen für Anzeige im Popup
async function computeStatsForPopup() {
  const draws = await loadEuromillionsDraws();
  if (!draws || !draws.length) {
    throw new Error('Keine Euromillions-Daten geladen.');
  }

  const statsMain  = buildStatsFreqDelay(draws, 'numbers', 50);
  const statsStars = buildStatsFreqDelay(draws, 'stars',   12);

  statsWeightsMain  = buildWeightsFromStats(statsMain,  STAT_WEIGHT);
  statsWeightsStars = buildWeightsFromStats(statsStars, STAT_WEIGHT);

  const mainRows = [];
  for (let n = 1; n <= 50; n++) {
    mainRows.push({
      number: n,
      weight: statsWeightsMain[n],
      percent: statsWeightsMain[n] * 100,
      freq: statsMain.freq[n],
      delay: statsMain.delay[n]
    });
  }
  mainRows.sort((a, b) => b.weight - a.weight);

  const starRows = [];
  for (let s = 1; s <= 12; s++) {
    starRows.push({
      number: s,
      weight: statsWeightsStars[s],
      percent: statsWeightsStars[s] * 100,
      freq: statsStars.freq[s],
      delay: statsStars.delay[s]
    });
  }
  starRows.sort((a, b) => b.weight - a.weight);

  return { mainRows, starRows };
}

// Listenelemente im Popup rendern
function renderStatsPopup(mainRows, starRows) {
  if (!statsMainList || !statsStarList) return;

  const fmtPct = p => p.toFixed(2).replace('.', ',') + ' %';

  statsMainList.innerHTML = mainRows.map(row => `
    <div class="statsRow">
      <span class="num">${row.number}</span>
      <span class="pct">${fmtPct(row.percent)}</span>
      <span class="meta">Freq: ${row.freq}, Delay: ${row.delay}</span>
    </div>
  `).join('');

  statsStarList.innerHTML = starRows.map(row => `
    <div class="statsRow">
      <span class="num">${row.number}</span>
      <span class="pct">${fmtPct(row.percent)}</span>
      <span class="meta">Freq: ${row.freq}, Delay: ${row.delay}</span>
    </div>
  `).join('');
}

function setMeshOpacity(mesh, opacity) {
  if (!mesh) return;
  mesh.traverse(obj => {
    if (obj.material) {
      obj.material.transparent = true;
      obj.material.opacity = opacity;
    }
  });
}

// ===== Statistik-Helfer für Euromillions =====

// JSON laden (einmalig cachen)
async function loadEuromillionsDraws() {
  if (euroDraws) return euroDraws;
  try {
    const res = await fetch('euromillions-draws.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    euroDraws = Array.isArray(data.draws) ? data.draws : [];
    console.log('Euromillions-Ziehungen geladen:', euroDraws.length);
  } catch (err) {
    console.error('Fehler beim Laden von euromillions-draws.json:', err);
    euroDraws = null;
  }
  return euroDraws;
}

// Zählt, wie oft jede Zahl (1..maxNumber) in draws[*][fieldName] vorkommt
function buildHitCounts(draws, fieldName, maxNumber) {
  const counts = new Array(maxNumber + 1).fill(0); // Index 0 unbenutzt
  for (const d of draws) {
    const arr = d[fieldName];
    if (!Array.isArray(arr)) continue;
    for (const n of arr) {
      if (typeof n === 'number' && n >= 1 && n <= maxNumber) {
        counts[n]++;
      }
    }
  }
  return counts;
}

// Aus HitCounts eine Gewichtung ableiten, moduliert durch STAT_WEIGHT
function buildWeightsFromCounts(counts, statWeight) {
  const slice = counts.slice(1); // 1..N
  const max = Math.max(...slice);
  const min = Math.min(...slice);
  const range = Math.max(max - min, 1);

  // Häufigkeit -> 0..1
  const norm = slice.map(c => (c - min) / range);

  const n = slice.length;
  const base = 1 / n;  // gleichverteilte Basis

  let weights = norm.map(v => {
    const delta = v - 0.5;          // ca. [-0.5..+0.5]
    const w = base * (1 + statWeight * 2 * delta);
    return Math.max(w, base * 0.05); // nie komplett 0
  });

  const sum = weights.reduce((a, b) => a + b, 0);
  weights = weights.map(w => w / sum);

  // wieder 1-basiert machen (Index 0 unbenutzt)
  weights.unshift(0);
  return weights;
}

// Gewichtete zufällige Ziehung ohne Wiederholung
function drawDistinctWeighted(amount, weights) {
  const picked = [];
  const used = new Set();
  if (!weights) return picked;

  const maxIndex = weights.length - 1;

  while (picked.length < amount && used.size < maxIndex) {
    const r = Math.random();
    let acc = 0;
    let chosen = null;

    for (let i = 1; i <= maxIndex; i++) {
      if (used.has(i)) continue;
      acc += weights[i];
      if (r <= acc) {
        chosen = i;
        break;
      }
    }

    if (chosen == null) {
      for (let i = 1; i <= maxIndex; i++) {
        if (!used.has(i)) {
          chosen = i;
          break;
        }
      }
    }

    if (chosen != null && !used.has(chosen)) {
      used.add(chosen);
      picked.push(chosen);
    }
  }

  return picked.sort((a, b) => a - b);
}

// Bereitet für EINE statistikgewichtete Ziehung die geplanten Zahlen vor
async function prepareStatPlannedNumbers() {
  const draws = await loadEuromillionsDraws();
  if (!draws || !draws.length) {
    console.warn('Keine Euromillions-Daten vorhanden – STAT-Tipp deaktiviert.');
    statModeActive = false;
    return;
  }

  // Euromillions fix: 1..50 & 1..12
  const countsMain  = buildHitCounts(draws, 'numbers', 50);
  const countsStars = buildHitCounts(draws, 'stars', 12);

  statsWeightsMain  = buildWeightsFromCounts(countsMain,  STAT_WEIGHT);
  statsWeightsStars = buildWeightsFromCounts(countsStars, STAT_WEIGHT);

  plannedMainNumbers = drawDistinctWeighted(BALL_DRAWTARGET, statsWeightsMain);
  plannedStarNumbers = drawDistinctWeighted(STAR_DRAWTARGET, statsWeightsStars);

  console.log('STAT-Tipp geplant:', {
    main: plannedMainNumbers,
    stars: plannedStarNumbers
  });
}


// ===== Geometrien & Farben =====
const ballGeo = new THREE.SphereGeometry(BALL_RADIUS_WORLD, 32, 24);

function createStarGeometry(radius) {
  const outer = radius * 1.0;
  const inner = radius * 0.45;
  const shape = new THREE.Shape();
  const spikes = 5;
  const step = Math.PI / spikes;

  let rot = -Math.PI / 2;
  const cx = 0, cy = 0;

  shape.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0) ? outer : inner;
    const x = cx + Math.cos(rot) * r;
    const y = cy + Math.sin(rot) * r;
    shape.lineTo(x, y);
    rot += step;
  }
  shape.closePath();

  const extrudeSettings = {
    depth: radius * 0.6,
    bevelEnabled: true,
    bevelThickness: radius * 0.18,
    bevelSize: radius * 0.16,
    bevelSegments: 2
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  return geo;
}
const starGeo = createStarGeometry(BALL_RADIUS_WORLD * 1.25);

// Bounding Box berechnen, um Vorder- und Rückseite zu kennen
starGeo.computeBoundingBox();
const STAR_FRONT_Z = starGeo.boundingBox.max.z;
const STAR_BACK_Z  = starGeo.boundingBox.min.z;

// Basis-Material der Kugeln/Sterne – stark glänzend, Farbe kommt aus Textur
const baseBallMat = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  specular: 0xffffff,
  shininess: 230
});

// Farbpaletten: bewusst keine harten Schwarz/Weiß-Kontraste
function getBallPalette(name) {
  switch (name) {
    case 'white':
      return {
        bg: '#ffffff',   // echtes, reines Weiß
        text: '#333333'  // dunkles Grau für maximale Lesbarkeit
      };
    case 'gold':
      return {
        bg: '#f4cf5c',
        text: '#5a3d11'
      };
    case 'yellow':
      return {
        bg: '#ffd858',
        text: '#5a3d11'
      };
    case 'red':
      return {
        bg: '#f25b6b',
        text: '#ffffff'
      };
    default:
      // Fallback: leicht rosé
      return {
        bg: '#f7c1dc',
        text: '#5a2b3a'
      };
  }
}

// Zufällige Pastell-Palette – helle HSL-Farben, sanfte Textfarbe
function getRandomPastelPalette() {
  const h = Math.random() * 360;
  const s = 55 + Math.random() * 20; // 55–75%
  const l = 70 + Math.random() * 12; // 70–82%
  const bg = `hsl(${h}, ${s}%, ${l}%)`;

  return {
    bg,
    text: 'rgba(40, 25, 60, 0.96)'
  };
}

function drawTightNumber(ctx, str, centerX, centerY, gap) {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (str.length <= 1) {
    // 1-stellig: einfach zentrieren
    ctx.textAlign = 'center';
    ctx.fillText(str, centerX, centerY);
    return;
  }

  const chars = str.split('');
  const widths = chars.map(ch => ctx.measureText(ch).width);

  // Gesamte Breite mit engem Abstand
  const totalWidth = widths.reduce((a, w) => a + w, 0) + gap * (chars.length - 1);
  let x = centerX - totalWidth / 2;

  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, centerY);
    x += widths[i] + gap;
  }
}

// Zahlentexturen getrennt für Kugeln und Sterne

// Kugel: Zahl zweimal auf der Textur (ungefähr gegenüberliegend),
// sodass man beim Drehen vorne und hinten eine Zahl sieht.
function createNumberTextureBall(n, palette) {
  const colors = palette || getBallPalette('gold');

if (colors && colors.bg === 'white') {
  colors.bg = '#ffffff';  // echtes Weiß erzwingen
}

  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // Volle Fläche in der Grundfarbe
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, size, size);

  // weicher Highlight-Spot oben links, als Glanz
  const grad = ctx.createRadialGradient(
    size * 0.2, size * 0.22, 0,
    size * 0.2, size * 0.22, size * 0.35
  );
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.2, size * 0.22, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Schrift vorbereiten
  const str = String(n);
  ctx.font = '600 70px system-ui';
  ctx.fillStyle = colors.text;

  // enger Abstand zwischen Ziffern, z.B. 10px
  const digitGap = 1;

  // Zwei Zahlen auf der Textur – vorne & hinten auf der Kugel
  const centerY = size / 2 + 4;
  const centerLeft  = size * 0.28;
  const centerRight = size * 0.72;

  drawTightNumber(ctx, str, centerLeft,  centerY, digitGap);
  drawTightNumber(ctx, str, centerRight, centerY, digitGap);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// Stern: eine große Zahl mittig – durch DoubleSide-Material
// ist sie auf Vorder- und Rückseite sichtbar.
function createNumberTextureStar(n, palette) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // Transparenter Hintergrund
  ctx.clearRect(0, 0, size, size);

  // leichter Glanz-Spot für "spiegelnde" Sternoberfläche
  const grad = ctx.createRadialGradient(
    size * 0.25, size * 0.25, 0,
    size * 0.25, size * 0.25, size * 0.4
  );
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.25, size * 0.25, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Schriftfarbe abhängig von Palette (rot = weiß, sonst schwarz)
  let textColor = '#000000';
  if (palette && palette.bg) {
    const bg = palette.bg.toLowerCase();

    // deine Rot-Farbe ist in getBallPalette('red'): '#f25b6b'
    if (bg.includes('f25b6b') || bg.includes('red')) {
      textColor = '#ffffff';
    }
  }

  const str = String(n);
  ctx.font = '700 95px system-ui';    // hier kannst du Größe/Fettheit anpassen
  ctx.fillStyle = textColor;

  const digitGap = 10;
  const centerX = size / 2;
  const centerY = size / 2 + 4;

  drawTightNumber(ctx, str, centerX, centerY, digitGap);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}



// ===== Zustände & Daten =====
let balls = [];

let drawnMain   = [];
let drawnSecond = [];
let isSecondPhase = false;

let mode = 'idle'; // 'idle' | 'airblast' | 'drawing'
let jetPhase = 0;

let autoMixing   = false;
let autoMixTimer = 0;

let exitingBall  = null;
let exitProgress = 0;
let drawIndex    = 0;

let focusActive  = false;
let focusPhase   = null; // 'move' | 'hold' | 'fade'
let focusTimer   = 0;
let pendingResult = null; // { number, isSecondPhase }

// ===== Gebläse-Steuerung (Auto / Schütteln / Pusten) =====
const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

let blowerMode = 'auto';           // 'auto' | 'shake' | 'blow'
let lastShakeStrength = 0;         // Stärke des Schüttelns
let micLevel = 0;                  // Lautstärke / „Pusten“ (0..~1)

let micAudioCtx = null;
let micAnalyser = null;
let micSource = null;
let micStream = null;
let micLoopActive = false;

let devicemotionListenerAdded = false;



// ===== Gebläse-Hilfsfunktionen =====

function canUseShake() {
  // Schütteln nur auf mobilen Geräten, die DeviceMotion unterstützen
  return isMobileDevice && typeof window !== 'undefined' && typeof window.DeviceMotionEvent !== 'undefined';
}

function canUseMic() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function initBlowerModeOptions() {
  if (!blowerModeSelect) return;

  const optShake = blowerModeSelect.querySelector('option[value="shake"]');
  const optBlow  = blowerModeSelect.querySelector('option[value="blow"]');

  // Wir lassen beide Optionen grundsätzlich auswählbar.
  // In handleBlowerModeChange wird dann geprüft, ob das Gerät/der Browser sie wirklich unterstützt.
  // Optional können wir Hinweise im title setzen:
  if (optShake && !canUseShake()) {
    optShake.title = 'Schütteln wird von diesem Gerät/Browser eventuell nicht unterstützt.';
  }
  if (optBlow && !canUseMic()) {
    optBlow.title = 'Pusten (Mikrofon) wird von diesem Gerät/Browser eventuell nicht unterstützt oder benötigt HTTPS.';
  }
}


function handleBlowerModeChange(value) {
  if (value === 'shake') {
    // Schüttelmodus aktivieren; wir versuchen, die Sensoren zu initialisieren.
    // Falls das Gerät es doch nicht unterstützt oder iOS keine Erlaubnis gibt,
    // bleibt der Modus ausgewählt, nur die Wirkung bleibt aus.
    blowerMode = 'shake';
    initShakeControl();
  } else if (value === 'blow') {
    if (!canUseMic()) {
      alert('Pusten über Mikrofon wird von diesem Gerät/Browser nicht unterstützt oder benötigt HTTPS/localhost.');
      if (blowerModeSelect) {
        blowerModeSelect.value = 'auto';
      }
      blowerMode = 'auto';
      return;
    }
    blowerMode = 'blow';
    initMic();
  } else {
    blowerMode = 'auto';
  }
}


function initShakeControl() {
  if (devicemotionListenerAdded || !canUseShake()) return;

  function addListener() {
    window.addEventListener('devicemotion', handleDeviceMotion);
    devicemotionListenerAdded = true;
  }

  try {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS: explizite Berechtigung nötig
      DeviceMotionEvent.requestPermission()
        .then(state => {
          if (state === 'granted') {
            addListener();
          } else {
            alert('Ohne Erlaubnis für Bewegungssensoren funktioniert der Schüttelmodus nicht.');
            if (blowerModeSelect) {
              blowerModeSelect.value = 'auto';
            }
            blowerMode = 'auto';
          }
        })
        .catch(err => {
          console.error('DeviceMotion permission error', err);
          if (blowerModeSelect) {
            blowerModeSelect.value = 'auto';
          }
          blowerMode = 'auto';
        });
    } else {
      // Android / andere Browser
      addListener();
    }
  } catch (e) {
    console.error(e);
  }
}

function handleDeviceMotion(ev) {
  if (!ev) return;
  const acc = ev.accelerationIncludingGravity || ev.acceleration;
  if (!acc) return;
  const ax = acc.x || 0;
  const ay = acc.y || 0;
  const az = acc.z || 0;

  const magnitude = Math.sqrt(ax*ax + ay*ay + az*az);
  const strength = Math.max(0, magnitude - 9.81); // grob Gravitation abziehen

  // Glätten / Dämpfen
  lastShakeStrength = lastShakeStrength * 0.8 + strength * 0.2;
}

function initMic() {
  if (!canUseMic()) return;

  if (!micAudioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    micAudioCtx = new AC();
  }

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      micStream = stream;
      micSource = micAudioCtx.createMediaStreamSource(stream);
      micAnalyser = micAudioCtx.createAnalyser();
      micAnalyser.fftSize = 512;
      micSource.connect(micAnalyser);

      if (!micLoopActive) {
        micLoopActive = true;
        updateMicLevel();
      }
    })
    .catch(err => {
      console.error('getUserMedia error', err);
      alert('Kein Zugriff auf das Mikrofon – Pusten-Modus deaktiviert.\nHinweis: Auf vielen Browsern funktioniert das nur über HTTPS oder localhost und nach expliziter Freigabe.');
      if (blowerModeSelect) {
        blowerModeSelect.value = 'auto';
      }
      blowerMode = 'auto';
    });
}

function updateMicLevel() {
  if (!micAnalyser) {
    micLoopActive = false;
    return;
  }

  const buffer = new Uint8Array(micAnalyser.fftSize);
  micAnalyser.getByteTimeDomainData(buffer);

  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] - 128) / 128; // -1..1
    sum += v * v;
  }
  const rms = Math.sqrt(sum / buffer.length); // typ. 0 .. ~0.5
  micLevel = micLevel * 0.5 + rms * 0.5;

  if (blowerMode === 'blow' && micLoopActive) {
    requestAnimationFrame(updateMicLevel);
  } else {
    micLoopActive = false;
  }
}


function getJetStrengthMultiplier() {
  // PUSTEN-MODUS: Luftstärke hängt ausschließlich vom Mikro ab
  if (blowerMode === 'blow') {
    // Rauschen (Lüfter, Raum) knapp unter 0.02 meistens.
    if (micLevel < 0.02) {
      return 0; // komplett still, wenn wirklich nichts los ist
    }
    const base = Math.max(0, micLevel - 0.02);

    // Empfindlichkeit:
    //  - Faktor 35: recht empfindlich (gut für iPhone)
    //  - Max 5: nicht völlig überdrehen
    const extra = Math.min(base * 35, 5);
    return extra;
  }

  // SCHÜTTEL-MODUS: Nur Wind, wenn wirklich geschüttelt wird
  if (blowerMode === 'shake') {
    const threshold = 2.0; // Mindest-Schüttelstärke, nach Gefühl anpassen

    // Wenn das Gerät praktisch still gehalten wird: kein Gebläse
    if (lastShakeStrength < threshold) {
      return 0;
    }

    const base = lastShakeStrength - threshold;
    const extra = Math.min(base / 3, 4); // max. 4-fache Stärke
    return extra;
  }

  // AUTO-MODUS: normale Grundstärke
  return 1;
}


// ===== Statistik / STAT_WEIGHT (Euromillions) =====

// Stärke der statistischen Gewichtung:
// 0   = komplett zufällig
// 0.3 = leichte Bevorzugung „heißer“ Zahlen
// 0.6 = starke Bevorzugung
let STAT_WEIGHT = 0.35;

// Daten & Gewichte
let euroDraws          = null;  // aus euromillions-draws.json
let statsWeightsMain   = null;  // Index 1..50
let statsWeightsStars  = null;  // Index 1..12

// Modus-Flags
let statModeActive     = false; // läuft aktuell eine Statistik-Ziehung?

// geplante Zahlen für diese eine statistikgewichtete Ziehung
let plannedMainNumbers = null;  // Array Länge BALL_DRAWTARGET
let plannedStarNumbers = null;  // Array Länge STAR_DRAWTARGET

// ===== Kugeln initialisieren =====
function initBalls(count, resetResults = false) {
  // alte Meshes entfernen
  for (const b of balls) {
    if (b.mesh) scene.remove(b.mesh);
  }
  balls = [];
  exitingBall = null;
  exitProgress = 0;
  drawIndex = 0;

  if (resetResults) {
    drawnMain = [];
    drawnSecond = [];
    isSecondPhase = false;
  }

  const innerR = SPHERE_RADIUS - BALL_RADIUS * 2;

  // Farbwahl
  const colorName = isSecondPhase
    ? (starColorSelect?.value || 'gold')
    : (ballColorSelect?.value || 'gold');

  const usePastel = colorName === 'pastel';
  const basePalette = usePastel ? null : getBallPalette(colorName);

  const useStarShape = isSecondPhase && secondType && secondType.value === 'star';
  const geo = useStarShape ? starGeo : ballGeo;

  for (let n = 1; n <= count; n++) {
    let x, y, z, tries = 0;
    do {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(randRange(-1, 1));
      const r     = innerR * Math.cbrt(Math.random());
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.cos(phi);
      z = r * Math.sin(phi) * Math.sin(theta);
      tries++;
    } while (tries < 300 && balls.some(b => {
      const dx = b.x - x;
      const dy = b.y - y;
      const dz = b.z - z;
      return length3(dx, dy, dz) < BALL_RADIUS * 2.2;
    }));

  const mat = baseBallMat.clone();

  mat.transparent = true;
  mat.opacity = 1.0;

  const palette = usePastel ? getRandomPastelPalette() : basePalette;

  let mesh;

  if (useStarShape) {

  // Stern in der gewählten Hintergrundfarbe der Palette färben
  mat.map = null;
  const palette = usePastel ? getRandomPastelPalette() : basePalette;
  mat.color = new THREE.Color(palette.bg);  // Stern bekommt die Farbpalette!
  mesh = new THREE.Mesh(geo, mat);

  // Zahlentextur erzeugen
const tex = createNumberTextureStar(n, palette);

const planeSize = BALL_RADIUS_WORLD * 2.4;
const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);

const planeMatFront = new THREE.MeshBasicMaterial({
  map: tex,
  transparent: true,
  alphaTest: 0.2,   // verwirft Pixel mit sehr niedriger Alpha
  depthWrite: false // verhindert, dass die Plane andere Dinge „wegdrückt“
});
const planeMatBack = planeMatFront.clone();

const front = new THREE.Mesh(planeGeo, planeMatFront);
// ganz knapp vor der Sternoberfläche
front.position.z = STAR_FRONT_Z + 0.001;

const back = new THREE.Mesh(planeGeo, planeMatBack);
// ganz knapp hinter der Rückseite (mit 180° Drehung)
back.position.z = STAR_BACK_Z - 0.001;
back.rotation.y = Math.PI;

mesh.add(front);
mesh.add(back);

  } else {
    // BALL: wie gehabt, Textur mit zwei Zahlen vorne/hinten
    mat.map = createNumberTextureBall(n, palette);
    mat.map.encoding = THREE.sRGBEncoding;
    mat.needsUpdate = true;

    mesh = new THREE.Mesh(geo, mat);
  }

  mesh.position.set(WORLD_SCALE * x, -WORLD_SCALE * y, WORLD_SCALE * z);
  scene.add(mesh);

  balls.push({
    x, y, z,
    vx: 0,
    vy: 0,
    vz: 0,
    number: n,
    exiting: false,
    exitStep: 0,
    startExit: null,
    spinAngle: Math.random() * Math.PI * 2,
    spinVel: 0,
    asleep: false,
    mesh
  });
}

  updateUI();
}

// ===== UI-Update =====
function updateUI() {
  const activeArray = isSecondPhase ? drawnSecond : drawnMain;

  if (lastDrawnEl) {
    if (activeArray.length > 0) {
      const last = activeArray[activeArray.length - 1];
      lastDrawnEl.innerHTML = `Letzte Ziehung: <span>${last}</span>`;
    } else {
      lastDrawnEl.innerHTML = 'Letzte Ziehung: <span>–</span>';
    }
  }

  if (ballsRowEl) {
    if (drawnMain.length === 0) {
      ballsRowEl.innerHTML =
        '<span class="resultRowLabel">Zahlen:</span>' +
        '<span class="chip empty">–</span>';
    } else {
      const sorted = [...drawnMain].sort((a, b) => a - b);
      ballsRowEl.innerHTML =
        '<span class="resultRowLabel">Zahlen:</span>' +
        sorted.map(n => `<span class="chip">${n}</span>`).join('');
    }
  }

  if (secondLabel) {
    if (secondType && secondType.value === 'star') {
      secondLabel.textContent = 'Sterne:';
    } else {
      secondLabel.textContent = 'Zusatzzahlen:';
    }
  }

  if (secondValues) {
    if (drawnSecond.length === 0) {
      secondValues.innerHTML =
        '<span class="chip starChip empty">–</span>';
    } else {
      const sorted = [...drawnSecond].sort((a, b) => a - b);
      secondValues.innerHTML =
        sorted.map(n => `<span class="chip starChip">${n}</span>`).join('');
    }
  }
}

function clearShowcase() {
  if (!showcaseGroup) return;

  scene.remove(showcaseGroup);

  showcaseGroup.traverse(obj => {
    if (obj.material && obj.material.map) obj.material.map.dispose();
    if (obj.material) obj.material.dispose();
    if (obj.geometry) obj.geometry.dispose();
  });

  showcaseGroup = null;
}


function createShowcaseMesh(num, isStarShape, mainOrStar) {
  const mat = baseBallMat.clone();
  mat.transparent = false;
  mat.opacity = 1.0;

  // Farbwahl basierend auf der aktuellen Auswahl
  let colorName;
  if (mainOrStar === 'main') {
    colorName = ballColorSelect?.value || 'gold';
  } else {
    colorName = starColorSelect?.value || 'gold';
  }

  const usePastel   = colorName === 'pastel';
  const basePalette = usePastel ? null : getBallPalette(colorName);
  const palette     = usePastel ? getRandomPastelPalette() : basePalette;

  let mesh;

  if (isStarShape) {
    // Sternfarbe setzen
    mat.map = null;
    mat.color = new THREE.Color(palette.bg);
    mesh = new THREE.Mesh(starGeo, mat);

    // Zahlentextur wie im Ziehungsmodus
    const tex = createNumberTextureStar(num, palette);
    const planeSize = BALL_RADIUS_WORLD * 2.4;
    const geo = new THREE.PlaneGeometry(planeSize, planeSize);

    const matF = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false
    });

    const front = new THREE.Mesh(geo, matF);
    front.position.z = STAR_FRONT_Z + 0.001;

    const back = new THREE.Mesh(geo, matF.clone());
    back.position.z = STAR_BACK_Z - 0.001;
    back.rotation.y = Math.PI;

    mesh.add(front);
    mesh.add(back);
  } else {
    // Kugel mit Textur
    mat.map = createNumberTextureBall(num, palette);
    mat.map.encoding = THREE.sRGBEncoding;
    mat.needsUpdate = true;

    mesh = new THREE.Mesh(ballGeo, mat);
  }

  // etwas größer für die Ergebnisanzeige
// Kugeln normal groß, Sterne etwas kleiner
if (isStarShape) {
  mesh.scale.set(1.0, 1.0, 1.0);   // ⭐ Sterne kleiner
} else {
  mesh.scale.set(1.3, 1.3, 1.3);   // 🔵 Kugeln wie bisher
}

  return mesh;
}


function buildShowcaseForResults() {
  clearShowcase();

  showcaseGroup = new THREE.Group();

  const mainNumbers  = [...drawnMain].sort((a, b) => a - b);
  const extraNumbers = [...drawnSecond].sort((a, b) => a - b);

  const useStarShapeForExtras = (secondType && secondType.value === 'star');

  // Layoutparameter
  const zPos       = 4.0;
  const spacing    = BALL_RADIUS_WORLD * 3.0;
  const rowCenterY = 1.5;                   // alles weiter nach oben
  const rowGap     = 1.5;                   // Abstand zwischen oberer/unterer Reihe
  const rowOffsetY = 1.4;

  // Hauptzahlen (oben)
  if (mainNumbers.length > 0) {
    const n = mainNumbers.length;
    const totalWidth = (n - 1) * spacing;
    const startX = -totalWidth / 2;

    mainNumbers.forEach((num, i) => {
      const mesh = createShowcaseMesh(num, false, "main");
      const x = startX + i * spacing;
      const y = rowCenterY + rowGap * 0.5;

      mesh.position.set(x, y, zPos);
      showcaseGroup.add(mesh);
    });
  }

  // Zusatz/Sterne (unten)
  if (extraNumbers.length > 0) {
    const n = extraNumbers.length;
    const totalWidth = (n - 1) * spacing;
    const startX = -totalWidth / 2;

    extraNumbers.forEach((num, i) => {
      const mesh = createShowcaseMesh(num, useStarShapeForExtras, "star");
      const x = startX + i * spacing;
      const y = rowCenterY - rowGap * 0.5;

      mesh.position.set(x, y, zPos);
      showcaseGroup.add(mesh);
    });
  }

  scene.add(showcaseGroup);
}



function clearResultsBanner() {
  if (!resultsBannerGroup) return;

  scene.remove(resultsBannerGroup);
  resultsBannerGroup.traverse(obj => {
    if (obj.material && obj.material.map) {
      obj.material.map.dispose();
    }
    if (obj.material) obj.material.dispose();
    if (obj.geometry) obj.geometry.dispose();
  });
  resultsBannerGroup = null;
}

function createResultsLineTexture(numbersArr) {
  const sizeX = 1024;
  const sizeY = 256;

  const c = document.createElement('canvas');
  c.width = sizeX;
  c.height = sizeY;
  const ctx = c.getContext('2d');

  // Hintergrund halbtransparent-weiß, leicht abgerundet
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  const r = 40;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(sizeX - r, 0);
  ctx.quadraticCurveTo(sizeX, 0, sizeX, r);
  ctx.lineTo(sizeX, sizeY - r);
  ctx.quadraticCurveTo(sizeX, sizeY, sizeX - r, sizeY);
  ctx.lineTo(r, sizeY);
  ctx.quadraticCurveTo(0, sizeY, 0, sizeY - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // leichter Glanz oben
  const grad = ctx.createLinearGradient(0, 0, 0, sizeY);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, sizeX, sizeY * 0.6);

  const text = (numbersArr && numbersArr.length)
    ? [...numbersArr].sort((a, b) => a - b).join('   ')
    : '–';

  ctx.font = '900 140px system-ui';
  ctx.fillStyle = 'rgba(60, 35, 90, 0.98)';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const centerX = sizeX / 2;
  const centerY = sizeY / 2 + 4;
  ctx.fillText(text, centerX, centerY);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function show3DResultsBanner() {
  clearResultsBanner();

  resultsBannerGroup = new THREE.Group();

  const mainTex  = createResultsLineTexture(drawnMain);
  const extraTex = createResultsLineTexture(drawnSecond);

  // Breite/Höhe im Welt-Raum (vor der Trommel)
  const width  = 7.5;
  const height = 1.4;

  const geo = new THREE.PlaneGeometry(width, height);

  const matMain = new THREE.MeshBasicMaterial({
    map: mainTex,
    transparent: true
  });
  const matExtra = new THREE.MeshBasicMaterial({
    map: extraTex,
    transparent: true
  });

  const mainMesh = new THREE.Mesh(geo, matMain);
  const extraMesh = new THREE.Mesh(geo, matExtra);

  // Position: vor der Trommel, zwei Zeilen untereinander
  const zPos = 2.2;   // vor dem Trommelzentrum (0,0,0)
  mainMesh.position.set(0, 0.7, zPos);
  extraMesh.position.set(0, -0.7, zPos);

  resultsBannerGroup.add(mainMesh);
  resultsBannerGroup.add(extraMesh);

  scene.add(resultsBannerGroup);
}


// ===== Physik =====
function applyGravityAndShellForce(dt) {
  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    b.vy += GRAVITY * dt;

    const r = length3(b.x, b.y, b.z) || 1;
    const nx = b.x / r;
    const ny = b.y / r;
    const nz = b.z / r;

    if (r < SPHERE_RADIUS - BALL_RADIUS * 3) {
      b.vx += nx * OUTWARD_FORCE * dt;
      b.vy += ny * OUTWARD_FORCE * dt * 0.3;
      b.vz += nz * OUTWARD_FORCE * dt;
    }
  }
}

function applyGravityOnly(dt) {
  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    b.vy += GRAVITY * dt;
  }
}

function applyAirJet(dt) {
  const nozzleBottomY = SPHERE_RADIUS - BALL_RADIUS * 2;
  const nozzleTopY    = nozzleBottomY - JET_HEIGHT;
  const pulse = 1 + 0.2 * Math.sin(jetPhase * 3 + Math.sin(jetPhase * 1.3));

  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    if (b.y < nozzleTopY || b.y > nozzleBottomY) continue;

    const rXZ = Math.sqrt(b.x*b.x + b.z*b.z);
    if (rXZ > JET_RADIUS) continue;

    const radialFactor = 1 - (rXZ / JET_RADIUS);
    const verticalFactor = 1 - (b.y - nozzleTopY) / (nozzleBottomY - nozzleTopY);
    const f = Math.max(0, radialFactor * verticalFactor);
    if (f <= 0) continue;

    const strength = JET_STRENGTH * f * pulse * getJetStrengthMultiplier();

    b.vy -= strength * dt;

    const swirl = strength * 0.04;
    b.vx += randRange(-1, 1) * swirl * dt;
    b.vz += randRange(-1, 1) * swirl * dt;
  }
}

function applyRotationalSwirl(dt) {
  const ox = ROT_OMEGA.x;
  const oy = ROT_OMEGA.y;
  const oz = ROT_OMEGA.z;

  for (const b of balls) {
    if (b.exiting || b.asleep) continue;
    const rx = b.x, ry = b.y, rz = b.z;
    const tx = oy * rz - oz * ry;
    const ty = oz * rx - ox * rz;
    const tz = ox * ry - oy * rx;
    b.vx += tx * ROT_FORCE_SCALE * dt;
    b.vy += ty * ROT_FORCE_SCALE * dt;
    b.vz += tz * ROT_FORCE_SCALE * dt;
  }
}

function integrateBalls(dt) {
  const maxDist = SPHERE_RADIUS - BALL_RADIUS;

  for (const b of balls) {
    if (b.exiting || b.asleep) continue;

    const speed0 = length3(b.vx, b.vy, b.vz);
    if (speed0 > MAX_SPEED) {
      const f = MAX_SPEED / (speed0 || 1);
      b.vx *= f;
      b.vy *= f;
      b.vz *= f;
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;

    const distFromCenter = length3(b.x, b.y, b.z);
    if (distFromCenter > maxDist) {
      const nx = b.x / distFromCenter;
      const ny = b.y / distFromCenter;
      const nz = b.z / distFromCenter;

      b.x = nx * maxDist;
      b.y = ny * maxDist;
      b.z = nz * maxDist;

      const dot = b.vx*nx + b.vy*ny + b.vz*nz;
      b.vx = (b.vx - 2*dot*nx) * BOUNCE;
      b.vy = (b.vy - 2*dot*ny) * BOUNCE;
      b.vz = (b.vz - 2*dot*nz) * BOUNCE;

      if (ny < -0.7) {
        let tx = -nz;
        let tz = nx;
        let tlen = Math.sqrt(tx*tx + tz*tz) || 1;
        tx /= tlen; tz /= tlen;
        const side = Math.random() < 0.5 ? 1 : -1;
        const sideSpeed = 140;
        b.vx += tx * side * sideSpeed;
        b.vz += tz * side * sideSpeed;
      }
    }

    b.vx *= DAMPING;
    b.vy *= DAMPING;
    b.vz *= DAMPING;

    const tangentialSpeed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
    b.spinVel += tangentialSpeed * SPIN_FACTOR * dt;
    b.spinVel *= 0.98;
    b.spinAngle += b.spinVel * dt;

    if (b.mesh) {
      b.mesh.position.set(
        WORLD_SCALE * b.x,
        -WORLD_SCALE * b.y,
        WORLD_SCALE * b.z
      );
      b.mesh.rotation.y = b.spinAngle;
    }
  }
}

function handleCollisions() {
  const n = balls.length;
  for (let i = 0; i < n; i++) {
    const bi = balls[i];
    if (bi.exiting || bi.asleep) continue;
    for (let j = i+1; j < n; j++) {
      const bj = balls[j];
      if (bj.exiting || bj.asleep) continue;
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const dz = bj.z - bi.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const minDist = BALL_RADIUS * 2;
      if (dist > 0 && dist < minDist) {

        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        const overlap = minDist - dist;
        const half = overlap / 2;
        bi.x -= nx * half;
        bi.y -= ny * half;
        bi.z -= nz * half;
        bj.x += nx * half;
        bj.y += ny * half;
        bj.z += nz * half;

        const vix = bi.vx, viy = bi.vy, viz = bi.vz;
        const vjx = bj.vx, vjy = bj.vy, vjz = bj.vz;
        const rvx = vix - vjx;
        const rvy = viy - vjy;
        const rvz = viz - vjz;
        const relVelAlongNormal = rvx*nx + rvy*ny + rvz*nz;

if (relVelAlongNormal < 0) {
  // Aufprallstärke (positiv gemacht)
  const impactStrength = -relVelAlongNormal;

  // Nur während des Wirbels (airblast) und nur ab einer gewissen Stärke
  const IMPACT_THRESHOLD = 130; // nach Geschmack anpassen (80–200 testen)

  if (mode === 'airblast' && impactStrength > IMPACT_THRESHOLD) {
    playKnock();  // nutzt weiterhin deinen Cooldown
  }

  const impulse = -(1 + BOUNCE) * relVelAlongNormal / 2;
  const ix = impulse * nx;
  const iy = impulse * ny;
  const iz = impulse * nz;
  bi.vx += ix; bi.vy += iy; bi.vz += iz;
  bj.vx -= ix; bj.vy -= iy; bj.vz -= iz;
}        

      }
    }
  }
}

// ===== Ziehung mit 2 Phasen =====
function startSingleDraw() {
  if (exitingBall || focusActive) return;

  const remaining = balls.filter(b => !b.exiting && !b.asleep);
  if (!remaining.length) return;

  let pick = null;

  if (statModeActive) {
    let targetNumber = null;

    if (!isSecondPhase && Array.isArray(plannedMainNumbers)) {
      targetNumber = plannedMainNumbers[drawIndex] ?? null;
    } else if (isSecondPhase && Array.isArray(plannedStarNumbers)) {
      targetNumber = plannedStarNumbers[drawIndex] ?? null;
    }

    if (typeof targetNumber === 'number') {
      const candidates = remaining.filter(b => b.number === targetNumber);
      if (candidates.length > 0) {
        pick = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
  }

  // Fallback: normal zufällige Kugel, falls kein Ziel oder nicht gefunden
  if (!pick) {
    pick = remaining[Math.floor(Math.random() * remaining.length)];
  }

  exitingBall = pick;
  exitingBall.exiting = true;
  exitProgress = 0;

  focusActive = false;
  focusPhase  = null;
  focusTimer  = 0;
  pendingResult = null;

  setMeshOpacity(exitingBall.mesh, 1.0);
}


function updateExitingBall(dt) {
  if (!exitingBall) return;
  const b = exitingBall;

  // PHASE 1: unten aus der Trommel gleiten (wie bisher)
  if (!focusActive) {
    exitProgress += dt * 0.85;
    if (exitProgress > 1) exitProgress = 1;

    if (!b.startExit) {
      const len = length3(b.x, b.y, b.z) || 1;
      const factor = (SPHERE_RADIUS - BALL_RADIUS) / len;
      b.startExit = {
        x: b.x * factor,
        y: b.y * factor,
        z: b.z * factor
      };
    }

    const s = b.startExit;
    const t = exitProgress;

    const targetX = 0;
    const targetY = SPHERE_RADIUS - BALL_RADIUS * 0.5;
    const targetZ = SPHERE_RADIUS * 0.3;

    b.x = s.x + (targetX - s.x) * t;
    b.y = s.y + (targetY - s.y) * t;
    b.z = s.z + (targetZ - s.z) * t;

    if (b.mesh) {
      b.mesh.position.set(
        WORLD_SCALE * b.x,
        -WORLD_SCALE * b.y,
        WORLD_SCALE * b.z
      );
    }

// Am Ende von Phase 1: Fokus-Sequenz starten
if (t >= 1) {
  playSafe(soundBall);

  focusActive = true;
  focusPhase  = 'move';
  focusTimer  = 0;


  b.focusStart = { x: b.x, y: b.y, z: b.z };
  b.focusTarget = { x: 0, y: 0, z: 0 };

  pendingResult = {
    number: b.number,
    isSecondPhase: isSecondPhase
  };

  mode = 'focus';
}

    return;
  }

  // PHASE 2–4: Fokus (move → hold → fade)
  if (focusPhase === 'move') {
    focusTimer += dt;
    let t = Math.min(focusTimer / FOCUS_MOVE_DURATION, 1);
    t = smoothstep(t);

    const sx = b.focusStart.x;
    const sy = b.focusStart.y;
    const sz = b.focusStart.z;
    const tx = b.focusTarget.x;
    const ty = b.focusTarget.y;
    const tz = b.focusTarget.z;

    b.x = sx + (tx - sx) * t;
    b.y = sy + (ty - sy) * t;
    b.z = sz + (tz - sz) * t;

    const scale = 1 + (FOCUS_SCALE - 1) * t;

  if (b.mesh) {
    b.mesh.position.set(
      WORLD_SCALE * b.x,
      -WORLD_SCALE * b.y,
      WORLD_SCALE * b.z
    );
    b.mesh.scale.set(scale, scale, scale);

    // Rotation:
    // - X & Z: feste "schöne" Endpose
    // - Y: 1 komplette Umdrehung in gewählter Richtung,
    //      von t=0 (viel verdreht) zu t=1 (FOCUS_FINAL_ROT_Y)
    const rx = FOCUS_FINAL_ROT_X;
    const rz = FOCUS_FINAL_ROT_Z;

    // t ist schon gesmootht, also hier direkt verwenden
    const ry = FOCUS_FINAL_ROT_Y
             + FOCUS_ROT_DIRECTION * (1 - t) * Math.PI * 2;

    b.mesh.rotation.set(rx, ry, rz);
  }

    if (focusTimer >= FOCUS_MOVE_DURATION) {
      focusPhase = 'hold';
      focusTimer = 0;
    }

} else if (focusPhase === 'hold') {
  focusTimer += dt;

  if (b.mesh) {
    const tx = b.focusTarget.x;
    const ty = b.focusTarget.y;
    const tz = b.focusTarget.z;
    b.mesh.position.set(
      WORLD_SCALE * tx,
      -WORLD_SCALE * ty,
      WORLD_SCALE * tz
    );
    b.mesh.scale.set(FOCUS_SCALE, FOCUS_SCALE, FOCUS_SCALE);

    // Rotation in die "Endpose" setzen:
    // Zahl nach vorne + leicht nach oben gekippt
    b.mesh.rotation.set(
      FOCUS_FINAL_ROT_X,
      FOCUS_FINAL_ROT_Y,  // ohne +2π, visuell identisch
      FOCUS_FINAL_ROT_Z
    );
  }

  if (focusTimer >= FOCUS_HOLD_DURATION) {
    focusPhase = 'fade';
    focusTimer = 0;
  }

  } else if (focusPhase === 'fade') {
    focusTimer += dt;
    const f = Math.min(focusTimer / FOCUS_FADE_DURATION, 1);
    const opacity = 1 - f;

    setMeshOpacity(b.mesh, opacity);

    // sicher in der Mitte bleiben
    const tx = b.focusTarget.x;
    const ty = b.focusTarget.y;
    const tz = b.focusTarget.z;
    if (b.mesh) {
      b.mesh.position.set(
        WORLD_SCALE * tx,
        -WORLD_SCALE * ty,
        WORLD_SCALE * tz
      );
    }

    if (f >= 1) {
      // Fokus komplett – Kugel/Stoff entfernen und Ergebnis verbuchen
      if (b.mesh) scene.remove(b.mesh);
      balls = balls.filter(bb => bb !== b);

      if (pendingResult) {
        if (!pendingResult.isSecondPhase) {
          drawnMain.push(pendingResult.number);
        } else {
          drawnSecond.push(pendingResult.number);
        }
      }

      // playSafe(soundBall);
      updateUI();

      drawIndex++;
      exitingBall   = null;
      focusActive   = false;
      focusPhase    = null;
      focusTimer    = 0;
      exitProgress  = 0;
      pendingResult = null;

      const currentTarget = !isSecondPhase ? BALL_DRAWTARGET : STAR_DRAWTARGET;

      if (drawIndex >= currentTarget) {
        if (!isSecondPhase && STAR_DRAWTARGET > 0 && STAR_COUNT > 0) {
          // In zweite Phase wechseln
          isSecondPhase = true;
          drawIndex = 0;

          initBalls(STAR_COUNT, false); // erste Ergebnisse behalten

          mode = 'airblast';
          autoMixing = true;
          autoMixTimer = 0;
          playSafe(soundAir);

          return;
        }

        // komplett fertig
        mode = 'idle';
        autoMixing = false;
        stopSafe(soundAir);


        // ALLE verbliebenen Kugeln/Sterne in der Trommel entfernen
        for (const bb of balls) {
          if (bb.mesh) {
            scene.remove(bb.mesh);
          }
        }
        balls = [];
        exitingBall   = null;
        exitProgress  = 0;

        // Statistikmodus nach kompletter Ziehung zurücksetzen
        statModeActive     = false;
        plannedMainNumbers = null;
        plannedStarNumbers = null;

        // 3D-Showcase aller gezogenen Kugeln & Sterne vor der Trommel
        buildShowcaseForResults();

        // Fanfare erst NACH Anzeige spielen
        setTimeout(() => {
          playSafe(soundFanfare);
        }, 400);  // 0.4 s „dramatische Pause“

        if (drawButton) {
          drawButton.disabled = false;
          drawButton.textContent = 'Ziehung starten 💨';
        }
      } else {
        // Nächste Kugel: erst wieder wirbeln, dann ziehen
        mode = 'airblast';
        autoMixing = true;
        autoMixTimer = 0;
        playSafe(soundAir);
      }
    }
  }
}

// ===== Steuerung / Moduswechsel =====
function startDrawSequence() {
  if (mode !== 'idle') return;

  clearResultsBanner();
  clearShowcase();

  readInputs();

  if (BALL_COUNT <= 0 || BALL_DRAWTARGET <= 0) return;

  isSecondPhase = false;
  initBalls(BALL_COUNT, true);

  mode = 'airblast';
  jetPhase = 0;
  autoMixing = true;
  autoMixTimer = 0;
  drawIndex = 0;
  exitingBall = null;
  exitProgress = 0;

  if (drawButton) {
    drawButton.disabled = true;
    drawButton.textContent = 'Ziehung läuft…';
  }
  playSafe(soundAir);
}

function resetAll() {
  stopSafe(soundAir);
  clearResultsBanner();
  clearShowcase();

  // Zustände komplett zurücksetzen
  mode = 'idle';
  autoMixing   = false;
  autoMixTimer = 0;
  jetPhase     = 0;

  exitingBall  = null;
  exitProgress = 0;
  drawIndex    = 0;

  focusActive  = false;
  focusPhase   = null;
  focusTimer   = 0;
  pendingResult = null;

  isSecondPhase = false;

  // Statistikmodus zurücksetzen
  statModeActive     = false;
  plannedMainNumbers = null;
  plannedStarNumbers = null;

  // Kugeln neu aufbauen & UI zurücksetzen
  initBalls(BALL_COUNT, true);
  if (drawButton) {
    drawButton.disabled = false;
    drawButton.textContent = 'Ziehung starten 💨';
  }
}


function setCanvasBackgroundForPreset(preset) {
  const canvasEl = document.getElementById('canvas-bg');
  if (!canvasEl) return;

  canvasEl.classList.remove(
    'preset-euromillions',
    'preset-eurojackpot',
    'preset-swisslotto',
    'preset-custom'
  );

  switch (preset) {
    case 'euromillions':
      canvasEl.classList.add('preset-euromillions');
      break;

    case 'eurojackpot':
      canvasEl.classList.add('preset-eurojackpot');
      break;

    case 'swisslotto':
      canvasEl.classList.add('preset-swisslotto');
      break;

    case 'custom':
    default:
      canvasEl.classList.add('preset-custom');
      break;
  }
}

// ===== Presets =====
function applyPresetEuromillions() {
  // 5 aus 50, Sterne: 2 aus 12
  ballCountInput.value  = '50';
  ballDrawInput.value   = '5';
  starCountInput.value  = '12';
  starDrawInput.value   = '2';

  if (secondType) secondType.value = 'star';

  if (ballColorSelect) ballColorSelect.value = 'white';
  if (starColorSelect) starColorSelect.value = 'gold';

  readInputs();
  updateUI();
}

function applyPresetEurojackpot() {
  // 5 aus 50, 2 Eurozahlen aus 12 (Kugeln)
  ballCountInput.value  = '50';
  ballDrawInput.value   = '5';
  starCountInput.value  = '12';
  starDrawInput.value   = '2';

  if (secondType) secondType.value = 'extra';

  if (ballColorSelect) ballColorSelect.value = 'yellow';
  if (starColorSelect) starColorSelect.value = 'yellow';

  readInputs();
  updateUI();
}

function applyPresetSwissLotto() {
  // 6 aus 42, 1 Zusatzzahl aus 6 (Kugeln)
  ballCountInput.value  = '42';
  ballDrawInput.value   = '6';
  starCountInput.value  = '6';
  starDrawInput.value   = '1';

  if (secondType) secondType.value = 'extra';

  if (ballColorSelect) ballColorSelect.value = 'white';
  if (starColorSelect) starColorSelect.value = 'yellow';

  readInputs();
  updateUI();
}

function applyPresetCustom() {
  // Eigene Einstellungen → 5 aus 50, 2 aus 12, alles Pastell
  if (ballCountInput)  ballCountInput.value  = '50';
  if (ballDrawInput)   ballDrawInput.value   = '5';
  if (starCountInput)  starCountInput.value  = '12';
  if (starDrawInput)   starDrawInput.value   = '2';

  if (ballColorSelect) ballColorSelect.value = 'pastel';
  if (starColorSelect) starColorSelect.value = 'pastel';

  readInputs();  // Werte in BALL_COUNT, BALL_DRAWTARGET, STAR_COUNT, STAR_DRAWTARGET übernehmen
  updateUI();
}


// Beim Ändern des Presets: anwenden + neu mischen (keine automatische Ziehung)
if (presetSelect) {
  presetSelect.addEventListener('change', () => {
    const val = presetSelect.value;
    if (val === 'euromillions') {
      applyPresetEuromillions();
    } else if (val === 'eurojackpot') {
      applyPresetEurojackpot();
    } else if (val === 'swisslotto') {
      applyPresetSwissLotto();
    } else if (val === 'custom') {
      applyPresetCustom();
    }

    // Hintergrund exklusiv im Canvas aktualisieren
    setCanvasBackgroundForPreset(val);

    // nur neu mischen mit den Preset-Werten, Ziehung startet der Nutzer selbst
    resetAll();
  });
}

// ===== Haupt-Loop =====
let lastTimestamp = null;

function animate(timestamp) {
  if (lastTimestamp == null) lastTimestamp = timestamp;
  let dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  dt = Math.min(dt, 0.03);
  const dtSim = dt;

  lastShakeStrength *= 0.98;

  // Hinweis nur im Puste-Modus während des Wirbelns anzeigen
  if (blowHintEl) {
    if (mode === 'airblast' && blowerMode === 'blow') {
      blowHintEl.classList.add('visible');
    } else {
      blowHintEl.classList.remove('visible');
    }
  }

// Trommel dreht nur beim Wirbeln / Ziehen, nicht im Fokus
if (mode === 'airblast' || mode === 'drawing') {
  drumMesh.rotation.y += DRUM_ROT_SPEED * dtSim;
  drumMesh.rotation.z += DRUM_ROT_SPEED * 0.5 * dtSim;
} else {
  drumMesh.rotation.y *= 0.98;
  drumMesh.rotation.z *= 0.98;
}

jetPhase += dtSim;

// Im Fokus keine Air-Forces, nur Gravitation
if (mode === 'drawing' || mode === 'focus') {
  applyGravityOnly(dtSim);
} else {
  applyGravityAndShellForce(dtSim);
}

  if (mode === 'airblast') {
    applyAirJet(dtSim);
    applyRotationalSwirl(dtSim);

    if (autoMixing) {
      autoMixTimer += dtSim;
      if (autoMixTimer >= AUTO_MIX_TIME) {
        autoMixing = false;
        mode = 'drawing';
        stopSafe(soundAir);

        startSingleDraw();
        setTimeout(startSingleDraw, 500);
      }
    }
  }

  integrateBalls(dtSim);
  handleCollisions();
  updateExitingBall(dtSim);

  // Showcase-Labels immer zur Kamera drehen (Zahl schaut direkt nach vorne)
  if (showcaseLabels && showcaseLabels.length) {
    for (const lbl of showcaseLabels) {
      lbl.lookAt(camera.position);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ===== Events & Start =====
if (blowerModeSelect) {
  blowerModeSelect.addEventListener('change', (e) => {
    handleBlowerModeChange(e.target.value);
  });
}
if (drawButton) {
  drawButton.addEventListener('click', () => {
    if (mode !== 'idle') return;
    // normale Zufallsziehung
    statModeActive     = false;
    plannedMainNumbers = null;
    plannedStarNumbers = null;
    startDrawSequence();
  });
}

if (statButton) {
  statButton.addEventListener('click', async () => {
    if (mode !== 'idle') return;

    // Euromillions-Preset sicherstellen
    if (presetSelect && presetSelect.value !== 'euromillions') {
      presetSelect.value = 'euromillions';
      applyPresetEuromillions();
      setCanvasBackgroundForPreset('euromillions');
    }

    // Eingaben lesen (setzt BALL_DRAWTARGET / STAR_DRAWTARGET)
    readInputs();

    statModeActive = true;
    await prepareStatPlannedNumbers();

    if (!statModeActive || !plannedMainNumbers || plannedMainNumbers.length === 0) {
      // Fallback: wenn Statistik nicht verfügbar, normale Ziehung
      statModeActive = false;
      startDrawSequence();
      return;
    }

    startDrawSequence();
  });
}

if (resetButton) {
  resetButton.addEventListener('click', () => {
    resetAll();
  });
}

// Statistik-Popup öffnen
if (statsButton && statsOverlay) {
  statsButton.addEventListener('click', async () => {
    if (statsButton.disabled) return;

    statsButton.disabled = true;
    const oldText = statsButton.textContent;
    statsButton.textContent = 'Rechne Statistik…';

    try {
      const { mainRows, starRows } = await computeStatsForPopup();
      renderStatsPopup(mainRows, starRows);
      statsOverlay.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      alert('Konnte Statistik nicht laden/berechnen. Siehe Konsole.');
    } finally {
      statsButton.disabled = false;
      statsButton.textContent = oldText;
    }
  });
}

// Popup schließen
if (statsClose && statsOverlay) {
  statsClose.addEventListener('click', () => {
    statsOverlay.classList.add('hidden');
  });

  statsOverlay.addEventListener('click', (e) => {
    if (e.target === statsOverlay) {
      statsOverlay.classList.add('hidden');
    }
  });
}

// Startzustand

// 1) Preset-Auswahl auf "Eigene Einstellungen" setzen
if (presetSelect) {
  presetSelect.value = 'custom';
}

// 2) Custom-Preset anwenden (5 aus 50, 2 aus 12, Pastell)
applyPresetCustom();

// 2b) Gebläse-Optionen je nach Gerät (Schütteln/Pusten) anpassen
initBlowerModeOptions();

// 3) Hintergrund für Custom-Preset setzen (Gradient im canvas-bg)
setCanvasBackgroundForPreset('custom');

// 4) Kugeln initialisieren mit den gerade gesetzten Werten
initBalls(BALL_COUNT, true);
updateUI();

// 5) Animation starten
requestAnimationFrame(animate);

