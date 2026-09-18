/**
 * Source 18 — procedural grass and landscape systems, room as meadow.
 *
 * Restages the group-b grass demo with the room itself as the technique: the
 * floor is terrain carrying jittered-grid tapered blades swept along a
 * quadratic Bezier, placed with the source's three rejection tests (slope,
 * density noise, bare patches), driven by layered wind with root-anchored
 * weighting, and thinned into concentric LOD rings that drop density and
 * blade segments together. Per-instance colour variation with root darkening
 * stands in for the source's shading.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

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

/** Rolling terrain with a ridge so the slope-rejection test has work to do. */
function terrainHeight(x: number, z: number, seed: number): number {
  const rolling = Math.sin(x * 0.5 + seed) * Math.cos(z * 0.4) * 0.35;
  const ridge = Math.exp(-((x - 2.5) * (x - 2.5)) / 3) * 1.1;
  return rolling + ridge;
}

/** Tapered blade swept along a quadratic Bezier; segments are the LOD knob. */
function bladeGeometry(
  THREE: RoomContext['THREE'], segments: number, width: number, height: number, curve: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const lateral = 2 * (1 - t) * t * curve;
    const halfWidth = (width * (1 - t * 0.8)) / 2;
    positions.push(lateral - halfWidth, t * height, 0, lateral + halfWidth, t * height, 0);
  }
  positions.push(curve * 0.5, height, 0);
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  indices.push(segments * 2, segments * 2 + 1, segments * 2 + 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export const room: RoomDefinition = {
  sourceId: 18,
  skill: 'threejs-procedural-vegetation',
  title: 'Procedural grass meadow',
  summary: 'The floor is a wind-blown meadow of tapered instanced blades over a ridge, thinning into cheaper rings with distance.',
  kind: 'webgpu',
  limitation:
    'CPU rigid-blade wind on a standard material instead of the source GLSL per-vertex bend; emissive lift instead of true backlit scattering; a bounded few thousand blades, not the claimed 50K–2M.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, seed, quality } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);
    const rng = mulberry32(seed * 13 + 18);
    const budget = quality === 'low' ? 1100 : 2400;

    // Terrain floor: the technique is a surface, so it becomes the floor.
    const groundGeo = track(new THREE.PlaneGeometry(13, 15, 52, 52));
    groundGeo.rotateX(-Math.PI / 2);
    const groundPos = groundGeo.getAttribute('position');
    for (let i = 0; i < groundPos.count; i += 1) {
      groundPos.setY(i, terrainHeight(groundPos.getX(i), groundPos.getZ(i), seed));
    }
    groundPos.needsUpdate = true;
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(
      groundGeo,
      track(new THREE.MeshStandardMaterial({ color: 0x2f4a22, roughness: 0.95 })),
    );
    ground.position.set(0, 0, 0.5);
    root.add(ground);

    const bladeMat = track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0x14330c),
      emissiveIntensity: 0.55,
    }));

    interface Ring { inner: number; outer: number; segments: number; keep: number }
    const rings: Ring[] = [
      { inner: 0, outer: 4.5, segments: 5, keep: 1 },
      { inner: 4.5, outer: 8, segments: 3, keep: 2 },
      { inner: 8, outer: 99, segments: 2, keep: 4 },
    ];

    interface BladeBase { y: number; quat: THREE.Quaternion; }
    interface SwayEntry { mesh: THREE.InstancedMesh; xs: Float32Array; zs: Float32Array; bases: BladeBase[]; phases: Float32Array }
    const sway: SwayEntry[] = [];
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const col = new THREE.Color();

    // Jittered grid with the three rejection tests: slope, density noise, patch roll.
    const step = 0.24;
    const candidates: { x: number; z: number; y: number; rot: number; sx: number; sy: number; v: number }[] = [];
    for (let gx = -6.2; gx < 6.2 && candidates.length < budget * 2; gx += step) {
      for (let gz = -7; gz < 7.5 && candidates.length < budget * 2; gz += step) {
        const x = gx + (rng() - 0.5) * step;
        const z = gz + 0.5 + (rng() - 0.5) * step;
        const slope = Math.abs(terrainHeight(x + 0.15, z, seed) - terrainHeight(x, z, seed)) / 0.15;
        if (slope > 0.62) continue;
        const patch = 0.5 + 0.5 * Math.sin(x * 0.7 + seed) * Math.sin(z * 0.55);
        if (patch < 0.36) continue;
        if (rng() > patch * 0.7 + 0.45) continue;
        // Doorway apron: keep the entry clear so the meadow is framed, not face-full.
        if (Math.hypot(x, z + 6.5) < 2.5) continue;
        candidates.push({
          x, z, y: terrainHeight(x, z, seed), rot: rng() * Math.PI * 2,
          sx: 0.7 + rng() * 0.6, sy: 0.6 + rng() * 0.8, v: rng(),
        });
      }
    }

    for (const ring of rings) {
      const members = candidates.filter((c, i) => {
        const d = Math.hypot(c.x, c.z - 0.5);
        return d >= ring.inner && d < ring.outer && i % ring.keep === 0;
      }).slice(0, Math.ceil(budget / 2));
      if (members.length === 0) continue;
      const geo = track(bladeGeometry(THREE, ring.segments, 0.07, 0.9, 0.3));
      const mesh = new THREE.InstancedMesh(geo, bladeMat, members.length);
      mesh.frustumCulled = false;
      const xs = new Float32Array(members.length);
      const zs = new Float32Array(members.length);
      const phases = new Float32Array(members.length);
      const bases: BladeBase[] = [];
      members.forEach((b, i) => {
        pos.set(b.x, b.y, b.z);
        quat.setFromAxisAngle(yAxis, b.rot);
        scl.set(b.sx, b.sy, 1);
        matrix.compose(pos, quat, scl);
        mesh.setMatrixAt(i, matrix);
        col.setHSL(0.24 - b.v * 0.05, 0.42 + b.v * 0.2, 0.26 + b.v * 0.16);
        mesh.setColorAt(i, col);
        xs[i] = b.x;
        zs[i] = b.z;
        phases[i] = b.v * Math.PI * 2;
        bases.push({ y: b.y, quat: quat.clone() });
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      root.add(mesh);
      sway.push({ mesh, xs, zs, bases, phases });
    }

    // Scratch wind state, hoisted: the per-frame loop writes in place.
    const bendQuat = new THREE.Quaternion();
    const combinedQuat = new THREE.Quaternion();
    const bendAxis = new THREE.Vector3();
    const basePos = new THREE.Vector3();
    const unitScl = new THREE.Vector3(1, 1, 1);

    return {
      root,
      update: (t) => {
        // Layered wind as rigid root rotation so tips travel furthest: global
        // sway, rolling gust fronts, per-blade turbulence on the base orientation.
        for (const entry of sway) {
          const n = entry.xs.length;
          for (let i = 0; i < n; i += 1) {
            const x = entry.xs[i]!;
            const z = entry.zs[i]!;
            const swayA = Math.sin(t * 1.1 + x * 0.35 + z * 0.1) * 0.16;
            const gust = Math.max(0, Math.sin((x + z * 0.3) * 0.28 - t * 0.55)) ** 2 * 0.34;
            const flutter = Math.sin(t * 5.2 + entry.phases[i]!) * 0.04;
            bendAxis.set(0.3, 0, 1).normalize();
            bendQuat.setFromAxisAngle(bendAxis, swayA + gust + flutter);
            const base = entry.bases[i]!;
            combinedQuat.multiplyQuaternions(bendQuat, base.quat);
            basePos.set(x, base.y, z);
            matrix.compose(basePos, combinedQuat, unitScl);
            entry.mesh.setMatrixAt(i, matrix);
          }
          entry.mesh.instanceMatrix.needsUpdate = true;
        }
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
