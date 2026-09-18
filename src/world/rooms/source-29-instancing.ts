/**
 * Source 29 — Three.js skills collection (CloudAI-X), geometry-body instancing.
 *
 * Restages the lab demo's comparison at room scale: the same deterministic
 * 64-cube field twice, once as 64 separate meshes sharing one material (the
 * anti-pattern the instancing section replaces) and once as a single
 * InstancedMesh with per-instance transforms and colours. The counts on the
 * placards are written from the same constant that builds the field, so they
 * cannot drift from what is drawn. Field cut from the demo's 240 to 64: the
 * ratio is the point, and 240 individual draws would eat the wing's budget.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

const COUNT = 64;
const COLS = 8;
const SPACING = 0.62;
const CUBE = 0.5;

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

/** Small dark placard with honest counts, drawn from live values. */
function placard(
  THREE: RoomContext['THREE'],
  disposables: Array<{ dispose(): void }>,
  text: string,
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#10141a';
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#cfe3de';
  ctx.font = '28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 34);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  disposables.push(texture);
  const geometry = new THREE.PlaneGeometry(3.4, 0.42);
  disposables.push(geometry);
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  disposables.push(material);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = Math.PI;
  return mesh;
}

export const room: RoomDefinition = {
  sourceId: 29,
  skill: 'CloudAI-X/threejs-skills',
  title: 'Three.js skills collection (CloudAI-X)',
  summary:
    'The same 64-cube field twice: 64 separate meshes against one '
    + 'InstancedMesh with per-instance colour.',
  kind: 'webgpu',
  limitation:
    'Only the geometry body\u2019s instancing section is shown; the row is a '
    + 'tutorial set, not a production pack. Field cut from 240 to 64 cubes '
    + 'for the room draw budget; positions come from a seeded generator, not '
    + 'the body\u2019s Math.random.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const low = ctx.quality === 'low';
    const count = low ? 32 : COUNT;
    const cols = low ? 8 : COLS;
    const rng = mulberry32(ctx.seed ^ 0x29e1f7);

    const transforms: Array<{ x: number; y: number; s: number }> = [];
    const tints: Array<{ r: number; g: number; b: number }> = [];
    for (let i = 0; i < count; i += 1) {
      transforms.push({
        x: (i % cols - (cols - 1) / 2) * SPACING,
        y: (Math.floor(i / cols) - (Math.ceil(count / cols) - 1) / 2) * SPACING,
        s: 0.8 + rng() * 0.45,
      });
      tints.push({ r: 0.25 + rng() * 0.75, g: 0.25 + rng() * 0.75, b: 0.25 + rng() * 0.75 });
    }

    const cubeGeometry = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
    disposables.push(cubeGeometry);
    const sharedMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0,
    });
    disposables.push(sharedMaterial);
    const panelGeometry = new THREE.PlaneGeometry(5.4, 5.4);
    disposables.push(panelGeometry);
    const panelBefore = new THREE.MeshStandardMaterial({ color: 0x3a2c2c, roughness: 0.95 });
    disposables.push(panelBefore);
    const panelAfter = new THREE.MeshStandardMaterial({ color: 0x24382e, roughness: 0.95 });
    disposables.push(panelAfter);
    // Door half, facing the entry: a shell wall crosses local z = 0 in some
    // wings, so anything staged behind it never reads from the doorway.
    for (const side of [-1, 1] as const) {
      const panel = new THREE.Mesh(panelGeometry, side < 0 ? panelBefore : panelAfter);
      panel.position.set(side * 3.1, 2.9, -3.2);
      panel.rotation.y = Math.PI;
      root.add(panel);
    }

    // BEFORE: one mesh per copy, sharing a single white material.
    const beforeGroup = new THREE.Group();
    beforeGroup.position.set(-3.1, 2.9, -3.0);
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(cubeGeometry, sharedMaterial);
      const t = transforms[i];
      mesh.position.set(t.x, t.y, (rng() - 0.5) * 0.3);
      mesh.scale.setScalar(t.s);
      beforeGroup.add(mesh);
    }
    root.add(beforeGroup);

    // AFTER: one InstancedMesh, per-instance matrices and colours.
    const instanced = new THREE.InstancedMesh(cubeGeometry, sharedMaterial, count);
    instanced.position.set(3.1, 2.9, -3.0);
    const scratch = new THREE.Object3D();
    const colour = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const t = transforms[i];
      scratch.position.set(t.x, t.y, 0);
      scratch.scale.setScalar(t.s);
      scratch.updateMatrix();
      instanced.setMatrixAt(i, scratch.matrix);
      const c = tints[i];
      instanced.setColorAt(i, colour.setRGB(c.r, c.g, c.b));
    }
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    root.add(instanced);

    const beforeCard = placard(THREE, disposables, `BEFORE \u2014 ${count} meshes, ${count} draws`);
    beforeCard.position.set(-3.1, 0.35, -2.9);
    root.add(beforeCard);
    const afterCard = placard(THREE, disposables, `AFTER \u2014 1 draw, ${count} instances`);
    afterCard.position.set(3.1, 0.35, -2.9);
    root.add(afterCard);

    return {
      root,
      update: (time: number) => {
        // One bounded pulse on the instanced half: same clock, one re-upload.
        const pulse = 1 + 0.12 * Math.sin(time * 1.2);
        for (let i = 0; i < count; i += 1) {
          const t = transforms[i];
          scratch.position.set(t.x, t.y, 0);
          scratch.scale.setScalar(t.s * pulse);
          scratch.updateMatrix();
          instanced.setMatrixAt(i, scratch.matrix);
        }
        instanced.instanceMatrix.needsUpdate = true;
      },
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
