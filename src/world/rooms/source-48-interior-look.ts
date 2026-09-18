import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 48 — the dark-interior look bought with no lighting technology.
 * Re-staged from `src/lab/demos/group-c/source-48.ts`, keeping its recipe:
 * repetitive human-scale architecture, a narrow desaturated value band,
 * emissive fixtures, exactly two short-range lights on visible fixtures only,
 * per-vertex distance darkening, flat matte grime, a mote field biased to the
 * lit end, and exactly one travelling exposure event. What changed is address:
 * the demo's 7 m tabletop corridors become two walk-between half-corridors,
 * 5.6 m wide and 12 m long, so a visitor in the doorway stands between the
 * flat-lit failure (left) and the graded look (right) at full height.
 *
 * The far end is dark because nothing lights it — not a vignette, not a
 * lowered bloom threshold. This room owns no post chain, so the halo and the
 * filmic grade stay absent and the limitation says so.
 */

const LENGTH = 12;
const WIDTH = 5.6;
const HEIGHT = 3.4;

/** Distance darkening to near-black by 86% of the corridor. Local, never fog. */
function depthFactor(z: number): number {
  const f = 1 - (z + LENGTH / 2) / (LENGTH * 0.86);
  return Math.min(1, Math.max(0.04, f));
}

/** Deterministic blotch field in [0, 1). */
function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

/** Flat, matte, non-reflective grime: stains and damp, no gloss. */
function grime(x: number, y: number, z: number): number {
  const blotch = hash3(Math.floor(x * 2.1), Math.floor(y * 2.1), Math.floor(z * 2.1));
  const fine = hash3(Math.floor(x * 7.7 + 3), Math.floor(y * 7.7), Math.floor(z * 7.7));
  return 1 - (blotch > 0.72 ? 0.28 : 0) - fine * 0.12;
}

export const room: RoomDefinition = {
  sourceId: 48,
  skill: 'threejs-webgpu-interior-lighting-look',
  title: 'Dark interior without lighting tech',
  summary:
    'The dark-interior look from value composition: emissive fixtures, a restrained palette, distance darkening, matte grime, motes and one exposure event.',
  kind: 'webgpu',
  limitation:
    'No post chain here, so the bloom halo and filmic grade that carry the look in the shipped renderer are absent; distance darkening is baked per vertex, and readability parity is unmeasured. Interiors still need real gameplay lights.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const low = ctx.quality === 'low';
    const root = new T.Group();
    root.name = 'source-48-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    const halfX = 3.05;
    const centreZ = 0.5;
    const localLights: string[] = [];

    function paint(geometry: THREE.BufferGeometry, graded: boolean, base: [number, number, number]): void {
      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      const colours = new Float32Array(positions.count * 3);
      const v = new T.Vector3();
      for (let i = 0; i < positions.count; i += 1) {
        v.fromBufferAttribute(positions, i);
        if (graded) {
          const fade = depthFactor(v.z);
          const dirt = grime(v.x, v.y, v.z);
          const level = base[1] * dirt * fade;
          colours[i * 3] = level * 0.92;
          colours[i * 3 + 1] = level;
          colours[i * 3 + 2] = level * 0.94;
        } else {
          // The world lamp overhead is strong (roughly 4x on these surfaces);
          // 0.33 still clips to white. 0.16 lands mid grey under this rig.
          colours[i * 3] = 0.16;
          colours[i * 3 + 1] = 0.16;
          colours[i * 3 + 2] = 0.17;
        }
      }
      geometry.setAttribute('color', new T.BufferAttribute(colours, 3));
    }

    const columnGeo = track(new T.BoxGeometry(0.32, HEIGHT, 0.32));
    const fixtureGeo = track(new T.BoxGeometry(1.0, 0.08, 0.18));
    const accentGeo = track(new T.BoxGeometry(0.18, 0.56, 0.06));
    const patchGeo = track(new T.CircleGeometry(0.52, 12));
    patchGeo.rotateX(-Math.PI / 2);

    function buildHalf(centreX: number, graded: boolean): THREE.Group {
      const group = new T.Group();
      const surfaces: Array<{ name: string; geometry: THREE.BufferGeometry; base: [number, number, number] }> = [];

      const floor = new T.PlaneGeometry(WIDTH, LENGTH, 6, 40);
      floor.rotateX(-Math.PI / 2);
      surfaces.push({ name: 'floor', geometry: floor, base: [0.3, 0.31, 0.3] });

      for (const side of [-1, 1]) {
        const wall = new T.PlaneGeometry(LENGTH, HEIGHT, 40, 6);
        wall.rotateY((side * Math.PI) / 2);
        wall.translate((side * WIDTH) / 2, HEIGHT / 2, 0);
        surfaces.push({ name: `wall${side}`, geometry: wall, base: [0.33, 0.34, 0.33] });
      }
      const ceiling = new T.PlaneGeometry(WIDTH, LENGTH, 6, 40);
      ceiling.rotateX(Math.PI / 2);
      ceiling.translate(0, HEIGHT, 0);
      surfaces.push({ name: 'ceiling', geometry: ceiling, base: [0.26, 0.27, 0.27] });

      for (const surface of surfaces) {
        paint(surface.geometry, graded, surface.base);
        track(surface.geometry);
        const mesh = new T.Mesh(
          surface.geometry,
          track(
            new T.MeshStandardMaterial({
              vertexColors: true,
              roughness: graded ? 0.97 : 0.75,
              side: T.DoubleSide,
            }),
          ),
        );
        mesh.name = surface.name;
        group.add(mesh);
      }

      // Columns on a regular pitch — the repetition that reads as built. The
      // flat half sits dark, not pale: pale blows out under the lamp.
      const columnMat = track(
        new T.MeshStandardMaterial({ color: graded ? 0x2b2e2c : 0x3a3d3f, roughness: 0.95 }),
      );
      const pitches = low ? 2 : 3;
      for (let i = 0; i < pitches; i += 1) {
        const z = -LENGTH / 2 + 1.6 + i * ((LENGTH - 3.2) / Math.max(1, pitches - 1));
        for (const side of [-1, 1]) {
          const column = new T.Mesh(columnGeo, columnMat);
          column.position.set(side * (WIDTH / 2 - 0.28), HEIGHT / 2, z);
          group.add(column);
        }
      }

      // Emissive fixture bars, near end only. The far end is not lit at all —
      // that absence is where the darkness comes from.
      const fixtureMat = track(
        new T.MeshStandardMaterial({
          color: 0x000000,
          emissive: graded ? 0xffe899 : 0x8a8a80,
          emissiveIntensity: graded ? 2.5 : 0.4,
          roughness: 0.4,
        }),
      );
      for (let i = 0; i < 2; i += 1) {
        const fixture = new T.Mesh(fixtureGeo, fixtureMat);
        fixture.position.set(0, HEIGHT - 0.1, -LENGTH / 2 + 2.0 + i * 3.0);
        group.add(fixture);
        // A few real lights only, and only at VISIBLE fixtures.
        if (graded) {
          const light = new T.PointLight(0xffe2a8, 40, 7, 2);
          light.name = `fixture-local-${i}`;
          light.position.set(0, HEIGHT - 0.35, -LENGTH / 2 + 2.0 + i * 3.0);
          group.add(light);
          localLights.push(light.name);
        }
      }

      if (graded) {
        // Three small saturated accents against the grey.
        const accentMat = track(
          new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xd23b2a, emissiveIntensity: 1.1, roughness: 0.6 }),
        );
        for (let i = 0; i < 3; i += 1) {
          const accent = new T.Mesh(accentGeo, accentMat);
          accent.position.set(
            (i % 2 === 0 ? -1 : 1) * (WIDTH / 2 - 0.08),
            1.4,
            -LENGTH / 2 + 2.8 + i * 3.2,
          );
          group.add(accent);
        }
        // Flat matte wet patches. Dark, hard-edged, no reflection at all.
        const patchMat = track(new T.MeshStandardMaterial({ color: 0x14100d, roughness: 1 }));
        const patchCount = low ? 2 : 4;
        for (let i = 0; i < patchCount; i += 1) {
          const patch = new T.Mesh(patchGeo, patchMat);
          patch.position.set(
            (hash3(i, 1, 7) - 0.5) * (WIDTH - 1),
            0.02,
            -LENGTH / 2 + 2.0 + i * 2.6,
          );
          patch.scale.setScalar(0.7 + hash3(i, 2, 9) * 0.5);
          group.add(patch);
        }
      }

      group.position.set(centreX, 0, centreZ);
      return group;
    }

    const before = buildHalf(-halfX, false);
    before.name = 'before:flat-even-light';
    const after = buildHalf(halfX, true);
    after.name = 'after:value-composition-no-gi';
    root.add(before, after);

    // Mote field over the graded half, densest inside the lit volume.
    const moteCount = low ? 60 : 130;
    const motePositions = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i += 1) {
      const bias = hash3(i, 3, 3) ** 1.8;
      motePositions[i * 3] = halfX + (hash3(i, 7, 7) - 0.5) * (WIDTH - 0.4);
      motePositions[i * 3 + 1] = 0.3 + hash3(i, 11, 11) * (HEIGHT - 0.6);
      motePositions[i * 3 + 2] = centreZ - LENGTH / 2 + bias * LENGTH * 0.55;
    }
    const moteGeo = track(new T.BufferGeometry());
    moteGeo.setAttribute('position', new T.BufferAttribute(motePositions, 3));
    const motes = new T.Points(
      moteGeo,
      track(
        new T.PointsMaterial({ color: 0xdcd6c4, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.5 }),
      ),
    );
    motes.name = 'mote-field';
    root.add(motes);

    // Exactly ONE exposure event: a single bright emissive travelling the dark
    // far end toward the lit near end.
    const exposureMat = track(
      new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xfff4d8, emissiveIntensity: 6, roughness: 0.3 }),
    );
    const exposure = new T.Mesh(track(new T.BoxGeometry(0.68, 0.44, 0.12)), exposureMat);
    exposure.name = 'exposure-event';
    exposure.position.set(halfX, 1.5, centreZ + LENGTH / 2);
    root.add(exposure);

    let elapsed = 0;
    return {
      root,
      update: (_t: number, dt: number) => {
        elapsed += dt;
        const cycle = (elapsed % 9) / 9;
        exposure.position.z = centreZ + LENGTH / 2 - cycle * LENGTH;
        const near = Math.max(0, 1 - Math.abs(exposure.position.z - (centreZ - LENGTH / 4)) / 4.4);
        exposureMat.emissiveIntensity = 2 + near * 9;
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
