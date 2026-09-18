/**
 * Source 52 — Tripo characters + Mixamo rigs + agent-built island village (comparator).
 *
 * Catalogue row 52 is a COMPARATOR, not a technique: an owner-shared post claims
 * generated characters, auto-rigging and an agent-authored schedule layer (named
 * NPCs with jobs, activities and a quest economy) over a stylised island. The
 * poster's video frames were inspected; no source, repository or licence exists,
 * so nothing about which tool did what is verified. There is deliberately no
 * Tripo output, no Mixamo rig and no model call in this file.
 *
 * What this exhibit stages is the transferable half: the SCHEDULE LAYER. Five
 * named villagers with jobs run a deterministic 48-second timetable between the
 * well, the farm, the dock and their huts, and a quest marker hops between huts.
 * The characters are capsule stand-ins with canvas name tags — the register's
 * FK-only pipeline (row 1) is our route to animation, not the poster's auto-rig
 * claim, and the comparison the catalogue records lives on in the limitation.
 */

import type { DemoContext, DemoInstance, DemoMetadata } from '../../types';
import type * as THREE_NS from 'three';
import { createRng, disposeTree, fbm2 } from './shared';

export const SOURCE_URLS = [
  'https://x.com/DilumSanjaya/status/2098816417324003476',
] as const;

/** Full timetable loop; every NPC phase-offsets into the same deterministic clock. */
const CYCLE_S = 48;
/** Sea level; sand top sits just above it. */
const SEA_Y = -0.32;
const GROUND_Y = 0.11;

interface NpcSpec {
  name: string;
  colour: number;
  /** Station indices in visit order. */
  route: readonly number[];
  offset: number;
}

/** Stations: well, farm, dock, then one hut door each. All on the grass top. */
const STATIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.9], // 0 well
  [-1.5, -0.9], // 1 farm
  [2.6, -0.4], // 2 dock root
  [-1.1, 1.5], // 3 hut doors…
  [1.3, 1.4],
  [-0.2, -1.9],
  [1.9, 0.9],
];

const NPCS: ReadonlyArray<NpcSpec> = [
  { name: 'FISHER', colour: 0x3f7fbf, route: [2, 0, 6, 2], offset: 0 },
  { name: 'SMITH', colour: 0xc4763a, route: [3, 0, 3, 5], offset: 11 },
  { name: 'FARMER', colour: 0x7a9f4a, route: [1, 0, 1, 5], offset: 23 },
  { name: 'CARRIER', colour: 0xb04a5a, route: [4, 2, 4, 0], offset: 31 },
  { name: 'KEEPER', colour: 0x8a6fbf, route: [0, 6, 0, 4], offset: 40 },
];

function makeNameTag(
  THREE: DemoContext['THREE'],
  text: string,
  seed: number,
): THREE_NS.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const rng = createRng(seed);
    void rng;
    ctx.fillStyle = 'rgba(10, 14, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(28, 8, 200, 48, 10);
    ctx.fill();
    ctx.fillStyle = '#f2f5f7';
    ctx.font = '600 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 33);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.05, 0.26, 1);
  sprite.name = `tag-${text}`;
  return sprite;
}

function buildHut(
  THREE: DemoContext['THREE'],
  wallColour: number,
  x: number,
  z: number,
  facing: number,
): THREE_NS.Group {
  const hut = new THREE.Group();
  hut.position.set(x, GROUND_Y, z);
  hut.rotation.y = facing;
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.55, 0.72),
    new THREE.MeshStandardMaterial({ color: wallColour, roughness: 0.9 }),
  );
  walls.position.y = 0.275;
  walls.name = 'hut-walls';
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.72, 0.52, 4),
    new THREE.MeshStandardMaterial({ color: 0x8a6b42, roughness: 0.95 }),
  );
  roof.position.y = 0.81;
  roof.rotation.y = Math.PI / 4;
  roof.name = 'hut-roof';
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.34, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 1 }),
  );
  door.position.set(0, 0.17, 0.365);
  door.name = 'hut-door';
  hut.add(walls, roof, door);
  return hut;
}

/** Position of an NPC at demo time: dwell at each station, then walk the leg. */
function schedulePosition(
  route: readonly number[],
  offset: number,
  time: number,
  out: { x: number; z: number; moving: boolean; heading: number },
): void {
  const leg = CYCLE_S / route.length;
  const local = (((time + offset) % CYCLE_S) + CYCLE_S) % CYCLE_S;
  const index = Math.floor(local / leg);
  const f = (local - index * leg) / leg;
  const a = STATIONS[route[index % route.length]];
  const b = STATIONS[route[(index + 1) % route.length]];
  // Dwell the first 45%, walk with eased ends, settle the tail.
  const w = f < 0.45 ? 0 : f > 0.92 ? 1 : (f - 0.45) / 0.47;
  const eased = w * w * (3 - 2 * w);
  out.x = a[0] + (b[0] - a[0]) * eased;
  out.z = a[1] + (b[1] - a[1]) * eased;
  out.moving = f >= 0.45 && f <= 0.92;
  out.heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE, seed } = context;
  const rng = createRng(seed ^ 0x52f00d);
  const root = new THREE.Group();
  root.name = 'source-52-island-schedules';

  // Sea with a shallow shelf tint and a foam hem around the sand.
  const seaGeometry = new THREE.CircleGeometry(4.3, 64);
  seaGeometry.rotateX(-Math.PI / 2);
  {
    const position = seaGeometry.getAttribute('position');
    const colours = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const r = Math.hypot(x, z);
      const shelf = Math.max(0, Math.min(1, (4.1 - r) / 1.2));
      const chop = fbm2(x * 0.8, z * 0.8, 3, seed) * 0.1;
      position.setY(i, chop);
      colours[i * 3] = 0.08 + shelf * 0.22 + chop * 0.4;
      colours[i * 3 + 1] = 0.3 + shelf * 0.3 + chop * 0.4;
      colours[i * 3 + 2] = 0.48 + shelf * 0.24 + chop * 0.35;
    }
    seaGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  }
  seaGeometry.computeVertexNormals();
  const sea = new THREE.Mesh(
    seaGeometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }),
  );
  sea.position.y = SEA_Y;
  sea.name = 'sea';
  root.add(sea);

  const foam = new THREE.Mesh(
    new THREE.RingGeometry(3.42, 3.78, 64),
    new THREE.MeshBasicMaterial({ color: 0xdff2f4, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = SEA_Y + 0.06;
  foam.name = 'foam-hem';
  root.add(foam);

  const sand = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.75, 0.34, 48),
    new THREE.MeshStandardMaterial({ color: 0xc9b180, roughness: 1 }),
  );
  sand.position.y = -0.17;
  sand.name = 'sand';
  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(2.75, 2.95, 0.24, 48),
    new THREE.MeshStandardMaterial({ color: 0x5d8a48, roughness: 1 }),
  );
  grass.position.y = -0.01;
  grass.name = 'grass';
  root.add(sand, grass);

  // Well, farm plot, dock and boat: the stations the timetable walks between.
  const well = new THREE.Group();
  well.position.set(STATIONS[0][0], GROUND_Y, STATIONS[0][1]);
  const wellRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 0.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x8d9299, roughness: 0.95 }),
  );
  wellRing.position.y = 0.2;
  wellRing.name = 'well-ring';
  const wellRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.3, 4),
    new THREE.MeshStandardMaterial({ color: 0x8a6b42, roughness: 0.95 }),
  );
  wellRoof.position.y = 0.85;
  wellRoof.rotation.y = Math.PI / 4;
  wellRoof.name = 'well-roof';
  well.add(wellRing, wellRoof);
  root.add(well);

  const farm = new THREE.Group();
  farm.position.set(STATIONS[1][0], GROUND_Y + 0.01, STATIONS[1][1]);
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x5a4128, roughness: 1 }),
  );
  soil.name = 'farm-soil';
  farm.add(soil);
  for (let row = 0; row < 3; row += 1) {
    const crop = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.14, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x4e7f36, roughness: 1 }),
    );
    crop.position.set(0, 0.1, -0.26 + row * 0.26);
    crop.name = `crop-row-${row}`;
    farm.add(crop);
  }
  root.add(farm);

  const dock = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.08, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x7a5c38, roughness: 1 }),
  );
  dock.position.set(3.3, 0.02, -0.4);
  dock.name = 'dock';
  root.add(dock);
  const boat = new THREE.Group();
  boat.position.set(3.55, SEA_Y + 0.12, -1.5);
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.24, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x74422a, roughness: 0.9 }),
  );
  hull.name = 'boat-hull';
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }),
  );
  mast.position.y = 0.6;
  mast.name = 'boat-mast';
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.9, side: THREE.DoubleSide }),
  );
  sail.position.set(0.3, 0.62, 0);
  sail.rotation.y = Math.PI / 2;
  sail.name = 'boat-sail';
  boat.add(hull, mast, sail);
  root.add(boat);

  const hutWalls = [0xb59a6e, 0x9aa27a, 0xa88a7a, 0x8fa3ad];
  const hutSpots: ReadonlyArray<readonly [number, number, number]> = [
    [-1.1, 1.9, 2.6],
    [1.3, 1.8, -2.7],
    [-0.2, -2.3, 0.2],
    [1.9, 1.3, -1.2],
  ];
  hutSpots.forEach(([x, z, facing], i) => {
    root.add(buildHut(THREE, hutWalls[i % hutWalls.length], x, z, facing + rng() * 0.2));
  });

  // Pines for silhouette against the sea.
  const pineSpots: ReadonlyArray<readonly [number, number]> = [[-2.2, 0.2], [0.6, -1.2], [2.2, 2.0]];
  for (const [x, z] of pineSpots) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.5, 7),
      new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }),
    );
    trunk.position.set(x, GROUND_Y + 0.25, z);
    trunk.name = 'pine-trunk';
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d6b34, roughness: 1 }),
    );
    crown.position.set(x, GROUND_Y + 0.9, z);
    crown.name = 'pine-crown';
    root.add(trunk, crown);
  }

  // The villagers: capsule stand-ins, explicitly NOT Mixamo rigs.
  interface Walker {
    group: THREE_NS.Group;
    body: THREE_NS.Mesh;
    spec: NpcSpec;
  }
  const walkers: Walker[] = [];
  const scratch = { x: 0, z: 0, moving: false, heading: 0 };
  NPCS.forEach((spec, i) => {
    const group = new THREE.Group();
    group.name = `npc-${spec.name.toLowerCase()}`;
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.5, 4, 10),
      new THREE.MeshStandardMaterial({ color: spec.colour, roughness: 0.7 }),
    );
    body.position.y = 0.55;
    body.name = 'npc-body';
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xd9b48f, roughness: 0.8 }),
    );
    head.position.y = 1.08;
    head.name = 'npc-head';
    const tag = makeNameTag(THREE, spec.name, seed + i * 101);
    tag.position.y = 1.5;
    group.add(body, head, tag);
    schedulePosition(spec.route, spec.offset, 0, scratch);
    group.position.set(scratch.x, GROUND_Y, scratch.z);
    root.add(group);
    walkers.push({ group, body, spec });
  });

  // Quest marker: hops a hut every quarter cycle, bobs above its roof.
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16),
    new THREE.MeshBasicMaterial({ color: 0xffc93c }),
  );
  marker.name = 'quest-marker';
  root.add(marker);

  const metadata: DemoMetadata = {
    sourceId: 52,
    title: 'Island village NPC schedules (comparator)',
    method:
      'Agent-schedule layer restated as a deterministic timetable: five named villagers with '
      + 'jobs walk eased dwell-and-carry legs between the well, farm, dock and hut doors on a '
      + '48-second loop, and a quest marker hops huts each quarter cycle. Pure functions of '
      + 'demo time, so equal ages agree.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'Comparator only: no Tripo output, no Mixamo rig and no model call exist here — bodies '
      + 'are capsules with canvas name tags, and the names, jobs and timetable are our '
      + 'invention. The poster claim (which tool built what) is unverified, and the '
      + 'candidate ai-3d-asset-generation-loop mapping is NOT verified against a skill body.',
  };

  return {
    root,
    update: (time: number) => {
      for (const walker of walkers) {
        schedulePosition(walker.spec.route, walker.spec.offset, time, scratch);
        walker.group.position.set(scratch.x, GROUND_Y + (scratch.moving ? Math.abs(Math.sin(time * 7)) * 0.05 : 0), scratch.z);
        if (scratch.moving) walker.group.rotation.y = scratch.heading;
      }
      const hutIndex = Math.floor(time / (CYCLE_S / 4)) % hutSpots.length;
      const hut = hutSpots[hutIndex];
      marker.position.set(hut[0], GROUND_Y + 1.7 + Math.sin(time * 3) * 0.14, hut[1]);
      marker.rotation.y = time * 1.5;
      boat.position.y = SEA_Y + 0.12 + Math.sin(time * 0.9) * 0.05;
      boat.rotation.z = Math.sin(time * 0.7) * 0.04;
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
