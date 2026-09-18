/**
 * Source 19 — Classic ray tracing in the browser (THREE.js-RayTracing-Renderer).
 *
 * Restages the lab demo's CPU Whitted tracer (bounded bounce loop, Blinn
 * halfway-vector lighting, Schlick Re/Tr split, metal/clearcoat/transparent
 * branches) as a walk-in gallery: the trace runs once at build time into a
 * DataTexture hung large on the back wall, with the three traced spheres
 * rebuilt at human scale on plinths in front of it so the correspondence is
 * legible from the doorway.
 */
import type * as THREE from 'three';
import type { RoomDefinition } from '../contract';

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

type V3 = { x: number; y: number; z: number };

const SPHERES = [
  { c: { x: -1.15, y: 0.75, z: 0 }, r: 0.75, kind: 1, col: [0.94, 0.88, 0.72] as const },
  { c: { x: 0.15, y: 0.85, z: 0.35 }, r: 0.85, kind: 3, col: [0.92, 0.97, 0.95] as const },
  { c: { x: 1.5, y: 0.6, z: -0.4 }, r: 0.6, kind: 2, col: [0.75, 0.16, 0.14] as const },
] as const;
const LIGHT: V3 = { x: -2.6, y: 4.4, z: 3.2 };

function norm(v: V3): V3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}
function dot(a: V3, b: V3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function fresnel(cosine: number, ior: number): number {
  const r0 = ((1 - ior) / (1 + ior)) ** 2;
  return r0 + (1 - r0) * (1 - Math.abs(cosine)) ** 5;
}

interface Hit {
  t: number;
  p: V3;
  n: V3;
  col: readonly [number, number, number];
  kind: number;
  ior: number;
}

function intersect(o: V3, d: V3): Hit | null {
  let best: Hit | null = null;
  for (const s of SPHERES) {
    const ox = o.x - s.c.x;
    const oy = o.y - s.c.y;
    const oz = o.z - s.c.z;
    const b = 2 * (ox * d.x + oy * d.y + oz * d.z);
    const c = ox * ox + oy * oy + oz * oz - s.r * s.r;
    const disc = b * b - 4 * c;
    if (disc < 0) continue;
    const root = Math.sqrt(disc);
    let t = (-b - root) / 2;
    if (t < 1e-4) t = (-b + root) / 2;
    if (t < 1e-4 || (best && t >= best.t)) continue;
    const p = { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t };
    best = {
      t, p, n: norm({ x: p.x - s.c.x, y: p.y - s.c.y, z: p.z - s.c.z }),
      col: s.col, kind: s.kind, ior: s.kind === 3 ? 1.52 : 1.4,
    };
  }
  if (Math.abs(d.y) > 1e-6) {
    const t = -o.y / d.y;
    if (t > 1e-4 && (!best || t < best.t)) {
      const p = { x: o.x + d.x * t, y: 0, z: o.z + d.z * t };
      if (Math.abs(p.x) < 7 && p.z > -7 && p.z < 5) {
        const checker = (Math.floor(p.x) + Math.floor(p.z)) & 1;
        best = {
          t, p, n: { x: 0, y: 1, z: 0 },
          col: checker ? [0.82, 0.8, 0.76] : [0.14, 0.16, 0.19],
          kind: 0, ior: 1,
        };
      }
    }
  }
  return best;
}

function inShadow(p: V3, n: V3): boolean {
  const toL = norm({ x: LIGHT.x - p.x, y: LIGHT.y - p.y, z: LIGHT.z - p.z });
  const hit = intersect({ x: p.x + n.x * 1e-3, y: p.y + n.y * 1e-3, z: p.z + n.z * 1e-3 }, toL);
  return hit !== null && hit.kind !== 3;
}

function shade(h: Hit, view: V3): [number, number, number] {
  const toL = norm({ x: LIGHT.x - h.p.x, y: LIGHT.y - h.p.y, z: LIGHT.z - h.p.z });
  const lambert = Math.max(0, dot(h.n, toL));
  const sh = lambert > 0 && inShadow(h.p, h.n);
  const diff = sh ? 0 : lambert;
  const half = norm({ x: toL.x - view.x, y: toL.y - view.y, z: toL.z - view.z });
  const spec = sh ? 0 : Math.max(0, dot(h.n, half)) ** 48;
  return [
    h.col[0] * (diff * 1.0 + 0.12) + spec * 0.5,
    h.col[1] * (diff * 0.95 + 0.12) + spec * 0.5,
    h.col[2] * (diff * 0.86 + 0.12) + spec * 0.5,
  ];
}

function reflect(d: V3, n: V3): V3 {
  const k = 2 * dot(d, n);
  return norm({ x: d.x - n.x * k, y: d.y - n.y * k, z: d.z - n.z * k });
}

function trace(o: V3, d: V3): [number, number, number] {
  let acc: [number, number, number] = [0, 0, 0];
  let mask: [number, number, number] = [1, 1, 1];
  let ro = o;
  let rd = d;
  for (let b = 0; b < 5; b += 1) {
    const h = intersect(ro, rd);
    if (!h) {
      const t = Math.max(0, rd.y);
      acc = [acc[0] + mask[0] * (0.36 + t * 0.34), acc[1] + mask[1] * (0.5 + t * 0.34), acc[2] + mask[2] * (0.72 + t * 0.24)];
      break;
    }
    const direct = shade(h, rd);
    if (h.kind === 1) {
      acc = [acc[0] + mask[0] * direct[0] * 0.12, acc[1] + mask[1] * direct[1] * 0.12, acc[2] + mask[2] * direct[2] * 0.12];
      mask = [mask[0] * h.col[0], mask[1] * h.col[1], mask[2] * h.col[2]];
      rd = reflect(rd, h.n);
      ro = { x: h.p.x + rd.x * 1e-3, y: h.p.y + rd.y * 1e-3, z: h.p.z + rd.z * 1e-3 };
      continue;
    }
    if (h.kind === 3) {
      const refl = fresnel(dot(rd, h.n), h.ior);
      const entering = dot(rd, h.n) < 0;
      const eta = entering ? 1 / h.ior : h.ior;
      const n2 = entering ? h.n : { x: -h.n.x, y: -h.n.y, z: -h.n.z };
      const cos = -dot(rd, n2);
      const k = 1 - eta * eta * (1 - cos * cos);
      const refr = k < 0
        ? reflect(rd, h.n)
        : norm({ x: eta * rd.x + n2.x * (eta * cos - Math.sqrt(k)), y: eta * rd.y + n2.y * (eta * cos - Math.sqrt(k)), z: eta * rd.z + n2.z * (eta * cos - Math.sqrt(k)) });
      const tr = 1 - refl;
      mask = [mask[0] * h.col[0] * tr, mask[1] * h.col[1] * tr, mask[2] * h.col[2] * tr];
      rd = refr;
      ro = { x: h.p.x + rd.x * 1e-3, y: h.p.y + rd.y * 1e-3, z: h.p.z + rd.z * 1e-3 };
      continue;
    }
    if (h.kind === 2) {
      const refl = fresnel(dot(rd, h.n), h.ior);
      acc = [acc[0] + mask[0] * direct[0] * (1 - refl), acc[1] + mask[1] * direct[1] * (1 - refl), acc[2] + mask[2] * direct[2] * (1 - refl)];
      mask = [mask[0] * refl, mask[1] * refl, mask[2] * refl];
      rd = reflect(rd, h.n);
      ro = { x: h.p.x + rd.x * 1e-3, y: h.p.y + rd.y * 1e-3, z: h.p.z + rd.z * 1e-3 };
      continue;
    }
    acc = [acc[0] + mask[0] * direct[0], acc[1] + mask[1] * direct[1], acc[2] + mask[2] * direct[2]];
    break;
  }
  return acc;
}

export const room: RoomDefinition = {
  sourceId: 19,
  skill: 'unmapped',
  title: 'Classic ray tracing in the browser',
  summary: 'A CPU Whitted tracer with metal, glass and clearcoat spheres, printed large with the subjects on plinths.',
  kind: 'webgpu',
  limitation: 'CPU trace at low resolution into a texture, no BVH and no depth of field; classic ray tracing has no diffuse global illumination.',
  create: (ctx) => {
    const T = ctx.THREE;
    void mulberry32(ctx.seed);
    const root = new T.Group();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const texs: THREE.Texture[] = [];

    // Back-wall print: the trace itself, big enough to read from the door.
    const W = 112;
    const H = 72;
    const data = new Uint8Array(W * H * 4);
    const cam: V3 = { x: 0, y: 1.5, z: 5.2 };
    const aspect = W / H;
    const scale = Math.tan((42 * Math.PI) / 180 / 2);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const ndcX = ((x + 0.5) / W) * 2 - 1;
        const ndcY = 1 - ((y + 0.5) / H) * 2;
        const dir = norm({ x: ndcX * aspect * scale, y: ndcY * scale - 0.16, z: -1 });
        const c = trace(cam, dir);
        const i = (y * W + x) * 4;
        for (let ch = 0; ch < 3; ch += 1) {
          const v = c[ch] / (1 + c[ch]);
          data[i + ch] = Math.round(Math.min(1, Math.max(0, v)) * 255);
        }
        data[i + 3] = 255;
      }
    }
    const tex = new T.DataTexture(data, W, H);
    tex.magFilter = T.NearestFilter;
    tex.minFilter = T.NearestFilter;
    tex.needsUpdate = true;
    texs.push(tex);
    const printMat = new T.MeshBasicMaterial({ map: tex });
    mats.push(printMat);
    const printGeo = new T.PlaneGeometry(10.5, 5.2);
    geos.push(printGeo);
    const print = new T.Mesh(printGeo, printMat);
    print.position.set(0, 2.9, 7.55);
    print.rotation.y = Math.PI;
    root.add(print);
    const frameGeo = new T.BoxGeometry(11.1, 5.6, 0.18);
    geos.push(frameGeo);
    const frameMat = new T.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.8 });
    mats.push(frameMat);
    const frame = new T.Mesh(frameGeo, frameMat);
    frame.position.set(0, 3.0, 7.7);
    root.add(frame);

    // Human-scale spheres on plinths matching the trace left to right.
    const cols = [0xd8c08a, 0xcfe0d8, 0xb03028];
    const kinds = ['metal', 'glass', 'clearcoat'];
    const spheres: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i += 1) {
      const px = -3.6 + i * 3.6;
      const plinthGeo = new T.CylinderGeometry(1.2, 1.35, 0.9, 20);
      geos.push(plinthGeo);
      const plinthMat = new T.MeshStandardMaterial({ color: 0x4a545c, roughness: 0.9 });
      mats.push(plinthMat);
      const plinth = new T.Mesh(plinthGeo, plinthMat);
      plinth.position.set(px, 0.45, -2.5);
      root.add(plinth);
      const sGeo = new T.SphereGeometry(1.1, 28, 18);
      geos.push(sGeo);
      const sMat = i === 0
        ? new T.MeshStandardMaterial({ color: cols[i], metalness: 0.95, roughness: 0.25 })
        : i === 1
          ? new T.MeshStandardMaterial({ color: cols[i], metalness: 0, roughness: 0.05, transparent: true, opacity: 0.55 })
          : new T.MeshStandardMaterial({ color: cols[i], metalness: 0.1, roughness: 0.3 });
      mats.push(sMat);
      const s = new T.Mesh(sGeo, sMat);
      s.position.set(px, 1.95, -2.5);
      s.userData.kind = kinds[i];
      root.add(s);
      spheres.push(s);
      void kinds;
    }

    // Chequer apron under the plinths echoes the traced ground plane.
    const apronGeo = new T.PlaneGeometry(12, 5);
    geos.push(apronGeo);
    const apronMat = new T.MeshStandardMaterial({ color: 0x8a8578, roughness: 0.95 });
    mats.push(apronMat);
    const apron = new T.Mesh(apronGeo, apronMat);
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(0, 0.02, -2.5);
    root.add(apron);

    const update = (elapsed: number): void => {
      for (let i = 0; i < spheres.length; i += 1) {
        spheres[i].rotation.y = elapsed * (0.12 + i * 0.05);
      }
    };
    const dispose = (): void => {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
      for (const t of texs) t.dispose();
    };
    return { root, update, dispose };
  },
};
