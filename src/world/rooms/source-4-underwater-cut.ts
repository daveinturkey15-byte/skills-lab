/**
 * Source 4 — underwater volume and waterline cutting (cut SHOWN FAILING).
 *
 * The author's own words: surface cutting still needs to be better. The room
 * implements the solved half — a submerged hull displacing the surface as a
 * dome with heading-aligned laminar deflection, computed per vertex — and
 * leaves the unsolved half visible: the right-hand water sheet applies a
 * naive depth cut whose stair-stepped tear at grid resolution is counted, not
 * hidden. Read the tear as the backlog, not as a solved cut.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

const SEG = 56;

export const room: RoomDefinition = {
  sourceId: 4,
  skill: 'threejs-webgpu-water',
  title: 'Underwater hull, unsolved cut',
  summary: 'A submerged hull domes the water sheet on the left; the right sheet shows the naive waterline cut tearing by design.',
  kind: 'webgpu',
  limitation:
    'The waterline cut is shown FAILING on purpose and must not be read as solved. Dome and laminar terms are our own formulation; the author states cutting is unsolved upstream.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE, quality } = ctx;
    const seg = quality === 'low' ? 28 : SEG;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);

    interface Sheet {
      mesh: THREE.Mesh;
      rest: Float32Array;
      cut: boolean;
      tornCount: number;
    }
    const sheets: Sheet[] = [];

    for (const [h, ox] of [-3.4, 3.4].entries()) {
      const cut = h === 1;
      const geo = track(new THREE.PlaneGeometry(6.2, 11, seg, seg));
      geo.rotateX(-Math.PI / 2);
      const mat = track(new THREE.MeshStandardMaterial({
        color: cut ? 0x2e7f9e : 0x2a9ec9,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        emissive: cut ? 0x0a2a33 : 0x0a3340,
        emissiveIntensity: 0.5,
      }));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox, 1.35, 0.8);
      root.add(mesh);
      const pos = geo.getAttribute('position');
      sheets.push({ mesh, rest: new Float32Array(pos.array as Float32Array), cut, tornCount: 0 });
    }

    // Submerged hulls: dark red bodies running the length of each sheet.
    const hullGeo = track(new THREE.CapsuleGeometry(0.55, 3.4, 6, 12));
    for (const ox of [-3.4, 3.4]) {
      const hull = new THREE.Mesh(
        hullGeo,
        track(new THREE.MeshStandardMaterial({ color: 0x7a2e22, roughness: 0.6, metalness: 0.3 })),
      );
      hull.rotation.x = Math.PI / 2;
      hull.position.set(ox, 0.55, 0.8);
      root.add(hull);
      const fin = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.12, 1, 0.7)),
        hull.material as THREE.Material,
      );
      fin.position.set(ox, 1.1, -1.4);
      root.add(fin);
    }

    // Tear markers: glowing staples along the cut line where the naive cut tears.
    const tearMat = track(new THREE.MeshStandardMaterial({
      color: 0x1a0500, emissive: 0xff4d2a, emissiveIntensity: 2.4,
    }));
    const tearGeo = track(new THREE.BoxGeometry(0.22, 0.22, 0.5));
    const tears: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i += 1) {
      const tear = new THREE.Mesh(tearGeo, tearMat);
      tear.position.set(3.4 - 1.1 + (i % 4) * 0.7, 1.35, -2 + Math.floor(i / 4) * 4.5);
      root.add(tear);
      tears.push(tear);
    }

    const pos0 = sheets[0]?.mesh.geometry.getAttribute('position');
    const pos1 = sheets[1]?.mesh.geometry.getAttribute('position');

    return {
      root,
      update: (t) => {
        // Solved half: dome over the hull plus laminar deflection ahead of
        // travel, per vertex from hull position and heading (+Z).
        for (const sheet of sheets) {
          const pos = sheet.mesh.geometry.getAttribute('position');
          const rest = sheet.rest;
          let torn = 0;
          for (let v = 0; v < pos.count; v += 1) {
            const x = rest[v * 3]!;
            const z = rest[v * 3 + 2]!;
            // Dome: Gaussian displacement above the hull centreline.
            const dome = 0.42 * Math.exp(-(x * x) / 1.1) * Math.exp(-(z * z) / 14);
            // Laminar deflection: bow wave ahead of the stern, travelling aft.
            const bow = 0.16 * Math.exp(-((x - 0.6) * (x - 0.6)) / 0.5)
              * Math.sin(z * 1.4 - t * 2.2) * Math.exp(-Math.max(0, -z) / 6);
            let y = dome + bow + 0.03 * Math.sin(x * 2 + t * 1.6) * Math.sin(z * 1.2 + t);
            if (sheet.cut) {
              // Naive cut: quantise the surface where the hull nears it, which
              // tears at grid resolution instead of clipping. Count the damage.
              const near = Math.abs(x) < 0.9;
              if (near && y > 0.18) {
                y = Math.round(y / 0.12) * 0.12;
                torn += 1;
              }
            }
            pos.setY(v, y);
          }
          pos.needsUpdate = true;
          sheet.mesh.geometry.computeVertexNormals();
          sheet.tornCount = torn;
        }
        void pos0;
        void pos1;
        const pulse = 1.6 + Math.sin(t * 2.4) * 0.8;
        tearMat.emissiveIntensity = pulse;
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
