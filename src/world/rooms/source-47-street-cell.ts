/**
 * Source 47 — GTA-style open-world city art: the street cell.
 *
 * Restages the lab demo at room scale as a walk-through: the visitor enters
 * on the greybox half and walks into the treated half of the same street.
 * Surfaces arrive in the priority order that carries the look — road first,
 * pavement second, facade bays third, furniture last — with the surfacing
 * maths restated, not copied. One cell, not a city: no road graph, traffic,
 * pedestrians, HUD or streaming, and the reference's flat overcast grade is
 * deliberately not adopted.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

const ROAD_WIDTH = 4.2;
const PAVEMENT_WIDTH = 1.9;
const HALF_LENGTH = 8;
const FACADE_X = ROAD_WIDTH / 2 + PAVEMENT_WIDTH + 0.3;

function hash2(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/** Busiest surface first: aggregate, cold patches, tar seams, worn dashes. */
function roadSurface(x: number, z: number): [number, number, number] {
  const aggregate = hash2(Math.floor(x * 26) * 3.1 + Math.floor(z * 26) * 7.7, 1.7) * 0.09;
  const coldPatch = hash2(Math.floor(x * 2.2) * 17.3 + Math.floor(z * 1.6) * 5.1, 4.2) > 0.72 ? 0.84 : 1;
  const tarSeam = Math.abs(Math.sin(z * 2.1 + Math.sin(x * 3.3) * 0.4)) < 0.05 ? 0.72 : 1;
  const crack = Math.abs(Math.sin(x * 7.9 + z * 1.3)) < 0.03 ? 0.78 : 1;
  const lane = Math.abs(x) < 0.06 && Math.sin(z * 5.2) > 0 ? 1 : 0;
  const base = (0.2 + aggregate) * coldPatch * tarSeam * crack;
  const wear = 0.55 + hash2(Math.floor(z * 9) * 2.7, 8.8) * 0.35;
  return [base + lane * wear * 0.6, base + lane * wear * 0.58, base + lane * wear * 0.5];
}

/** Paving slabs on joints with a split kerb edge handled by geometry. */
function pavementSurface(x: number, z: number): [number, number, number] {
  const jointX = Math.abs((x * 2.4) % 1) < 0.06 ? 0.8 : 1;
  const jointZ = Math.abs((z * 2.4) % 1) < 0.06 ? 0.8 : 1;
  const tone = 0.42 + hash2(Math.floor(x * 2.4), Math.floor(z * 2.4)) * 0.08;
  return [tone * jointX * jointZ, tone * jointX * jointZ, tone * jointX * jointZ * 1.02];
}

export const room: RoomDefinition = {
  sourceId: 47,
  skill: 'visual-gauntlet-loop',
  title: 'Street cell: a bar, not a pipeline',
  summary:
    'One street cell, treated at the door and grey beyond: road, pavement, '
    + 'facade bays and furniture in surface-priority order.',
  kind: 'webgpu',
  limitation:
    'One cell, not a city: no road graph, traffic, pedestrians, HUD, minimap '
    + 'or streaming, and no reference frame or signage is reproduced. The '
    + 'flat overcast grade is deliberately absent, and the reference\u2019s '
    + 'own 18\u201320 fps makes it a screenshot bar, not a gameplay target.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const low = ctx.quality === 'low';

    const paint = (
      geometry: THREE.BufferGeometry,
      fn: (x: number, z: number) => [number, number, number],
    ): void => {
      const position = geometry.getAttribute('position');
      const colours = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i += 1) {
        const c = fn(position.getX(i), position.getZ(i));
        colours[i * 3] = c[0];
        colours[i * 3 + 1] = c[1];
        colours[i * 3 + 2] = c[2];
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    };

    const roadSegZ = low ? 48 : 96;
    // Treated half at the door: a shell wall crosses local z = 0 in some
    // wings, so the comparison's interesting half stands where entry sees it.
    for (const half of [0, 1] as const) {
      const treated = half === 0;
      const zCentre = half === 0 ? -HALF_LENGTH / 2 : HALF_LENGTH / 2;

      const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, HALF_LENGTH, 16, roadSegZ);
      roadGeometry.rotateX(-Math.PI / 2);
      disposables.push(roadGeometry);
      if (treated) paint(roadGeometry, roadSurface);
      const roadMaterial = new THREE.MeshStandardMaterial(
        treated
          ? { vertexColors: true, roughness: 0.93 }
          : { color: 0x565656, roughness: 0.93 },
      );
      disposables.push(roadMaterial);
      const road = new THREE.Mesh(roadGeometry, roadMaterial);
      road.position.set(0, 0.015, zCentre);
      root.add(road);

      for (const side of [-1, 1] as const) {
        const pavementGeometry = new THREE.PlaneGeometry(PAVEMENT_WIDTH, HALF_LENGTH, 8, roadSegZ);
        pavementGeometry.rotateX(-Math.PI / 2);
        pavementGeometry.translate(side * (ROAD_WIDTH / 2 + PAVEMENT_WIDTH / 2), 0, 0);
        disposables.push(pavementGeometry);
        if (treated) paint(pavementGeometry, pavementSurface);
        const pavementMaterial = new THREE.MeshStandardMaterial(
          treated
            ? { vertexColors: true, roughness: 0.95 }
            : { color: 0x666666, roughness: 0.95 },
        );
        disposables.push(pavementMaterial);
        const pavement = new THREE.Mesh(pavementGeometry, pavementMaterial);
        pavement.position.set(0, 0.06, zCentre);
        root.add(pavement);

        const kerbGeometry = new THREE.BoxGeometry(0.09, 0.07, HALF_LENGTH);
        kerbGeometry.translate(side * (ROAD_WIDTH / 2 + 0.045), 0, 0);
        disposables.push(kerbGeometry);
        const kerbMaterial = new THREE.MeshStandardMaterial({
          color: treated ? 0x6e6a63 : 0x767676,
          roughness: 0.9,
        });
        disposables.push(kerbMaterial);
        const kerb = new THREE.Mesh(kerbGeometry, kerbMaterial);
        kerb.position.set(0, 0.035, zCentre);
        root.add(kerb);

        const facadeGeometry = new THREE.BoxGeometry(0.6, 2.6, HALF_LENGTH);
        facadeGeometry.translate(side * FACADE_X, 0, 0);
        disposables.push(facadeGeometry);
        const facadeMaterial = new THREE.MeshStandardMaterial({
          color: treated ? 0x6a5c51 : 0x8a8a8a,
          roughness: 0.92,
        });
        disposables.push(facadeMaterial);
        const facade = new THREE.Mesh(facadeGeometry, facadeMaterial);
        facade.position.set(0, 1.3, zCentre);
        root.add(facade);
      }
    }

    // Treated half only: instanced recessed bays, then furniture last.
    const baysPerSide = low ? 28 : 56;
    const bayGeometry = new THREE.BoxGeometry(0.06, 0.3, 0.26);
    disposables.push(bayGeometry);
    const bayMaterial = new THREE.MeshStandardMaterial({ color: 0x1d2227, roughness: 0.32, metalness: 0.12 });
    disposables.push(bayMaterial);
    const matrix = new THREE.Matrix4();
    for (const side of [-1, 1] as const) {
      const bays = new THREE.InstancedMesh(bayGeometry, bayMaterial, baysPerSide);
      for (let i = 0; i < baysPerSide; i += 1) {
        const storey = Math.floor(i / (baysPerSide / 4));
        const bay = i % (baysPerSide / 4);
        matrix.makeTranslation(
          side * (FACADE_X - 0.31),
          0.7 + storey * 0.5,
          -0.5 - bay * 0.53,
        );
        bays.setMatrixAt(i, matrix);
      }
      bays.instanceMatrix.needsUpdate = true;
      root.add(bays);
    }

    const furnitureCount = low ? 12 : 24;
    const postGeometry = new THREE.CylinderGeometry(0.03, 0.035, 0.8, 6);
    disposables.push(postGeometry);
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x34383a, roughness: 0.7 });
    disposables.push(postMaterial);
    const posts = new THREE.InstancedMesh(postGeometry, postMaterial, furnitureCount);
    for (let i = 0; i < furnitureCount; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      matrix.makeTranslation(
        side * (ROAD_WIDTH / 2 + 0.35),
        0.4,
        -0.6 - Math.floor(i / 2) * 0.62,
      );
      posts.setMatrixAt(i, matrix);
    }
    posts.instanceMatrix.needsUpdate = true;
    root.add(posts);

    return {
      root,
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
