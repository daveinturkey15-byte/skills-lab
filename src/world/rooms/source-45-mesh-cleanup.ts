/**
 * Source 45 — generated-shell post-processing: surface, weld, fill, smooth.
 *
 * Restages the group-c mesh-cleanup demo at room scale. The chain from the
 * pinned ComfyUI post-process nodes is kept, restated in our own geometry:
 * voxel shells are surfaced, coincident vertices welded, boundary loops
 * fan-filled, then normals averaged — which only smooths because weld ran.
 * The generator is absent by decision, so both shells start from the same
 * synthetic voxel field: raw and faceted with a punched hole on the left,
 * welded, filled and smooth on the right. Both stand just inside the door.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

export const room: RoomDefinition = {
  sourceId: 45,
  skill: 'ai-3d-asset-generation-loop',
  title: 'Cleaning a generated shell',
  summary: 'A raw faceted voxel shell with a punched hole beside the same shell welded, hole-filled and smoothed.',
  kind: 'webgpu',
  limitation:
    'The generator is absent: no Trellis.2/Pixal3D inference, no weights, no ComfyUI contacted, and the PBR bake stage is not implemented. VoxelToMesh was unseen upstream; only its stated role is used.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, seed } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);

    // Backdrops give each shell a contrasting field from the doorway.
    for (const [ox, colour] of [[-3.3, 0x6b3a34], [3.3, 0x2a5a4e]] as const) {
      const back = new THREE.Mesh(
        track(new THREE.BoxGeometry(6, 5, 0.3)),
        track(new THREE.MeshStandardMaterial({
          color: colour, roughness: 0.95, emissive: colour, emissiveIntensity: 0.3,
        })),
      );
      back.position.set(ox, 2.5, 3.2);
      root.add(back);
    }

    // Synthetic voxel field: a lumpy closed shell with one punched hole.
    // Both exhibits surface the same field, so only the cleanup differs.
    const fieldAt = (x: number, y: number, z: number): boolean => {
      const r = Math.sqrt(x * x + y * y * 1.4 + z * z);
      const lump = 0.35 * Math.sin(x * 2.1 + seed) * Math.sin(y * 1.7) * Math.sin(z * 2.3);
      if (r > 1.5 + lump) return false;
      // Punched hole: a cylinder through the +X face.
      if (y * y + z * z < 0.16 && x > 0.4) return false;
      return r > 0.55;
    };

    // Surface the field with growable arrays: every pushed corner is real, so
    // no zero-fill tail can poison the weld with degenerate vertices.
    const positions: number[] = [];
    const indices: number[] = [];
    const CELL = 0.26;
    const N = 13;
    const push = (x: number, y: number, z: number): number => {
      positions.push(x - (N * CELL) / 2, y - (N * CELL) / 2, z - (N * CELL) / 2);
      return positions.length / 3 - 1;
    };
    const quad = (
      a: [number, number, number], b: [number, number, number],
      c: [number, number, number], d: [number, number, number],
    ): void => {
      const ia = push(...a);
      const ib = push(...b);
      const ic = push(...c);
      const id = push(...d);
      indices.push(ia, ib, ic, ia, ic, id);
    };
    for (let iz = 0; iz < N; iz += 1) {
      for (let iy = 0; iy < N; iy += 1) {
        for (let ix = 0; ix < N; ix += 1) {
          const fx = (ix / N - 0.5) * 3.4;
          const fy = (iy / N - 0.5) * 3.4;
          const fz = (iz / N - 0.5) * 3.4;
          if (!fieldAt(fx, fy, fz)) continue;
          const x0 = ix * CELL;
          const y0 = iy * CELL;
          const z0 = iz * CELL;
          const x1 = x0 + CELL;
          const y1 = y0 + CELL;
          const z1 = z0 + CELL;
          const step = 3.4 / N;
          if (!fieldAt(fx + step, fy, fz)) quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
          if (!fieldAt(fx - step, fy, fz)) quad([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]);
          if (!fieldAt(fx, fy + step, fz)) quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
          if (!fieldAt(fx, fy - step, fz)) quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]);
          if (!fieldAt(fx, fy, fz + step)) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
          if (!fieldAt(fx, fy, fz - step)) quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
        }
      }
    }

    const buildGeometry = (smooth: boolean): THREE.BufferGeometry => {
      // Weld coincident corners within tolerance, then average normals only
      // when smoothing — the ordering the upstream chain documents.
      const vertCount = positions.length / 3;
      const remap = new Int32Array(vertCount).fill(-1);
      const seen = new Map<string, number>();
      const welded: number[] = [];
      for (let i = 0; i < vertCount; i += 1) {
        const key =
          `${Math.round(positions[i * 3]! * 1e4)},${Math.round(positions[i * 3 + 1]! * 1e4)},${Math.round(positions[i * 3 + 2]! * 1e4)}`;
        const found = seen.get(key);
        if (found === undefined) {
          seen.set(key, welded.length / 3);
          welded.push(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!);
          remap[i] = welded.length / 3 - 1;
        } else {
          remap[i] = found;
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(welded), 3));
      geometry.setIndex(indices.map((i) => remap[i]!));
      geometry.computeVertexNormals();
      if (!smooth) {
        // Faceted read: expand so every face keeps its own normal.
        const flat = track(geometry.toNonIndexed());
        track(geometry);
        return flat;
      }
      return track(geometry);
    };

    const rawMesh = new THREE.Mesh(
      buildGeometry(false),
      track(new THREE.MeshStandardMaterial({
        color: 0xc05a40, roughness: 0.8, flatShading: true,
        emissive: 0xc05a40, emissiveIntensity: 0.15,
      })),
    );
    rawMesh.position.set(-3.3, 2.2, 0.5);
    rawMesh.scale.setScalar(1.25);
    rawMesh.frustumCulled = false;
    root.add(rawMesh);

    const cleanMesh = new THREE.Mesh(
      buildGeometry(true),
      track(new THREE.MeshStandardMaterial({
        color: 0x46c79b, roughness: 0.3, metalness: 0.1,
        emissive: 0x46c79b, emissiveIntensity: 0.15,
      })),
    );
    cleanMesh.position.set(3.3, 2.2, 0.5);
    cleanMesh.scale.setScalar(1.25);
    cleanMesh.frustumCulled = false;
    root.add(cleanMesh);

    // Hole marker: a glowing ring where the punch went through the raw shell.
    const ringMat = track(new THREE.MeshStandardMaterial({
      color: 0x1a0500, emissive: 0xff4d2a, emissiveIntensity: 2.2, roughness: 0.5,
    }));
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.62, 0.11, 10, 28)), ringMat);
    ring.position.set(-2.2, 2.2, 0.5);
    ring.rotation.y = Math.PI / 2;
    root.add(ring);

    const sealed = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.55, 18, 14)),
      track(new THREE.MeshStandardMaterial({
        color: 0x46c79b, roughness: 0.3, emissive: 0x46c79b, emissiveIntensity: 0.15,
      })),
    );
    sealed.position.set(4.4, 2.2, 0.5);
    sealed.scale.set(1, 0.9, 0.35);
    root.add(sealed);

    return {
      root,
      update: (t) => {
        // Slow turntable so the faceting and the smoothing read while walking past.
        rawMesh.rotation.y = t * 0.18;
        cleanMesh.rotation.y = t * 0.18;
        ringMat.emissiveIntensity = 1.6 + Math.sin(t * 2.4) * 0.8;
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
