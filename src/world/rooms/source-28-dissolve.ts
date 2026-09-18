/**
 * Source 28 — WebGPU/TSL practice skill (dgreenheck), threshold dissolve.
 *
 * Restages the group-b dissolve demo at room scale. The graph shape the skill
 * teaches is kept: per-vertex hash noise over a dense grid, an animated
 * threshold uniform, vertex colours lerped solid-to-void with a bright edge
 * band just above the threshold. Two large panels stand side by side as before
 * (intact) and after (dissolving) just inside the door, angled inward so both
 * face a visitor walking in — the comparison the source's custom-material
 * examples exist to teach.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/** Deterministic 2D hash, the same role as the demo's hash2. */
function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const GRID = 44;
const EDGE_BAND = 0.1;

interface Panel {
  mesh: THREE.Mesh;
  noise: Float32Array;
  colours: THREE.BufferAttribute;
  base: THREE.Color;
  edge: THREE.Color;
}

export const room: RoomDefinition = {
  sourceId: 28,
  skill: 'dgreenheck/webgpu-claude-skill',
  title: 'Threshold dissolve over noise',
  summary: 'A noise-field dissolve with a bright edge band, intact beside dissolving, driven by one animated threshold.',
  kind: 'webgpu',
  limitation:
    'CPU per-vertex evaluation of a per-fragment GPU graph; no device-loss, limits, compute or WGSL coverage. Source has no licence: concepts restated, nothing copied.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, seed } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);
    const colour = new THREE.Color();

    const panels: Panel[] = [];
    for (const [i, x] of [-3, 3].entries()) {
      // Plinth under each panel; centres end up at eye height from the door.
      const plinth = new THREE.Mesh(
        track(new THREE.BoxGeometry(5.6, 0.5, 1.6)),
        track(new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.9 })),
      );
      plinth.position.set(x, 0.25, -1.2);
      // Shallow V opening toward the door so both panels face a visitor walking in.
      plinth.rotation.y = x < 0 ? -0.22 : 0.22;
      root.add(plinth);

      const geometry = track(new THREE.PlaneGeometry(5.6, 3.8, GRID, GRID));
      const material = track(new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide,
        emissive: 0xffffff, emissiveIntensity: 0.05,
      }));
      material.vertexColors = true;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 2.65, -1.2);
      mesh.rotation.y = (x < 0 ? -0.22 : 0.22) + Math.PI;
      root.add(mesh);
      const pos = geometry.getAttribute('position');
      const noise = new Float32Array(pos.count);
      for (let v = 0; v < pos.count; v += 1) {
        // Noise over a scaled field so the dissolve cells read at 5 m, as in the demo.
        noise[v] = hash2(Math.round(pos.getX(v) * 9 + 40), Math.round(pos.getY(v) * 9 + 40), seed + i);
      }
      const colours = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
      geometry.setAttribute('color', colours);
      const base = i === 0 ? new THREE.Color(0x1f8f7a) : new THREE.Color(0xc96a1e);
      const edge = new THREE.Color(0xffe9a8);
      panels.push({ mesh, noise, colours, base, edge });
    }

    const evaluate = (panel: Panel, threshold: number): void => {
      const array = panel.colours.array as Float32Array;
      for (let v = 0; v < panel.noise.length; v += 1) {
        const n = panel.noise[v];
        if (n < threshold) {
          colour.setRGB(0.05, 0.06, 0.07); // void: near-black where dissolved away
        } else if (n < threshold + EDGE_BAND) {
          colour.copy(panel.edge); // edge band just above the threshold
        } else {
          colour.copy(panel.base);
        }
        array[v * 3] = colour.r;
        array[v * 3 + 1] = colour.g;
        array[v * 3 + 2] = colour.b;
      }
      panel.colours.needsUpdate = true;
    };

    // Before panel evaluated below the noise floor so it reads fully intact.
    evaluate(panels[0], -0.1);
    evaluate(panels[1], 0.5);
    let lastBucket = -1;

    return {
      root,
      update: (t) => {
        // One animated threshold uniform; the before panel stays intact.
        const threshold = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.45));
        const bucket = Math.round(threshold * 60);
        if (bucket !== lastBucket && panels[1]) {
          lastBucket = bucket;
          evaluate(panels[1], threshold);
        }
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
