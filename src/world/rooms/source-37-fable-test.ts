import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 37 — fable-test: convention conversion at the ingest boundary, with
 * visible cache-build progress. Re-staged from `src/lab/demos/group-c/
 * source-37.ts`, whose maths is kept verbatim: the boundary converter below is
 * the demo's `convertZupCentimetres`, and the records are the same synthetic
 * shape. What changed is staging: the demo's 3.4 m panels become two
 * room-scale bays a visitor can stand between, with blocks up to 2.6 m tall so
 * the before half's wrongness reads from the doorway.
 *
 * BEFORE (left): source records fed straight in as if they were Y-up metres —
 * the level lies on its side at the wrong scale, floating and sunk by turns.
 * AFTER (right): the same records through the converter, revealed one by one
 * behind a progress fill, because a long prepare step with no progress reads
 * as a hang.
 */

type SourceRecord = {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
};

type ConvertedRecord = {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
};

/** Z-up centimetres to Y-up metres, in one place — the demo's converter. */
function convertZupCentimetres(record: SourceRecord): ConvertedRecord {
  const [x, y, z] = record.position;
  const [sx, sy, sz] = record.size;
  return {
    name: record.name,
    position: [x / 100, z / 100, -y / 100],
    size: [sx / 100, sz / 100, sy / 100],
  };
}

function makeRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export const room: RoomDefinition = {
  sourceId: 37,
  skill: 'unmapped',
  title: 'Z-up centimetres to Y-up metres',
  summary:
    'Upstream records arrive Z-up in centimetres; one boundary function converts them to Y-up metres while a visible cache build reveals each record.',
  kind: 'webgpu',
  limitation:
    'Records are generated from the seed; no commercial game data, format parser, streaming server or real cache build is present — the progress pass is a timer, so this shows the conversion and the UX contract, not at-scale scene streaming.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const low = ctx.quality === 'low';
    const root = new T.Group();
    root.name = 'source-37-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    // Synthetic upstream records in source units: Z-up, centimetres. Sizes
    // are grown for doorway legibility; the converter below is untouched, so
    // the demonstrated conversion is identical.
    const rng = makeRng(ctx.seed * 7 + 37);
    const records: SourceRecord[] = [];
    const count = low ? 6 : 9;
    for (let i = 0; i < count; i += 1) {
      const width = 90 + rng() * 110;
      const depth = 120 + rng() * 140;
      const height = 120 + rng() * 100;
      records.push({
        name: `block-${i}`,
        position: [-160 + rng() * 320, -160 + rng() * 320, height / 2],
        size: [width, depth, height],
      });
    }
    const converted = records.map(convertZupCentimetres);
    const bayX = 3.2;
    // Bays sit forward of centre: from the doorway the blocks read at 3–7 m.
    // The first staging at the back half read THIN; the middle read BELOW BAR.
    const bayZ = -1.8;
    const padGeo = track(new T.BoxGeometry(7.4, 0.12, 9.2));
    const padBeforeMat = track(new T.MeshStandardMaterial({ color: 0x4a3a36, roughness: 0.95 }));
    const padAfterMat = track(new T.MeshStandardMaterial({ color: 0x36444a, roughness: 0.95 }));
    for (const [side, mat] of [[-1, padBeforeMat], [1, padAfterMat]] as const) {
      const pad = new T.Mesh(padGeo, mat);
      pad.position.set(side * bayX, -0.06, bayZ);
      root.add(pad);
    }

    // BEFORE — records used raw: centimetres read as metres at display scale,
    // axes never swapped, so the plan position becomes height: blocks hover
    // and intersect instead of standing. The display spread is staging; the
    // missing axis swap is the technique's failure, unchanged in kind.
    const wrongMat = track(new T.MeshStandardMaterial({ color: 0x8c5a5a, roughness: 0.85 }));
    for (const record of records) {
      const mesh = new T.Mesh(
        track(
          new T.BoxGeometry(record.size[0] * 0.01, record.size[1] * 0.01, record.size[2] * 0.01),
        ),
        wrongMat,
      );
      mesh.position.set(
        -bayX + record.position[0] * 0.016,
        Math.max(0.05, record.position[1] * 0.016),
        bayZ + record.position[2] * 0.016,
      );
      root.add(mesh);
    }

    // AFTER — converted records, revealed in cache order.
    const rightMat = track(new T.MeshStandardMaterial({ color: 0x6f8ea0, roughness: 0.78 }));
    const cached: THREE.Mesh[] = [];
    for (const record of converted) {
      const mesh = new T.Mesh(
        track(new T.BoxGeometry(record.size[0], record.size[1], record.size[2])),
        rightMat,
      );
      mesh.position.set(
        bayX + record.position[0] * 1.3,
        Math.max(record.size[1] / 2, record.position[1]),
        bayZ + record.position[2] * 1.3,
      );
      mesh.visible = false;
      root.add(mesh);
      cached.push(mesh);
    }

    // Progress fill across the after bay: geometry, not DOM.
    const trackMesh = new T.Mesh(
      track(new T.BoxGeometry(4.4, 0.1, 0.12)),
      track(new T.MeshStandardMaterial({ color: 0x22262b, roughness: 1 })),
    );
    trackMesh.position.set(bayX, 0.35, bayZ - 2.2);
    root.add(trackMesh);
    const fill = new T.Mesh(
      track(new T.BoxGeometry(1, 0.14, 0.14)),
      track(
        new T.MeshStandardMaterial({ color: 0x74c69d, emissive: 0x1d3a2c, roughness: 0.5 }),
      ),
    );
    fill.position.set(bayX, 0.35, bayZ - 2.2);
    root.add(fill);

    const cacheSeconds = 3;
    let elapsed = 0;
    return {
      root,
      update: (_t: number, dt: number) => {
        elapsed = (elapsed + dt) % (cacheSeconds + 2);
        const progress = Math.min(1, elapsed / cacheSeconds);
        fill.scale.x = Math.max(0.0001, progress * 4.4);
        fill.position.x = bayX - 2.2 + (progress * 4.4) / 2;
        const done = Math.floor(progress * cached.length);
        for (let i = 0; i < cached.length; i += 1) cached[i].visible = i < done;
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
