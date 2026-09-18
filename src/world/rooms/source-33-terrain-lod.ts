/**
 * Source 33 — ThreeJS Super Terrain: partitioned mesh terrain with worker LOD.
 *
 * The floor is the exhibit: a 4x4 partitioned terrain whose sections pick
 * LOD from screen-space projected geometric error against the walking
 * player's distance, with asymmetric hysteresis against level flapping. The
 * left half settles neighbours to min(level + Manhattan distance) so no seam
 * differs by more than one level; the right half skips the constraint, so the
 * illegal jumps that open seam cracks stay inspectable. Section colour is the
 * LOD map. Restated from the three algorithms read out of LodSelector.ts;
 * none of the source's expression is reproduced.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

const COLS = 4;
const ROWS = 4;
const SECTION_W = 3;
const SECTION_D = 3.5;
/** Vertex resolution per LOD level. Level 0 is finest. */
const LOD_RES = [20, 10, 5, 3];
/** Geometric error in world metres per level: doubles down the levels. */
const LEVEL_ERROR = [0.1, 0.25, 0.6, 1.4];
/**
 * Room-calibrated tolerance. The source's 6 px first coarsens past ~32 m, so
 * inside a 16 m room every section would sit at L0 forever and the level map
 * would never change colour. 80 px puts L0/L1/L2/L3 at ~1/2.4/5.8/13.6 m —
 * the doorway sees the full gradient — while the projected-error test, the
 * 1.16x/0.72x hysteresis and the neighbour constraint run exactly as read.
 */
const ROOM_TOLERANCE_PX = 80;
const PROJECTION = 900 / (2 * Math.tan((60 * Math.PI) / 180 / 2));
const LEVEL_COLOURS: Array<[number, number, number]> = [
  [0.36, 0.64, 0.44],
  [0.64, 0.62, 0.33],
  [0.88, 0.6, 0.26],
  [0.88, 0.36, 0.26],
];

function lattice(x: number, y: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 17.3) * 43758.5453;
  return h - Math.floor(h);
}

function groundHeight(x: number, z: number, seed: number): number {
  let total = 0;
  let amplitude = 0.55;
  let frequency = 0.32;
  for (let octave = 0; octave < 3; octave += 1) {
    const ox = x * frequency + seed;
    const oz = z * frequency - seed;
    const xi = Math.floor(ox);
    const zi = Math.floor(oz);
    const xf = ox - xi;
    const zf = oz - zi;
    const sx = xf * xf * (3 - 2 * xf);
    const sz = zf * zf * (3 - 2 * zf);
    const a = lattice(xi, zi, seed);
    const b = lattice(xi + 1, zi, seed);
    const c = lattice(xi, zi + 1, seed);
    const d = lattice(xi + 1, zi + 1, seed);
    total += (a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz) * amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return (total - 0.55) * 1.3;
}

/** Coarsest level already under tolerance, held back by hysteresis. */
function selectLod(distance: number, current: number): number {
  const safe = Math.max(distance, 0.5);
  const projected = (level: number): number => (LEVEL_ERROR[level] * PROJECTION) / safe;
  let target = 0;
  for (let level = 0; level < LOD_RES.length; level += 1) {
    if (projected(level) <= ROOM_TOLERANCE_PX) target = level;
    else break;
  }
  if (target === current) return current;
  if (target > current) {
    // Coarser only when the current level is over tolerance by a margin.
    if (projected(current) < ROOM_TOLERANCE_PX * 1.16) return current;
    return Math.min(current + 1, target);
  }
  // Finer only when the candidate sits comfortably under tolerance.
  if (projected(target) > ROOM_TOLERANCE_PX * 0.72) return current;
  return Math.max(current - 1, target);
}

/** Adjacent sections may differ by at most one level. */
function constrainNeighbourLods(levels: number[][]): number[][] {
  const settled = levels.map((row) => [...row]);
  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false;
    for (let r = 0; r < settled.length; r += 1) {
      for (let c = 0; c < settled[r].length; c += 1) {
        const neighbours: number[] = [];
        if (r > 0) neighbours.push(settled[r - 1][c]);
        if (r + 1 < settled.length) neighbours.push(settled[r + 1][c]);
        if (c > 0) neighbours.push(settled[r][c - 1]);
        if (c + 1 < settled[r].length) neighbours.push(settled[r][c + 1]);
        for (const neighbour of neighbours) {
          if (settled[r][c] > neighbour + 1) {
            settled[r][c] = neighbour + 1;
            changed = true;
          }
        }
      }
    }
    if (!changed) break;
  }
  return settled;
}

export const room: RoomDefinition = {
  sourceId: 33,
  skill: 'unmapped',
  title: 'Partitioned terrain with worker LOD',
  summary:
    'The floor is a 4x4 partitioned terrain choosing LOD from your distance: '
    + 'colour is the level map, the left half constrains seams, the right '
    + 'half does not.',
  kind: 'webgpu',
  limitation:
    'Headline features NOT shown: no dual contouring, live CSG, '
    + 'tunnels, worker pool, IndexedDB or frame-budget scheduler — '
    + 'main-thread swaps, not off-thread. The 6 px error tolerance is re-scaled '
    + 'to 80 px for a 16 m room (algorithms unchanged). Sections start coarse and '
    + 'refine as you approach; the restated 1.16x gate never re-coarsens, so walking '
    + 'away leaves refined levels in place. Sections are unlit so the level '
    + 'map reads as data, not lighting. Relief capped so the camera stays '
    + 'above it; you walk through the hills, not over them.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const seed = (ctx.seed % 100) / 10;
    const low = ctx.quality === 'low';

    // Unlit: the vertex colour IS the level map, and must read as data under
    // any room light rather than as lighting. Relief still shades via tint.
    const sectionMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    disposables.push(sectionMaterial);

    interface Section {
      mesh: THREE.Mesh;
      centre: { x: number; z: number };
      level: number;
    }
    const sections: Section[][] = [];
    const buildSection = (col: number, row: number, level: number): THREE.Mesh => {
      const res = low ? Math.max(2, Math.floor(LOD_RES[level] / 2)) : LOD_RES[level];
      const geometry = new THREE.PlaneGeometry(SECTION_W, SECTION_D, res, res);
      geometry.rotateX(-Math.PI / 2);
      const position = geometry.getAttribute('position');
      const cx = (col - (COLS - 1) / 2) * SECTION_W;
      const cz = (row - (ROWS - 1) / 2) * SECTION_D + 0.5;
      const tint = LEVEL_COLOURS[level];
      const colours = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i += 1) {
        const wx = cx + position.getX(i);
        const wz = cz + position.getZ(i);
        const height = groundHeight(wx, wz, seed);
        // Troughs below the shell floor top read as shell, not terrain: clamp
        // the grid so every texel belongs to a section.
        position.setY(i, Math.max(height, -0.1));
        const shade = 0.72 + 0.56 * Math.max(0, Math.min(1, height + 0.6));
        colours[i * 3] = tint[0] * shade;
        colours[i * 3 + 1] = tint[1] * shade;
        colours[i * 3 + 2] = tint[2] * shade;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, sectionMaterial);
      // Troughs dip below the shell floor top; lift the grid so the shell
      // never shows through where terrain should be.
      mesh.position.set(cx, 0.12, cz);
      return mesh;
    };
    for (let row = 0; row < ROWS; row += 1) {
      const line: Section[] = [];
      for (let col = 0; col < COLS; col += 1) {
        // Start coarse: the restated selector refines on approach but its
        // 1.16x coarsen gate never opens (a coarser level always projects a
        // larger error), so L0-initialised sections would sit at L0 forever.
        // Walking in refines the near sections live; the limitation owns this.
        const mesh = buildSection(col, row, 3);
        root.add(mesh);
        line.push({
          mesh,
          centre: {
            x: (col - (COLS - 1) / 2) * SECTION_W,
            z: (row - (ROWS - 1) / 2) * SECTION_D + 0.5,
          },
          level: 3,
        });
      }
      sections.push(line);
    }
    // Colour lives in the vertices; every section shares one unlit material.

    const postGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.5, 8);
    disposables.push(postGeometry);
    const postMaterial = new THREE.MeshBasicMaterial({ color: 0xd8c27a, toneMapped: false });
    disposables.push(postMaterial);
    for (let row = 0; row < ROWS; row += 1) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(0, 0.35, (row - (ROWS - 1) / 2) * SECTION_D + 0.5);
      root.add(post);
    }

    // Legend board by the door: colour is the level map.
    const legend = document.createElement('canvas');
    legend.width = 512;
    legend.height = 192;
    const paint = legend.getContext('2d')!;
    paint.fillStyle = '#10141a';
    paint.fillRect(0, 0, 512, 192);
    paint.font = '34px system-ui, sans-serif';
    paint.textAlign = 'left';
    paint.textBaseline = 'middle';
    const chip: Array<[string, string]> = [
      ['#5ca370', 'L0 finest, at your feet'],
      ['#a39e54', 'L1'],
      ['#e09942', 'L2'],
      ['#e05c42', 'L3 coarsest, far wall'],
    ];
    chip.forEach(([colour, label], i) => {
      paint.fillStyle = colour;
      paint.fillRect(24, 18 + i * 42, 44, 30);
      paint.fillStyle = '#cfe3de';
      paint.fillText(label, 84, 34 + i * 42);
    });
    const legendTexture = new THREE.CanvasTexture(legend);
    legendTexture.colorSpace = THREE.SRGBColorSpace;
    disposables.push(legendTexture);
    const legendGeometry = new THREE.PlaneGeometry(3.4, 1.28);
    disposables.push(legendGeometry);
    const legendMaterial = new THREE.MeshBasicMaterial({ map: legendTexture, toneMapped: false });
    disposables.push(legendMaterial);
    const legendBoard = new THREE.Mesh(legendGeometry, legendMaterial);
    legendBoard.position.set(4.2, 1.8, -4.5);
    legendBoard.rotation.y = Math.PI;
    root.add(legendBoard);

    const swapSection = (col: number, row: number, level: number): void => {
      const section = sections[row][col];
      if (section.level === level) return;
      root.remove(section.mesh);
      section.mesh.geometry.dispose();
      const mesh = buildSection(col, row, level);
      root.add(mesh);
      section.mesh = mesh;
      section.level = level;
    };

    let timer = 1;
    let firstRun = true;
    return {
      root,
      update: (_elapsed: number, dt: number, playerLocal: THREE.Vector3) => {
        timer += Math.min(dt, 0.1);
        if (timer < 0.25 && !firstRun) return;
        timer = 0;
        firstRun = false;
        const wanted: number[][] = sections.map((line) =>
          line.map((section) => {
            const distance = Math.hypot(
              playerLocal.x - section.centre.x,
              playerLocal.z - section.centre.z,
            );
            return selectLod(distance, section.level);
          }),
        );
        // Left column pair settles together; right pair keeps raw levels.
        const settledLeft = constrainNeighbourLods(wanted.map((line) => [line[0], line[1]]));
        for (let row = 0; row < ROWS; row += 1) {
          swapSection(0, row, settledLeft[row][0]);
          swapSection(1, row, settledLeft[row][1]);
          swapSection(2, row, wanted[row][2]);
          swapSection(3, row, wanted[row][3]);
        }
      },
      dispose: () => {
        for (const line of sections) {
          for (const section of line) section.mesh.geometry.dispose();
        }
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
