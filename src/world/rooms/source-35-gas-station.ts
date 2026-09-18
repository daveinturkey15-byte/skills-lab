/**
 * Source 35 — gas-station-highway: the one-page photoreal-scene brief.
 *
 * Restages the lab demo's executable half at room scale: the visitor walks
 * from a flat placeholder slab onto the same footprint synthesised in code
 * (aggregate, cold-patch repairs, tar seams, one leftover puddle), past the
 * brief's closed verb whitelist exercised as brass markers — with the refused
 * verb toppled over. The surfacing maths is restated, not copied, and the
 * source build's own dawn gas station is deliberately not reproduced.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

const INTERACTION_WHITELIST = ['pump', 'door', 'fridge'] as const;

function hash2(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/** Every value computed; no image, no model, no audio file. */
function asphalt(x: number, z: number): [number, number, number] {
  const aggregate = hash2(Math.floor(x * 24), Math.floor(z * 24)) * 0.1;
  const patch = hash2(Math.floor(x * 1.8) + 7, Math.floor(z * 1.4) + 3) > 0.74 ? 0.82 : 1;
  const seam = Math.abs(Math.sin(z * 1.7 + Math.sin(x * 2.6) * 0.5)) < 0.045 ? 0.7 : 1;
  const crack = Math.abs(Math.sin(x * 6.3 + z * 1.1)) < 0.025 ? 0.75 : 1;
  const puddle = Math.hypot(x - 3.2, z - 3.4);
  if (puddle < 1.1) {
    const t = puddle / 1.1;
    return [0.1 + 0.03 * t, 0.12 + 0.03 * t, 0.15 + 0.04 * t];
  }
  const base = (0.21 + aggregate) * patch * seam * crack;
  return [base, base * 1.01, base * 1.06];
}

export const room: RoomDefinition = {
  sourceId: 35,
  skill: 'brief-driven-scene-production',
  title: 'One-page scene brief, all-procedural',
  summary:
    'The same forecourt twice underfoot: fully synthesised asphalt at the '
    + 'door, flat placeholder beyond, with the brief\u2019s verb whitelist '
    + 'admitted in brass and the refused verb toppled.',
  kind: 'webgpu',
  limitation:
    'Only the all-procedural clause and the whitelist are demonstrable as a '
    + 'scene. The source build\u2019s own walkable dawn gas station is not '
    + 'reproduced — that would copy the expression of a repository with no '
    + 'licence file at the pin. Lighting, sound and the critic loop are out '
    + 'of scope.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const low = ctx.quality === 'low';

    // BEFORE — the placeholder an external asset would have replaced.
    const flatGeometry = new THREE.PlaneGeometry(14, 8);
    flatGeometry.rotateX(-Math.PI / 2);
    disposables.push(flatGeometry);
    const flatMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4e, roughness: 0.95 });
    disposables.push(flatMaterial);
    const flat = new THREE.Mesh(flatGeometry, flatMaterial);
    flat.position.set(0, 0.015, 4);
    root.add(flat);

    // AFTER — the same footprint, every texel synthesised.
    const segX = low ? 56 : 112;
    const segZ = low ? 32 : 64;
    const slabGeometry = new THREE.PlaneGeometry(14, 8, segX, segZ);
    slabGeometry.rotateX(-Math.PI / 2);
    disposables.push(slabGeometry);
    const position = slabGeometry.getAttribute('position');
    const colours = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i += 1) {
      const c = asphalt(position.getX(i), position.getZ(i) + 4);
      colours[i * 3] = c[0];
      colours[i * 3 + 1] = c[1];
      colours[i * 3 + 2] = c[2];
    }
    slabGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    const slabMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
    disposables.push(slabMaterial);
    const slab = new THREE.Mesh(slabGeometry, slabMaterial);
    slab.position.set(0, 0.03, -4);
    root.add(slab);

    // The whitelist, exercised: three verbs admitted, one refused.
    const admitted: Array<{ verb: string; at: [number, number] }> = [
      { verb: 'pump', at: [-3.6, -5.8] },
      { verb: 'door', at: [0.7, -1.9] },
      { verb: 'fridge', at: [4.3, -3.5] },
    ];
    for (const verb of INTERACTION_WHITELIST) {
      if (!admitted.some((entry) => entry.verb === verb)) admitted.push({ verb, at: [0, 0] });
    }
    const markerGeometry = new THREE.CylinderGeometry(0.14, 0.18, 0.9, 12);
    disposables.push(markerGeometry);
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8c27a,
      emissive: 0x2a2210,
      roughness: 0.55,
      metalness: 0.1,
    });
    disposables.push(brassMaterial);
    for (const entry of admitted) {
      const marker = new THREE.Mesh(markerGeometry, brassMaterial);
      marker.position.set(entry.at[0], 0.45, entry.at[1]);
      root.add(marker);
    }
    // The refused verb: toppled, grey, on the procedural half where it failed.
    const refusedMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5e63, roughness: 0.9 });
    disposables.push(refusedMaterial);
    const refused = new THREE.Mesh(markerGeometry, refusedMaterial);
    refused.position.set(-0.9, 0.18, -3.8);
    refused.rotation.z = Math.PI / 2;
    root.add(refused);

    // Admitted positions ringed in light on the asphalt: the whitelist drawn
    // where the doorway camera stands, bright enough to read at a glance.
    const ringGeometry = new THREE.RingGeometry(0.45, 0.6, 28);
    ringGeometry.rotateX(-Math.PI / 2);
    disposables.push(ringGeometry);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xd8c27a, toneMapped: false });
    disposables.push(ringMaterial);
    for (const entry of admitted) {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(entry.at[0], 0.045, entry.at[1]);
      root.add(ring);
    }
    // Lectern just inside the door: the same before/after at eye height. The
    // floor comparison aliases to flat grey from the doorway at a grazing
    // angle, so the capture showed an empty room; this board carries the
    // identical surfaces (flat grey left, sampled asphalt right) where the
    // entry sightline lands. One post, one board: two draw calls.
    const postGeo = new THREE.CylinderGeometry(0.09, 0.12, 1.5, 10);
    disposables.push(postGeo);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x3a4046, roughness: 0.8 });
    disposables.push(postMat);
    const post = new THREE.Mesh(postGeo, postMat);
    // Stands 1.7 m inside the door and right of the entry path: the first
    // staging put it 0.2 m in front of the doorway camera and blinded it.
    post.position.set(1.3, 0.75, -4.8);
    root.add(post);
    const lectGeo = new THREE.PlaneGeometry(2.2, 0.8, 40, 14);
    disposables.push(lectGeo);
    const lectPos = lectGeo.getAttribute('position');
    const lectCol = new Float32Array(lectPos.count * 3);
    for (let i = 0; i < lectPos.count; i += 1) {
      const u = lectPos.getX(i) / 2.2;
      if (u < 0) {
        lectCol[i * 3] = 0.29;
        lectCol[i * 3 + 1] = 0.29;
        lectCol[i * 3 + 2] = 0.31;
      } else {
        const c = asphalt(2.0 + u * 4.0, 2.5 + (lectPos.getY(i) / 0.8 + 0.5) * 1.3);
        lectCol[i * 3] = c[0];
        lectCol[i * 3 + 1] = c[1];
        lectCol[i * 3 + 2] = c[2];
      }
    }
    lectGeo.setAttribute('color', new THREE.BufferAttribute(lectCol, 3));
    const lectMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    disposables.push(lectMat);
    const lectern = new THREE.Mesh(lectGeo, lectMat);
    // Broad board right of the entry path: the doorway read lives or dies
    // on this panel, so it takes the larger share of the wall the visitor
    // faces. Same two surfaces, no new claim.
    lectern.position.set(1.45, 1.5, -4.8);
    lectern.rotation.y = Math.PI;
    root.add(lectern);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 96;
    const paint = canvas.getContext('2d')!;
    paint.fillStyle = '#10141a';
    paint.fillRect(0, 0, 1024, 96);
    paint.fillStyle = '#d8c27a';
    paint.font = '40px system-ui, sans-serif';
    paint.textAlign = 'center';
    paint.textBaseline = 'middle';
    paint.fillText('pump \u00b7 door \u00b7 fridge admitted \u2014 drive refused', 512, 50);
    const boardTexture = new THREE.CanvasTexture(canvas);
    boardTexture.colorSpace = THREE.SRGBColorSpace;
    disposables.push(boardTexture);
    const boardGeometry = new THREE.PlaneGeometry(8, 0.75);
    disposables.push(boardGeometry);
    const boardMaterial = new THREE.MeshBasicMaterial({ map: boardTexture, toneMapped: false });
    disposables.push(boardMaterial);
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(0, 3.4, 7.6);
    board.rotation.y = Math.PI;
    root.add(board);

    return {
      root,
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
