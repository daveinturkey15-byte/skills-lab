/**
 * Source 40 — emissive windows derived from voxel topology (zero lights).
 *
 * Restages the group-c voxel demo at room scale. The technique is one query
 * restated from the author's description: a cell emits only where it is hollow
 * and solid material still stands above it, recomputed from the live voxel
 * grid. BEFORE keeps an authored window list and keeps glowing through
 * destruction; AFTER re-runs the query so the same carve puts the lights out.
 * Both halves use no lights at all — glow is emissive instance colour. Both
 * towers stand just inside the door so the amber windows read on entry.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

const GRID_X = 6;
const GRID_Y = 9;
const GRID_Z = 6;
const CELL = 0.6;

interface VoxelGrid { solid: Uint8Array; sizeX: number; sizeY: number; sizeZ: number }

function voxelIndex(grid: VoxelGrid, x: number, y: number, z: number): number {
  return (y * grid.sizeZ + z) * grid.sizeX + x;
}

function isSolid(grid: VoxelGrid, x: number, y: number, z: number): boolean {
  if (x < 0 || y < 0 || z < 0 || x >= grid.sizeX || y >= grid.sizeY || z >= grid.sizeZ) return false;
  return grid.solid[voxelIndex(grid, x, y, z)] === 1;
}

/** A cell emits iff hollow with solid still above it, on the visible shell. */
function litRoomCells(grid: VoxelGrid): Array<[number, number, number]> {
  const lit: Array<[number, number, number]> = [];
  for (let y = 0; y < grid.sizeY; y += 1) {
    for (let z = 0; z < grid.sizeZ; z += 1) {
      for (let x = 0; x < grid.sizeX; x += 1) {
        if (isSolid(grid, x, y, z)) continue;
        let ceiling = false;
        for (let above = y + 1; above < grid.sizeY; above += 1) {
          if (isSolid(grid, x, above, z)) { ceiling = true; break; }
        }
        if (!ceiling) continue;
        if (x === 0 || z === 0 || x === grid.sizeX - 1 || z === grid.sizeZ - 1) lit.push([x, y, z]);
      }
    }
  }
  return lit;
}

function buildGrid(): VoxelGrid {
  const grid: VoxelGrid = {
    solid: new Uint8Array(GRID_X * GRID_Y * GRID_Z), sizeX: GRID_X, sizeY: GRID_Y, sizeZ: GRID_Z,
  };
  for (let y = 0; y < GRID_Y; y += 1) {
    for (let z = 0; z < GRID_Z; z += 1) {
      for (let x = 0; x < GRID_X; x += 1) {
        const shell = x === 0 || z === 0 || x === GRID_X - 1 || z === GRID_Z - 1;
        const solid = shell ? y % 3 !== 1 : y % 3 === 0;
        grid.solid[voxelIndex(grid, x, y, z)] = solid ? 1 : 0;
      }
    }
  }
  return grid;
}

export const room: RoomDefinition = {
  sourceId: 40,
  skill: 'atomic-acres-destructible-world',
  title: 'Windows computed from voxels',
  summary: 'Two voxel towers take ceiling hits; one keeps glowing from a stale list, the other goes dark because the glow is recomputed.',
  kind: 'webgpu',
  limitation:
    'Atom 1 only: destruction is a scripted carve on a timer, NOT emergent structural failure, and the amortised self-collision atom is absent. Commercial game, descriptions only — nothing copied.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);

    const grid = buildGrid();
    const maxCells = GRID_X * GRID_Y * GRID_Z;
    const matrix = new THREE.Matrix4();

    const structureGeo = track(new THREE.BoxGeometry(CELL, CELL, CELL));
    const structureMat = track(new THREE.MeshStandardMaterial({
      color: 0x6b7684, roughness: 0.85,
      emissive: 0x6b7684, emissiveIntensity: 0.12,
    }));
    const windowGeo = track(new THREE.BoxGeometry(CELL * 0.62, CELL * 0.62, CELL * 0.62));

    interface Tower {
      group: THREE.Group;
      structure: THREE.InstancedMesh;
      windows: THREE.InstancedMesh;
    }
    const towers: Tower[] = [];
    for (const ox of [-2.9, 2.9]) {
      const group = new THREE.Group();
      group.position.set(ox, 0.55, 0.5);
      const plinth = new THREE.Mesh(
        track(new THREE.BoxGeometry(4.8, 0.55, 4.8)),
        track(new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.9 })),
      );
      plinth.position.y = -0.28;
      group.add(plinth);
      const structure = new THREE.InstancedMesh(structureGeo, structureMat, maxCells);
      structure.count = 0;
      structure.frustumCulled = false;
      group.add(structure);
      const windows = new THREE.InstancedMesh(
        windowGeo,
        track(new THREE.MeshStandardMaterial({
          color: 0x000000, emissive: 0xffb24d, emissiveIntensity: 2.2, roughness: 0.4,
        })),
        maxCells,
      );
      windows.count = 0;
      windows.frustumCulled = false;
      group.add(windows);
      root.add(group);
      towers.push({ group, structure, windows });
    }

    const place = (x: number, y: number, z: number): void => {
      matrix.makeTranslation(
        (x - (GRID_X - 1) / 2) * CELL,
        y * CELL + CELL / 2,
        (z - (GRID_Z - 1) / 2) * CELL,
      );
    };

    const writeStructure = (tower: Tower): void => {
      let count = 0;
      for (let y = 0; y < GRID_Y; y += 1) {
        for (let z = 0; z < GRID_Z; z += 1) {
          for (let x = 0; x < GRID_X; x += 1) {
            if (!isSolid(grid, x, y, z)) continue;
            place(x, y, z);
            tower.structure.setMatrixAt(count, matrix);
            count += 1;
          }
        }
      }
      tower.structure.count = count;
      tower.structure.instanceMatrix.needsUpdate = true;
    };

    const writeWindows = (tower: Tower, cells: Array<[number, number, number]>): void => {
      cells.forEach((cell, i) => {
        place(cell[0], cell[1], cell[2]);
        tower.windows.setMatrixAt(i, matrix);
      });
      tower.windows.count = cells.length;
      tower.windows.instanceMatrix.needsUpdate = true;
    };

    const authored = litRoomCells(grid);
    for (const tower of towers) {
      writeStructure(tower);
      writeWindows(tower, authored);
    }

    let elapsed = 0;
    let carved = 0;
    const COLUMNS = GRID_X * GRID_Z;
    const CARVE_INTERVAL = 0.55;

    return {
      root,
      update: (_t, dt) => {
        elapsed += Math.min(dt, 0.05);
        const wanted = Math.floor(elapsed / CARVE_INTERVAL);
        if (wanted === carved) return;
        if (wanted > COLUMNS) {
          elapsed = 0;
          carved = 0;
          grid.solid.set(buildGrid().solid);
        } else {
          while (carved < wanted) {
            const x = carved % GRID_X;
            const z = Math.floor(carved / GRID_X) % GRID_Z;
            for (let y = GRID_Y - 1; y >= GRID_Y - 4; y -= 1) {
              grid.solid[voxelIndex(grid, x, y, z)] = 0;
            }
            carved += 1;
          }
        }
        // BEFORE: structure follows the carve, the authored list does not.
        const before = towers[0];
        const after = towers[1];
        if (before && after) {
          writeStructure(before);
          writeStructure(after);
          writeWindows(after, litRoomCells(grid));
        }
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
