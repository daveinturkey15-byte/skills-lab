/**
 * Source 60 — Tesana image-to-game (comparator): concept panel and diorama.
 *
 * Tesana is a proprietary hosted product with no source and no pin, so nothing
 * here reproduces vendor input, output or timing. The room stages the product
 * category with our own assets, as the demo does: a synthetic concept panel
 * baked in code on the left, and the diorama derived from its own fields on
 * the right — skyline blocks from the ridge line, block colours from the
 * palette bands — with one pacing mover for the motion half no image contains.
 * Both stand just inside the door at eye height.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

const BLOCKS = 9;

export const room: RoomDefinition = {
  sourceId: 60,
  skill: 'img2threejs',
  title: 'Image-to-game: panel and diorama',
  summary: 'A flat baked concept panel beside the skyline-and-street diorama derived from its own ridge and palette bands.',
  kind: 'webgpu',
  limitation:
    'Comparator only: the concept panel is synthetic input baked by the room and the derivation is hand-placed. No vendor timing, output format or look-and-feel is reproduced or verified.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, seed } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);

    const ridgeAt = (u: number): number =>
      0.55 + 0.28 * Math.sin(u * 5.1 + seed) + 0.12 * Math.sin(u * 11.7 + seed * 2);

    // Concept panel: a 96x64-style bake as a data texture — sky bands above
    // the ridge line, warm lit bands below it. Flat, no depth, nothing moves.
    const W = 96;
    const H = 64;
    const bytes = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const u = x / (W - 1);
        const v = y / (H - 1);
        const ridge = ridgeAt(u);
        const o = (y * W + x) * 4;
        if (v > ridge) {
          // Sky: deep blue cooling toward the ridge.
          bytes[o] = 18 + v * 30;
          bytes[o + 1] = 40 + v * 40;
          bytes[o + 2] = 90 + v * 60;
        } else {
          // City bands: warm windows cooling with depth.
          const band = Math.sin(v * 40 + u * 9) > 0.2 ? 1 : 0;
          bytes[o] = 120 + band * 110;
          bytes[o + 1] = 70 + band * 90;
          bytes[o + 2] = 30 + band * 40;
        }
        bytes[o + 3] = 255;
      }
    }
    const panelTexture = track(new THREE.DataTexture(bytes, W, H));
    panelTexture.colorSpace = THREE.SRGBColorSpace;
    panelTexture.magFilter = THREE.NearestFilter;
    panelTexture.minFilter = THREE.NearestFilter;
    panelTexture.needsUpdate = true;

    const panel = new THREE.Mesh(
      track(new THREE.PlaneGeometry(6.2, 4.1)),
      track(new THREE.MeshStandardMaterial({
        map: panelTexture, roughness: 0.85,
        emissive: 0xffffff, emissiveMap: panelTexture, emissiveIntensity: 0.35,
      })),
    );
    panel.position.set(-3.2, 2.6, 0.6);
    panel.rotation.y = Math.PI - 0.15;
    root.add(panel);
    const panelFrame = new THREE.Mesh(
      track(new THREE.BoxGeometry(6.6, 4.5, 0.18)),
      track(new THREE.MeshStandardMaterial({ color: 0x2c3438, roughness: 0.8 })),
    );
    panelFrame.position.set(-3.2, 2.6, 0.72);
    panelFrame.rotation.y = -0.15;
    root.add(panelFrame);

    // Diorama: ridge line raised as skyline blocks, colours from the bands.
    const diorama = new THREE.Group();
    diorama.position.set(3.2, 0, -1);
    root.add(diorama);
    const base = new THREE.Mesh(
      track(new THREE.BoxGeometry(5.8, 0.3, 6.2)),
      track(new THREE.MeshStandardMaterial({
        color: 0x39444a, roughness: 0.95, emissive: 0x39444a, emissiveIntensity: 0.25,
      })),
    );
    base.position.y = 0.15;
    diorama.add(base);
    const colour = new THREE.Color();
    for (let i = 0; i < BLOCKS; i += 1) {
      const u = i / (BLOCKS - 1);
      const h = 1 + ridgeAt(u) * 3;
      const warm = 0.5 + 0.5 * Math.sin(u * 9 + seed);
      colour.setHSL(0.07 + warm * 0.04, 0.8, 0.36 + ridgeAt(u) * 0.2);
      const block = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.56, 1, 0.56)),
        track(new THREE.MeshStandardMaterial({
          color: colour.clone(), roughness: 0.65,
          emissive: colour.clone(), emissiveIntensity: 0.3,
        })),
      );
      block.scale.y = h;
      block.position.set(-2.4 + i * 0.6, 0.3 + h / 2, 1.4 - ridgeAt(u) * 2.6);
      diorama.add(block);
      // Street slab in front of each block, cool slate against the warm towers.
      const street = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.6, 0.14, 1.8)),
        track(new THREE.MeshStandardMaterial({
          color: 0x4f8a9e, roughness: 0.8, emissive: 0x4f8a9e, emissiveIntensity: 0.25,
        })),
      );
      street.position.set(-2.4 + i * 0.6, 0.37, -1.4);
      diorama.add(street);
    }

    // Pacing mover: the motion half no single image contains.
    const mover = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.34, 16, 12)),
      track(new THREE.MeshStandardMaterial({
        color: 0x140a02, emissive: 0xffb24d, emissiveIntensity: 2.4, roughness: 0.4,
      })),
    );
    diorama.add(mover);

    return {
      root,
      update: (t) => {
        mover.position.set(Math.sin(t * 0.5) * 2.2, 1.2 + Math.sin(t * 1.3) * 0.25, -1.4);
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
