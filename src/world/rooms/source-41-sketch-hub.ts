/**
 * Source 41 — the technique-demo hub: a portfolio as a catalogue of
 * self-contained sketches.
 *
 * Restages the lab demo's before/after at room scale: on the left the same
 * four techniques piled unnamed onto one block (the discoverability failure),
 * on the right the same four as numbered pedestals, each resolvable on its
 * own. Subjects are trivial stand-ins restated from the demo; none of the
 * source's sixteen sketches is reproduced, and there is no raymarching,
 * physics or fluid here.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

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

const EXHIBITS = [
  { index: 1, plate: '1 \u00b7 Rounded Grid', colour: 0x8892a6, kind: 'grid' },
  { index: 2, plate: '2 \u00b7 Pillars', colour: 0xa8896b, kind: 'pillars' },
  { index: 3, plate: '3 \u00b7 Voxel Cube', colour: 0x6f9a86, kind: 'voxel' },
  { index: 4, plate: '4 \u00b7 Fracture Sphere', colour: 0xb5726a, kind: 'fracture' },
] as const;

function buildSubject(
  THREE: RoomContext['THREE'],
  disposables: Array<{ dispose(): void }>,
  kind: string,
  colour: number,
  rng: () => number,
): THREE.Mesh {
  let geometry: THREE.BufferGeometry;
  if (kind === 'grid') {
    geometry = new THREE.BoxGeometry(0.95, 0.12, 0.95, 4, 1, 4);
  } else if (kind === 'pillars') {
    geometry = new THREE.CylinderGeometry(0.2, 0.24, 1.2, 12, 4);
  } else if (kind === 'voxel') {
    const box = new THREE.BoxGeometry(0.82, 0.82, 0.82, 3, 3, 3);
    const position = box.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      position.setY(i, position.getY(i) + (rng() - 0.5) * 0.16);
    }
    box.computeVertexNormals();
    geometry = box;
  } else {
    const ball = new THREE.IcosahedronGeometry(0.55, 1);
    const position = ball.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      const push = 1 + rng() * 0.18;
      position.setXYZ(i, position.getX(i) * push, position.getY(i) * push, position.getZ(i) * push);
    }
    ball.computeVertexNormals();
    geometry = ball;
  }
  disposables.push(geometry);
  const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.6, metalness: 0.1 });
  disposables.push(material);
  return new THREE.Mesh(geometry, material);
}

export const room: RoomDefinition = {
  sourceId: 41,
  skill: 'unmapped',
  title: 'Technique-demo hub',
  summary:
    'Four techniques piled unnamed on one block beside the same four as '
    + 'numbered, separately reachable pedestals.',
  kind: 'webgpu',
  limitation:
    'No source sketch is reproduced: the subjects are trivial stand-ins and '
    + 'there is no raymarching, physics or fluid here. Routing and page '
    + 'chrome belong to the lab, so this is the structure, not the router.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const subjects: THREE.Mesh[] = [];

    // BEFORE — one block, four techniques, nothing named or reachable.
    const blockGeometry = new THREE.BoxGeometry(3.6, 0.5, 1.6);
    disposables.push(blockGeometry);
    const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.9 });
    disposables.push(blockMaterial);
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    // Door half: a shell wall crosses local z = 0 in some wings, so the
    // comparison stands where the doorway camera can see it.
    block.position.set(-3.9, 0.25, -3.5);
    root.add(block);
    const mergedRng = mulberry32(ctx.seed);
    EXHIBITS.forEach((exhibit, i) => {
      const piece = buildSubject(THREE, disposables, exhibit.kind, exhibit.colour, mergedRng);
      piece.position.set(-5.0 + i * 0.75, 1.0 + (mergedRng() - 0.5) * 0.5, -3.5 + (mergedRng() - 0.5) * 0.8);
      piece.rotation.y = mergedRng() * Math.PI;
      root.add(piece);
    });
    const pedestalGeometry = new THREE.CylinderGeometry(0.42, 0.46, 0.9, 16);
    disposables.push(pedestalGeometry);
    const pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0x9aa0a3, roughness: 0.85 });
    disposables.push(pedestalMaterial);
    const plateGeometry = new THREE.PlaneGeometry(1.3, 0.24);
    disposables.push(plateGeometry);
    EXHIBITS.forEach((exhibit, i) => {
      const x = -0.4 + i * 2.1;
      const bay = new THREE.Group();
      bay.name = `exhibit-${String(exhibit.index).padStart(2, '0')}`;
      bay.position.set(x, 0, -3.5);
      const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
      pedestal.position.y = 0.45;
      bay.add(pedestal);
      const piece = buildSubject(
        THREE,
        disposables,
        exhibit.kind,
        exhibit.colour,
        mulberry32(ctx.seed + exhibit.index),
      );
      piece.name = 'subject';
      piece.scale.setScalar(1.35);
      piece.position.y = 1.75;
      bay.add(piece);
      subjects.push(piece);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 96;
      const paint = canvas.getContext('2d')!;
      paint.fillStyle = '#10141a';
      paint.fillRect(0, 0, 512, 96);
      paint.fillStyle = '#cfe3de';
      paint.font = '44px system-ui, sans-serif';
      paint.textAlign = 'center';
      paint.textBaseline = 'middle';
      paint.fillText(exhibit.plate, 256, 50);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      disposables.push(texture);
      const plateMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
      disposables.push(plateMaterial);
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.set(0, 0.62, -0.48);
      plate.rotation.y = Math.PI;
      bay.add(plate);
      root.add(bay);
    });

    let elapsed = 0;
    return {
      root,
      update: (_elapsed: number, dt: number) => {
        // Isolation is the point, so each exhibit keeps its own clock.
        elapsed += Math.min(dt, 0.1);
        for (let i = 0; i < subjects.length; i += 1) {
          subjects[i].rotation.y = elapsed * (0.3 + i * 0.17);
        }
      },
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
