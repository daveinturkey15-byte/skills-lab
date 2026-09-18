/**
 * Source 51 — sailing-game weather state machine (comparator, unreleased).
 *
 * Restages the lab storm demo's transferable object at room scale: one
 * storminess value looping calm-storm-calm, with sun, cloud deck, rain, sea
 * and emulated exposure each chasing it on their own lag, so states blend
 * instead of switching. Sea and cloud maths are restated compactly (sine-sum
 * swell, value-noise coverage); the eight meter bars are the demo's readout.
 * The author's demo is unreleased and no source exists, so every visible
 * system here is an original study from three video frames — stated on the
 * wall, not hidden in a footnote.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

const PERIOD = 48;
const RAIN_COUNT = 700;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(x: number, y: number): number {
  const lattice = (lx: number, ly: number): number => {
    const h = Math.sin(lx * 127.1 + ly * 311.7) * 43758.5453;
    return h - Math.floor(h);
  };
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const a = lattice(xi, yi);
  const b = lattice(xi + 1, yi);
  const c = lattice(xi, yi + 1);
  const d = lattice(xi + 1, yi + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function chase(current: number, target: number, tau: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}
const DEEP: readonly [number, number, number] = [0.045, 0.09, 0.12];
const CREST: readonly [number, number, number] = [0.32, 0.42, 0.45];
const FOAM: readonly [number, number, number] = [0.72, 0.78, 0.8];
const CALM_SKY_TOP: readonly [number, number, number] = [0.1, 0.16, 0.26];
const CALM_SKY_BOTTOM: readonly [number, number, number] = [0.5, 0.42, 0.34];
const STORM_SKY_TOP: readonly [number, number, number] = [0.05, 0.06, 0.08];
const STORM_SKY_BOTTOM: readonly [number, number, number] = [0.16, 0.17, 0.19];

function stateName(storminess: number): string {
  if (storminess < 0.33) return 'CALM';
  if (storminess < 0.66) return 'STORM FRONT';
  return 'INSIDE THE STORM';
}

export const room: RoomDefinition = {
  sourceId: 51,
  skill: 'threejs-webgpu-water',
  title: 'Weather state machine over open water',
  summary:
    'One storminess value drives sun, cloud, rain, sea and exposure together, '
    + 'looping calm, storm front and inside-the-storm as blended states.',
  kind: 'webgpu',
  limitation:
    'The author\u2019s demo is unreleased and no source code exists: sea, '
    + 'cloud and states are original studies from three video frames, not the '
    + 'author\u2019s work. Exposure is emulated on colours; the host renderer '
    + 'is untouched. Storminess runs on mount age, so visits match only at '
    + 'equal age.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const low = ctx.quality === 'low';
    const rng = mulberry32(ctx.seed ^ 0x51a1);

    // Sea is the floor: swell height and foam tint both follow the driver.
    const seaSegX = low ? 22 : 40;
    const seaSegZ = low ? 24 : 44;
    const seaGeometry = new THREE.PlaneGeometry(14, 16, seaSegX, seaSegZ);
    seaGeometry.rotateX(-Math.PI / 2);
    disposables.push(seaGeometry);
    const seaPosition = seaGeometry.getAttribute('position');
    const seaCount = seaPosition.count;
    const restX = new Float32Array(seaCount);
    const restZ = new Float32Array(seaCount);
    for (let i = 0; i < seaCount; i += 1) {
      restX[i] = seaPosition.getX(i);
      restZ[i] = seaPosition.getZ(i);
    }
    const seaColours = new Float32Array(seaCount * 3);
    const seaColourAttr = new THREE.BufferAttribute(seaColours, 3);
    seaColourAttr.setUsage(THREE.DynamicDrawUsage);
    seaGeometry.setAttribute('color', seaColourAttr);
    (seaPosition as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    const seaMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15 });
    disposables.push(seaMaterial);
    const sea = new THREE.Mesh(seaGeometry, seaMaterial);
    sea.position.set(0, 0.02, 0);
    sea.frustumCulled = false;
    root.add(sea);
    // Three swell trains with seeded phases; amplitude is driven, shape is not.
    const trains = [
      { dx: 0.8, dz: 0.6, freq: 0.9, speed: 1.1, phase: rng() * 6.28 },
      { dx: -0.5, dz: 0.87, freq: 1.7, speed: 1.6, phase: rng() * 6.28 },
      { dx: 0.2, dz: -0.98, freq: 3.1, speed: 2.3, phase: rng() * 6.28 },
    ];

    // Sky backdrop on the back wall, repainted only when haze visibly moves.
    const skyGeometry = new THREE.PlaneGeometry(13.6, 5.6, 1, 6);
    disposables.push(skyGeometry);
    const skyPosition = skyGeometry.getAttribute('position');
    const skyColours = new Float32Array(skyPosition.count * 3);
    const skyColourAttr = new THREE.BufferAttribute(skyColours, 3);
    skyColourAttr.setUsage(THREE.DynamicDrawUsage);
    skyGeometry.setAttribute('color', skyColourAttr);
    const skyMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    disposables.push(skyMaterial);
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.set(0, 3.0, 7.6);
    sky.rotation.y = Math.PI;
    root.add(sky);
    let paintedHaze = -1;

    // Cloud deck overhead: value-noise coverage gated by the driven cover.
    const deckW = 64;
    const deckH = 32;
    const deckBytes = new Uint8Array(deckW * deckH * 4);
    const deckTexture = new THREE.DataTexture(deckBytes, deckW, deckH, THREE.RGBAFormat);
    deckTexture.colorSpace = THREE.SRGBColorSpace;
    deckTexture.magFilter = THREE.LinearFilter;
    deckTexture.minFilter = THREE.LinearFilter;
    disposables.push(deckTexture);
    const deckMaterial = new THREE.MeshBasicMaterial({
      map: deckTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity: 0.3,
    });
    disposables.push(deckMaterial);
    const deckGeometry = new THREE.PlaneGeometry(13, 10);
    disposables.push(deckGeometry);
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.rotation.x = Math.PI / 2;
    deck.position.set(0, 5.2, 0);
    root.add(deck);

    // The room's own sun; the world rig stays untouched beside it.
    const sun = new THREE.DirectionalLight(new THREE.Color(1, 0.82, 0.64), 2.4);
    sun.position.set(-5, 4, 2);
    root.add(sun);
    const sunCalm = new THREE.Color(1.0, 0.82, 0.64);
    const sunStorm = new THREE.Color(0.5, 0.6, 0.72);

    // Rain: preallocated drops, visible count gated by the driven rate.
    const rainCount = low ? 300 : RAIN_COUNT;
    const rainPositions = new Float32Array(rainCount * 3);
    const rainSpeed = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i += 1) {
      rainPositions[i * 3] = (rng() - 0.5) * 13;
      rainPositions[i * 3 + 1] = rng() * 6;
      rainPositions[i * 3 + 2] = (rng() - 0.5) * 15;
      rainSpeed[i] = 6 + rng() * 4;
    }
    const rainGeometry = new THREE.BufferGeometry();
    disposables.push(rainGeometry);
    const rainAttr = new THREE.BufferAttribute(rainPositions, 3);
    rainAttr.setUsage(THREE.DynamicDrawUsage);
    rainGeometry.setAttribute('position', rainAttr);
    const rainMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(0.62, 0.7, 0.78),
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    disposables.push(rainMaterial);
    const rain = new THREE.Points(rainGeometry, rainMaterial);
    rain.frustumCulled = false;
    root.add(rain);

    // Eight meter bars on the left wall: storminess, then the driven channels.
    const meterGeometry = new THREE.BoxGeometry(0.18, 1, 0.18);
    meterGeometry.translate(0, 0.5, 0);
    disposables.push(meterGeometry);
    const meterMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.75, 0.85) });
    disposables.push(meterMaterial);
    const railGeometry = new THREE.PlaneGeometry(7.6, 1.7);
    disposables.push(railGeometry);
    const railMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.035, 0.045) });
    disposables.push(railMaterial);
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.rotation.y = Math.PI / 2;
    rail.position.set(-6.6, 0.9, -2);
    root.add(rail);
    const meters: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i += 1) {
      const bar = new THREE.Mesh(meterGeometry, meterMaterial);
      bar.position.set(-6.5, 0.15, -5.05 + i * 0.88);
      bar.scale.y = 0.03;
      root.add(bar);
      meters.push(bar);
    }

    // State board above the meters: which coordinated state is showing.
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 512;
    boardCanvas.height = 96;
    const boardPaint = boardCanvas.getContext('2d')!;
    const boardTexture = new THREE.CanvasTexture(boardCanvas);
    boardTexture.colorSpace = THREE.SRGBColorSpace;
    disposables.push(boardTexture);
    const boardGeometry = new THREE.PlaneGeometry(2.6, 0.5);
    disposables.push(boardGeometry);
    const boardMaterial = new THREE.MeshBasicMaterial({ map: boardTexture, toneMapped: false });
    disposables.push(boardMaterial);
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.rotation.y = Math.PI / 2;
    board.position.set(-6.55, 2.6, -2);
    root.add(board);
    let paintedState = '';

    const paintBoard = (name: string): void => {
      boardPaint.fillStyle = '#10141a';
      boardPaint.fillRect(0, 0, 512, 96);
      boardPaint.fillStyle = '#ffe28a';
      boardPaint.font = '44px system-ui, sans-serif';
      boardPaint.textAlign = 'center';
      boardPaint.textBaseline = 'middle';
      boardPaint.fillText(name, 256, 50);
      boardTexture.needsUpdate = true;
      paintedState = name;
    };
    paintBoard('CALM');

    const channels = { sun: 2.4, cover: 0.15, rain: 0, amp: 0.06, haze: 0, exposure: 1.15 };
    let age = (ctx.seed % PERIOD) + PERIOD * 0.05;
    let normalTick = 0;

    return {
      root,
      update: (_elapsed: number, dt: number) => {
        const step = Math.min(dt, 0.1);
        age += step;
        const storminess = 0.5 - 0.5 * Math.cos((2 * Math.PI * age) / PERIOD);
        channels.sun = chase(channels.sun, 2.4 + (0.45 - 2.4) * storminess, 6, step);
        channels.cover = chase(channels.cover, 0.15 + 0.75 * storminess, 18, step);
        channels.rain = chase(channels.rain, storminess * storminess, 2.5, step);
        channels.amp = chase(channels.amp, 0.06 + 0.44 * storminess, 10, step);
        channels.haze = chase(channels.haze, storminess, 14, step);
        channels.exposure = chase(channels.exposure, 1.15 - 0.3 * storminess, 5, step);

        sun.intensity = channels.sun;
        sun.color.copy(sunCalm).lerp(sunStorm, channels.haze);
        seaMaterial.roughness = 0.12 + 0.48 * storminess;

        const amp = channels.amp;
        for (let i = 0; i < seaCount; i += 1) {
          const x = restX[i];
          const z = restZ[i];
          let height = 0;
          for (const train of trains) {
            height += Math.sin((x * train.dx + z * train.dz) * train.freq + age * train.speed + train.phase);
          }
          height *= amp / 3;
          seaPosition.setY(i, height);
          const hNorm = Math.max(0, Math.min(1, 0.5 + height / (2 * amp + 1e-4)));
          const foam = hNorm > 0.72 ? (hNorm - 0.72) / 0.28 : 0;
          seaColours[i * 3] = DEEP[0] + (CREST[0] - DEEP[0]) * hNorm + (FOAM[0] - CREST[0]) * foam;
          seaColours[i * 3 + 1] = DEEP[1] + (CREST[1] - DEEP[1]) * hNorm + (FOAM[1] - CREST[1]) * foam;
          seaColours[i * 3 + 2] = DEEP[2] + (CREST[2] - DEEP[2]) * hNorm + (FOAM[2] - CREST[2]) * foam;
        }
        seaPosition.needsUpdate = true;
        seaColourAttr.needsUpdate = true;
        normalTick += 1;
        if (normalTick % 2 === 0) seaGeometry.computeVertexNormals();

        for (let j = 0; j < deckH; j += 1) {
          const v = (j + 0.5) / deckH;
          for (let i = 0; i < deckW; i += 1) {
            const u = (i + 0.5) / deckW;
            const cover = valueNoise(u * 6 + age * 0.02, v * 4) * 0.6 + valueNoise(u * 13, v * 9 + 3) * 0.4;
            const k = (j * deckW + i) * 4;
            const shade = Math.round((0.16 + 0.1 * (1 - cover)) * 255);
            deckBytes[k] = shade;
            deckBytes[k + 1] = Math.round(shade * 1.12);
            deckBytes[k + 2] = Math.min(255, Math.round(shade * 1.3));
            deckBytes[k + 3] = Math.round(Math.max(0, Math.min(1, cover * 1.4 * channels.cover)) * 240);
          }
        }
        deckTexture.needsUpdate = true;
        deckMaterial.opacity = 0.2 + 0.7 * channels.cover;

        if (Math.abs(channels.haze - paintedHaze) > 0.005 || paintedHaze < 0) {
          for (let i = 0; i < skyPosition.count; i += 1) {
            const t = (skyPosition.getY(i) + 2.8) / 5.6;
            for (let c = 0; c < 3; c += 1) {
              const calm = CALM_SKY_BOTTOM[c] + (CALM_SKY_TOP[c] - CALM_SKY_BOTTOM[c]) * t;
              const storm = STORM_SKY_BOTTOM[c] + (STORM_SKY_TOP[c] - STORM_SKY_BOTTOM[c]) * t;
              skyColours[i * 3 + c] = (calm + (storm - calm) * channels.haze) * channels.exposure;
            }
          }
          skyColourAttr.needsUpdate = true;
          paintedHaze = channels.haze;
        }

        const active = Math.floor(rainCount * channels.rain);
        const fall = step * (0.5 + channels.rain);
        for (let i = 0; i < rainCount; i += 1) {
          let y = rainPositions[i * 3 + 1] - rainSpeed[i] * fall;
          if (y < 0) y += 6;
          rainPositions[i * 3 + 1] = y;
        }
        rainAttr.needsUpdate = true;
        rainGeometry.setDrawRange(0, active);

        const levels = [
          storminess,
          channels.sun / 2.4,
          channels.cover,
          channels.rain,
          channels.amp / 0.5,
          channels.haze,
          (channels.exposure - 0.85) / 0.3,
          storminess,
        ];
        for (let i = 0; i < meters.length; i += 1) {
          meters[i].scale.y = Math.max(Math.min(levels[i], 1), 0.03);
        }
        const name = stateName(storminess);
        if (name !== paintedState) paintBoard(name);
      },
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
