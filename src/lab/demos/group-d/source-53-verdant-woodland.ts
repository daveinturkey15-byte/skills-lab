/**
 * Source 53 — verdant-forest: seeded woodland with instanced LOD vegetation.
 *
 * Restated from the catalogue method (Leonxlnx/verdant-forest @ 4252ffd5, NO
 * LICENCE FILE — learn-only, no expression reused): per-species tree geometry
 * generated in three LODs; three distance-ringed placement populations culled
 * by a trail corridor, inter-tree spacing and rock exclusion; per-kind
 * distance budgets pick the LOD level with hash-culled density; grass as
 * compact instance pools with distance-scaled counts; wind displacement the
 * CPU cannot see coming from a vertex shader, so instances opt out of
 * frustum culling and the near ring rocks in whole-tree sway instead.
 *
 * Everything here is locally authored: trunk/canopy operands, the trail
 * curve, the spacing grid and the wind rule are ours. What travels across is
 * the population structure (rings, corridor, exclusion, per-kind budgets),
 * not a line of the source.
 */

import type * as THREE from 'three';
import type {
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import { createRng, disposeTree, fbm2, hash2 } from './shared';

export const SOURCE_URLS = [
  'https://github.com/Leonxlnx/verdant-forest',
  'https://x.com/DilumSanjaya/status/2098816417324003476',
] as const;

/** World radius of the planted disc; the trail runs its full diameter. */
const WORLD_RADIUS = 12;
/** Ring edges: inside RING_NEAR is LOD0, inside RING_MID is LOD1, else LOD2. */
const RING_NEAR = 6.5;
const RING_MID = 10;
/** Nothing woody roots inside the viewer clearing or on the trail tread. */
const CLEARING_RADIUS = 2.2;
const TRAIL_HALF_WIDTH = 0.85;
const TRAIL_EXCLUSION = TRAIL_HALF_WIDTH + 0.45;
/** Minimum trunk-to-trunk distance enforced by the spacing grid. */
const SPACING = 1.35;

interface PlacedTree {
  x: number;
  z: number;
  scale: number;
  rotation: number;
  tint: number;
  phase: number;
}

/**
 * Merge indexed parts (each already carrying position/normal, plus a flat
 * colour) into one vertex-coloured geometry. Local so no addon import is
 * needed and the wind rule stays legible next to the merge.
 */
function mergeParts(
  three: DemoContext['THREE'],
  parts: Array<{ geometry: THREE.BufferGeometry; colour: [number, number, number] }>,
): THREE.BufferGeometry {
  let total = 0;
  const flat: THREE.BufferGeometry[] = [];
  for (const part of parts) {
    const source = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
    total += source.getAttribute('position').count;
    flat.push(source);
  }
  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const colour = new Float32Array(total * 3);
  let cursor = 0;
  for (let p = 0; p < parts.length; p += 1) {
    const positions = flat[p].getAttribute('position');
    const normals = flat[p].getAttribute('normal');
    const [r, g, b] = parts[p].colour;
    for (let i = 0; i < positions.count; i += 1) {
      position[(cursor + i) * 3] = positions.getX(i);
      position[(cursor + i) * 3 + 1] = positions.getY(i);
      position[(cursor + i) * 3 + 2] = positions.getZ(i);
      normal[(cursor + i) * 3] = normals.getX(i);
      normal[(cursor + i) * 3 + 1] = normals.getY(i);
      normal[(cursor + i) * 3 + 2] = normals.getZ(i);
      colour[(cursor + i) * 3] = r;
      colour[(cursor + i) * 3 + 1] = g;
      colour[(cursor + i) * 3 + 2] = b;
    }
    cursor += positions.count;
    if (flat[p] !== parts[p].geometry) flat[p].dispose();
  }
  const merged = new three.BufferGeometry();
  merged.setAttribute('position', new three.BufferAttribute(position, 3));
  merged.setAttribute('normal', new three.BufferAttribute(normal, 3));
  merged.setAttribute('color', new three.BufferAttribute(colour, 3));
  return merged;
}

/** Jitter a canopy blob's vertices so the silhouette folds instead of reading as a ball. */
function foldCanopy(
  three: DemoContext['THREE'],
  geometry: THREE.BufferGeometry,
  seed: number,
  amount: number,
): void {
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const n = hash2(Math.round(x * 37 + seed), Math.round((y + z) * 41 - seed), seed) - 0.5;
    positions.setXYZ(i, x * (1 + n * amount), y * (1 + n * amount * 0.6), z * (1 + n * amount));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

function trunkPart(
  three: DemoContext['THREE'],
  height: number,
  radius: number,
): { geometry: THREE.BufferGeometry; colour: [number, number, number] } {
  const geometry = new three.CylinderGeometry(radius * 0.65, radius, height, 5, 1);
  geometry.translate(0, height / 2, 0);
  return { geometry, colour: [0.32, 0.24, 0.17] };
}

function blobPart(
  three: DemoContext['THREE'],
  radius: number,
  squash: number,
  y: number,
  seed: number,
  colour: [number, number, number],
): { geometry: THREE.BufferGeometry; colour: [number, number, number] } {
  const geometry = new three.IcosahedronGeometry(radius, 1);
  geometry.scale(1, squash, 1);
  foldCanopy(three, geometry, seed, 0.42);
  geometry.translate(0, y, 0);
  return { geometry, colour };
}

function conePart(
  three: DemoContext['THREE'],
  radius: number,
  height: number,
  y: number,
  colour: [number, number, number],
): { geometry: THREE.BufferGeometry; colour: [number, number, number] } {
  const geometry = new three.ConeGeometry(radius, height, 7, 1);
  geometry.translate(0, y, 0);
  return { geometry, colour };
}

/** One species, three LODs, densest first. Built once; instanced per ring. */
function buildSpecies(
  three: DemoContext['THREE'],
  kind: 0 | 1 | 2,
): THREE.BufferGeometry[] {
  if (kind === 0) {
    // Broadleaf: trunk plus three folded canopy blobs.
    const full = mergeParts(three, [
      trunkPart(three, 2.4, 0.17),
      blobPart(three, 1.35, 0.78, 2.7, 11, [0.23, 0.42, 0.18]),
      blobPart(three, 1.0, 0.8, 3.5, 23, [0.28, 0.48, 0.2]),
      blobPart(three, 0.68, 0.82, 4.15, 37, [0.33, 0.53, 0.23]),
    ]);
    const mid = mergeParts(three, [
      trunkPart(three, 2.4, 0.17),
      blobPart(three, 1.45, 0.8, 2.9, 51, [0.25, 0.44, 0.19]),
    ]);
    const far = mergeParts(three, [
      trunkPart(three, 2.0, 0.15),
      conePart(three, 1.05, 3.2, 3.2, [0.24, 0.42, 0.18]),
    ]);
    return [full, mid, far];
  }
  if (kind === 1) {
    // Pine: trunk plus three stacked cone layers, the folded-geometry read.
    const full = mergeParts(three, [
      trunkPart(three, 1.7, 0.13),
      conePart(three, 1.35, 1.5, 2.1, [0.16, 0.35, 0.2]),
      conePart(three, 1.0, 1.4, 3.05, [0.19, 0.4, 0.22]),
      conePart(three, 0.62, 1.3, 3.95, [0.23, 0.45, 0.24]),
    ]);
    const mid = mergeParts(three, [
      trunkPart(three, 1.7, 0.13),
      conePart(three, 1.3, 2.6, 2.7, [0.18, 0.38, 0.21]),
    ]);
    const far = mergeParts(three, [
      trunkPart(three, 1.5, 0.12),
      conePart(three, 1.1, 3.4, 2.9, [0.17, 0.36, 0.2]),
    ]);
    return [full, mid, far];
  }
  // Understory: thin stem plus one small folded crown.
  const full = mergeParts(three, [
    trunkPart(three, 1.2, 0.07),
    blobPart(three, 0.72, 0.85, 1.55, 67, [0.32, 0.5, 0.22]),
  ]);
  const mid = mergeParts(three, [
    trunkPart(three, 1.2, 0.07),
    blobPart(three, 0.62, 0.85, 1.5, 71, [0.3, 0.48, 0.21]),
  ]);
  const far = mergeParts(three, [
    trunkPart(three, 1.0, 0.07),
    conePart(three, 0.6, 1.7, 1.6, [0.29, 0.46, 0.2]),
  ]);
  return [full, mid, far];
}

/** Trail centreline: a gentle S-curve down the Z axis, ours throughout. */
function trailX(z: number): number {
  return 2.6 * Math.sin(z * 0.32) + 0.8 * Math.sin(z * 0.91 + 1.7);
}

function distanceToTrail(x: number, z: number): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let tz = -WORLD_RADIUS; tz <= WORLD_RADIUS; tz += 0.5) {
    const dx = x - trailX(tz);
    const dz = z - tz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < nearest) nearest = d;
  }
  return nearest;
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE, seed } = context;
  const rng = createRng(seed ^ 0x53f0);
  const root = new THREE.Group();
  root.name = 'source-53:instanced-lod-woodland';

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  const grassMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  // Ground: a subdivided plane (a circle has no interior vertices, so its
  // mottle would be one flat tone) so the woodland stands on varied soil.
  const groundGeometry = new THREE.PlaneGeometry((WORLD_RADIUS + 1.5) * 2, (WORLD_RADIUS + 1.5) * 2, 44, 44);
  groundGeometry.rotateX(-Math.PI / 2);
  {
    const positions = groundGeometry.getAttribute('position');
    const colours = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const mottle = fbm2(x * 0.35 + 9, z * 0.35 - 4, 3, seed);
      const trail = Math.max(0, 1 - distanceToTrail(x, z) / 2.2);
      const r = 0.16 + mottle * 0.1 + trail * 0.28;
      const g = 0.24 + mottle * 0.1 + trail * 0.2;
      const b = 0.12 + mottle * 0.05 + trail * 0.08;
      colours[i * 3] = r;
      colours[i * 3 + 1] = g;
      colours[i * 3 + 2] = b;
    }
    groundGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  }
  const ground = new THREE.Mesh(groundGeometry, material);
  ground.name = 'woodland-floor';
  root.add(ground);

  // Rocks first: trees are excluded around them (trunk-flare/stone rule).
  const rocks: Array<{ x: number; z: number; radius: number }> = [];
  {
    let attempts = 0;
    while (rocks.length < 34 && attempts < 400) {
      attempts += 1;
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * (WORLD_RADIUS - 0.5);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (Math.hypot(x, z) < CLEARING_RADIUS) continue;
      if (distanceToTrail(x, z) < TRAIL_HALF_WIDTH + 0.25) continue;
      rocks.push({ x, z, radius: 0.22 + rng() * 0.5 });
    }
  }
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  {
    const positions = rockGeometry.getAttribute('position');
    const colours = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i += 1) {
      const shade = 0.32 + hash2(i, 7, seed) * 0.14;
      colours[i * 3] = shade;
      colours[i * 3 + 1] = shade + 0.015;
      colours[i * 3 + 2] = shade - 0.01;
    }
    rockGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  }
  const rockMesh = new THREE.InstancedMesh(rockGeometry, material, Math.max(1, rocks.length));
  rockMesh.name = 'exclusion-rocks';
  rockMesh.frustumCulled = false;
  {
    const scratch = new THREE.Object3D();
    rocks.forEach((rock, i) => {
      scratch.position.set(rock.x, rock.radius * 0.35, rock.z);
      scratch.rotation.set(0, hash2(i, 3, seed) * Math.PI * 2, 0);
      scratch.scale.setScalar(rock.radius);
      scratch.updateMatrix();
      rockMesh.setMatrixAt(i, scratch.matrix);
    });
    rockMesh.instanceMatrix.needsUpdate = true;
  }
  root.add(rockMesh);

  // Trees: rejection-sampled against clearing, trail, rocks and each other.
  const grid = new Map<string, true>();
  const cellOf = (x: number, z: number): string =>
    `${Math.floor(x / SPACING)},${Math.floor(z / SPACING)}`;
  const farEnough = (x: number, z: number): boolean => {
    const cx = Math.floor(x / SPACING);
    const cz = Math.floor(z / SPACING);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        if (grid.has(`${cx + dx},${cz + dz}`)) return false;
      }
    }
    return true;
  };
  const near: PlacedTree[] = [];
  const mid: PlacedTree[] = [];
  const far: PlacedTree[] = [];
  {
    let attempts = 0;
    const target = 460;
    let accepted = 0;
    while (accepted < target && attempts < target * 14) {
      attempts += 1;
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * WORLD_RADIUS;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (radius < CLEARING_RADIUS) continue;
      if (distanceToTrail(x, z) < TRAIL_EXCLUSION) continue;
      let blocked = false;
      for (const rock of rocks) {
        if (Math.hypot(x - rock.x, z - rock.z) < rock.radius + 0.55) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      if (!farEnough(x, z)) continue;
      grid.set(cellOf(x, z), true);
      const tree: PlacedTree = {
        x,
        z,
        scale: 0.8 + rng() * 0.6,
        rotation: rng() * Math.PI * 2,
        tint: 0.88 + rng() * 0.24,
        phase: rng() * Math.PI * 2,
      };
      // Per-kind distance budget with hash-culled density: far rings keep
      // fewer, smaller-crowned instances of the same kinds.
      const keep = hash2(Math.round(x * 10), Math.round(z * 10), seed ^ 0xbeef);
      if (radius < RING_NEAR) {
        near.push(tree);
      } else if (radius < RING_MID) {
        if (keep < 0.85) mid.push(tree);
      } else if (keep < 0.62) {
        far.push(tree);
      }
      accepted += 1;
    }
  }

  // Species assignment cycles deterministically so every LOD of every kind
  // is exercised; the InstancedMeshes below are per kind per ring.
  const speciesGeometries = [buildSpecies(THREE, 0), buildSpecies(THREE, 1), buildSpecies(THREE, 2)];
  const scratch = new THREE.Object3D();
  const tintColour = new THREE.Color();
  const windTrees: Array<{ mesh: THREE.InstancedMesh; index: number; base: PlacedTree }> = [];
  const plantRing = (
    ring: PlacedTree[],
    lod: 0 | 1 | 2,
    windy: boolean,
  ): void => {
    for (let kind = 0; kind < 3; kind += 1) {
      const members = ring.filter((_, i) => i % 3 === kind);
      if (members.length === 0) continue;
      const mesh = new THREE.InstancedMesh(speciesGeometries[kind][lod], material, members.length);
      mesh.name = `kind-${kind}-lod-${lod}`;
      // Instance transforms span the whole disc while the base geometry sits
      // at the origin, so the mesh-level bounds test cannot see them.
      mesh.frustumCulled = false;
      members.forEach((tree, i) => {
        scratch.position.set(tree.x, 0, tree.z);
        scratch.rotation.set(0, tree.rotation, 0);
        scratch.scale.setScalar(tree.scale);
        scratch.updateMatrix();
        mesh.setMatrixAt(i, scratch.matrix);
        tintColour.setRGB(tree.tint, tree.tint, tree.tint);
        mesh.setColorAt(i, tintColour);
        if (windy) windTrees.push({ mesh, index: i, base: tree });
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      root.add(mesh);
    }
  };
  plantRing(near, 0, true);
  plantRing(mid, 1, false);
  plantRing(far, 2, false);

  // Grass: one crossed-quad pool, counts scaled down with distance.
  const bladeA = new THREE.PlaneGeometry(0.4, 0.42);
  bladeA.translate(0, 0.21, 0);
  const bladeB = bladeA.clone();
  bladeB.rotateY(Math.PI / 2);
  const grassGeometry = mergeParts(THREE, [
    { geometry: bladeA, colour: [0.3, 0.5, 0.2] },
    { geometry: bladeB, colour: [0.26, 0.46, 0.18] },
  ]);
  bladeA.dispose();
  bladeB.dispose();
  const grassSpots: Array<{ x: number; z: number; scale: number; rotation: number }> = [];
  {
    let attempts = 0;
    while (grassSpots.length < 900 && attempts < 9000) {
      attempts += 1;
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * (RING_MID + 0.5);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (distanceToTrail(x, z) < TRAIL_HALF_WIDTH + 0.15) continue;
      // Distance-scaled counts: the far field keeps a hash-culled fraction.
      if (rng() > 1.15 - radius / (RING_MID + 0.5)) continue;
      grassSpots.push({ x, z, scale: 0.7 + rng() * 0.9, rotation: rng() * Math.PI });
    }
  }
  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, Math.max(1, grassSpots.length));
  grass.name = 'grass-pools';
  grass.frustumCulled = false;
  grassSpots.forEach((spot, i) => {
    scratch.position.set(spot.x, 0, spot.z);
    scratch.rotation.set(0, spot.rotation, 0);
    scratch.scale.setScalar(spot.scale);
    scratch.updateMatrix();
    grass.setMatrixAt(i, scratch.matrix);
  });
  grass.instanceMatrix.needsUpdate = true;
  root.add(grass);

  // Count triangles once for the provenance counters.
  let triangles = 0;
  root.traverse((object) => {
    const mesh = object as THREE.Mesh | THREE.InstancedMesh;
    const geometry = (mesh as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!geometry) return;
    const perGeometry = (geometry.index ? geometry.index.count : geometry.getAttribute('position').count) / 3;
    const instances = (mesh as THREE.InstancedMesh).isInstancedMesh
      ? (mesh as THREE.InstancedMesh).count
      : 1;
    triangles += Math.round(perGeometry * instances);
  });

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 53,
    title: 'Verdant forest — instanced LOD woodland with trail corridor',
    method:
      'Seeded procedural woodland: three tree kinds generated in three LODs each, planted into '
      + 'near/mid/far rings with a winding trail corridor, spacing-grid and rock-exclusion '
      + 'culling, per-kind distance budgets with hash-culled far density, one crossed-quad '
      + 'grass pool with distance-scaled counts, and whole-tree wind sway on the near ring.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'Learn-only: the source ships NO LICENCE FILE, so every operand here (trunk/canopy '
      + 'shapes, trail curve, spacing rule) is locally authored and only the population '
      + 'structure is restated. LOD rings are static distances, not camera-relative swaps; '
      + 'wind is whole-tree rock on the near ring only (mid/far stand still); grass does not '
      + 'sway. Planted disc is 24 m across, not the source\'s landscape scale.',
    counters: {
      nearTrees: near.length,
      midTrees: mid.length,
      farTrees: far.length,
      grassTufts: grassSpots.length,
      rocks: rocks.length,
      triangles,
    },
  };

  return {
    root,
    update: (time: number) => {
      // Near-ring breeze: each crown rocks around its trunk base with its own
      // phase. Mid and far rings stand still — owned in the limitation.
      for (const entry of windTrees) {
        const sway = Math.sin(time * 1.1 + entry.base.phase) * 0.022
          + Math.sin(time * 2.3 + entry.base.phase * 1.7) * 0.008;
        scratch.position.set(entry.base.x, 0, entry.base.z);
        scratch.rotation.set(sway * 0.6, entry.base.rotation, sway);
        scratch.scale.setScalar(entry.base.scale);
        scratch.updateMatrix();
        entry.mesh.setMatrixAt(entry.index, scratch.matrix);
      }
      for (const entry of windTrees) entry.mesh.instanceMatrix.needsUpdate = true;
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
