/**
 * src/world/contract.ts — the frozen contract between the world and its rooms.
 *
 * The world is a hub you walk around with ~50 doors in it. Behind each door is a
 * room, and each room demonstrates exactly one skill. You should be able to open
 * a door, walk in, and see the technique working in front of you — not read
 * about it on a card.
 *
 * This file is what parallel build lanes program against. It is deliberately
 * tiny and it does not change once lanes are running: a room author needs to
 * know only what space they have, what they get handed, and what they must give
 * back.
 *
 * ROOMS NEVER IMPORT EACH OTHER. Everything a room needs arrives on its context.
 * That is the single rule that makes many authors safe to run at once.
 */
import type * as THREE from 'three';

/** Interior of a room, in metres. Build inside this; the shell is not yours. */
export interface RoomBounds {
  /** X extent, wall to wall. */
  width: number;
  /** Z extent, door wall to back wall. The door is at -depth/2. */
  depth: number;
  /** Floor to ceiling. */
  height: number;
}

export interface RoomContext {
  /** The three namespace, so a room never imports a second copy. */
  THREE: typeof import('three');
  /** Deterministic seed. Two visits to a room must look identical. */
  seed: number;
  bounds: RoomBounds;
  /**
   * Quality budget the world is currently running at. A room that cannot hold
   * 60fps at `high` should scale itself down rather than dropping the world's
   * frame rate, because the player is *walking* — a stutter is felt here in a
   * way it is not in a gallery.
   */
  quality: 'low' | 'medium' | 'high';
}

export interface RoomInstance {
  /**
   * Room contents. Placed at the room's origin with the floor at y = 0 and the
   * door in the -Z wall, so a room can be authored as if it were the only thing
   * that existed.
   */
  root: THREE.Group;
  /** Called once per frame while the player is inside or adjacent. */
  update?: (elapsed: number, dt: number, playerLocal: THREE.Vector3) => void;
  /** Release every geometry, material and texture. Rooms are streamed. */
  dispose: () => void;
}

/**
 * Where a technique actually lives. Not everything worth showing runs in a
 * browser, and pretending otherwise is how a showcase starts lying.
 */
export type RoomKind =
  /** Built here, in Three.js/WebGPU. Walk in and it is running. */
  | 'webgpu'
  /** Runs outside the browser (Unreal, ComfyUI, Blender, a local model). The
   *  room explains it and offers a launcher; the world never claims it is
   *  running in-browser. */
  | 'external'
  /** Nothing is demonstrable yet and the room says so plainly. A door that
   *  opens onto an honest empty room is worth more than no door. */
  | 'stub';

export interface RoomLauncher {
  /** Button text, e.g. "Launch the UE5 importer". */
  label: string;
  /** Script this boots, relative to the repository root. */
  script: string;
  /** What it will do, what it needs installed, what it costs. */
  note: string;
}

/**
 * Where a technique is most fully itself.
 *
 * Not everything is a spatial thing. Water, clouds, foliage, a street cell and a
 * lighting look all want a room you can stand in. But a catalogue format, a
 * licence comparison, a QA harness or a set of measured findings is a
 * *document*, and building a token 3D prop for it makes the world worse and the
 * technique less legible, not more.
 *
 * `world`   — belongs in Map 3. Walk in and it is running.
 * `browser` — belongs in the Atlas, where it can be read, searched and clicked.
 *             Its Map 3 door still exists and still opens: the room presents the
 *             artifact at wall scale and points at the interactive version.
 *             Present in both, but authoritative in the one that suits it.
 */
export type RoomVenue = 'world' | 'browser';

export interface RoomDefinition {
  /** Catalogue source this room demonstrates; links the world to the evidence. */
  sourceId: number;
  /** Defaults to 'world'. Set 'browser' only for genuinely document-shaped techniques. */
  venue?: RoomVenue;
  /** The skill on the door. This is the whole point of the room. */
  skill: string;
  /** Door plate text. Short — it is read at walking pace. */
  title: string;
  /** One sentence, on the wall inside: what you are looking at. */
  summary: string;
  kind: RoomKind;
  launcher?: RoomLauncher;
  /** Absent for `external` and `stub` rooms. */
  create?: (ctx: RoomContext) => RoomInstance;
  /**
   * What this room does NOT prove. Shown inside, always. A showcase that only
   * shows its wins is a brochure.
   */
  limitation?: string;
}

/** Default interior. Big enough to walk around a subject, small enough to read. */
export const DEFAULT_BOUNDS: RoomBounds = Object.freeze({ width: 14, depth: 16, height: 6 });
