/**
 * src/world/layout.ts — where every door and room sits. Pure maths, no Three.js.
 *
 * Kept separate and side-effect free so the layout can be reasoned about and
 * checked without a GPU, and so a build lane can read exactly where its room is
 * without reading the renderer.
 *
 * SHAPE. A central atrium with four wings leading off it, doors down both sides
 * of each wing. Not a ring and not an open field.
 *
 * The open field is what the owner rejected: "I don't really like the idea of it
 * all being outside, and I can just see everything on one screen. It's a bit
 * busy and messy." A ring was the other candidate and is worse than it sounds —
 * sixty doors on one curve gives you no landmarks, so every part of it looks
 * like every other part. Four wings give four headings, a short walk to any
 * door, and a natural grouping: a wing per family of skills.
 */

export type WingId = 'north' | 'east' | 'south' | 'west';

export const WINGS: readonly WingId[] = ['north', 'east', 'south', 'west'];

/** Atrium is square; wings leave from the middle of each side. */
export const ATRIUM_HALF = 11;
export const WING_WIDTH = 9;
/**
 * Along-wing distance between door centres.
 *
 * This MUST exceed ROOM_WIDTH or consecutive rooms on the same side of a wing
 * occupy the same space. At 7 against a 14m room every room overlapped its
 * neighbour by half — the walls still drew, so it looked plausible from inside
 * one room and was only obvious from a plan view.
 */
export const DOOR_PITCH = 17;
/** First door starts this far down the wing, clear of the atrium corner. */
export const WING_START = 9;
export const DOOR_WIDTH = 3.2;
export const DOOR_HEIGHT = 3.0;
export const WALL_HEIGHT = 6;
export const ROOM_WIDTH = 14;
export const ROOM_DEPTH = 16;
/** Gap between the wing's outer wall and the room's near wall. */
export const VESTIBULE = 2.5;

export interface DoorSlot {
  index: number;
  wing: WingId;
  /** -1 = left-hand side of the wing looking outward, +1 = right. */
  side: -1 | 1;
  /** Door centre, on the wing wall. */
  door: { x: number; z: number };
  /** Room centre. */
  room: { x: number; z: number };
  /** Yaw, radians, that faces a player from the room back towards the door. */
  facing: number;
  /** Where the player arrives when entering. */
  spawn: { x: number; z: number };
}

/** Unit vector pointing down each wing, away from the atrium. */
function wingAxis(wing: WingId): { ax: number; az: number } {
  switch (wing) {
    case 'north': return { ax: 0, az: -1 };
    case 'south': return { ax: 0, az: 1 };
    case 'east': return { ax: 1, az: 0 };
    case 'west': return { ax: -1, az: 0 };
  }
}

/**
 * Deal `count` rooms across the four wings, filling a rank of four (one per
 * wing, one side) before moving outward. That keeps all four wings the same
 * length instead of one long wing and three stubs, and it means the first
 * doors a player meets are spread across every heading.
 */
export function planDoors(count: number): DoorSlot[] {
  const slots: DoorSlot[] = [];
  for (let i = 0; i < count; i += 1) {
    const wing = WINGS[i % 4]!;
    const rank = Math.floor(i / 4);
    const side: -1 | 1 = rank % 2 === 0 ? -1 : 1;
    const depthIndex = Math.floor(rank / 2);
    const along = WING_START + depthIndex * DOOR_PITCH;

    const { ax, az } = wingAxis(wing);
    // Perpendicular to the wing axis, in the XZ plane.
    const px = -az;
    const pz = ax;

    const doorX = ax * along + px * side * (WING_WIDTH / 2);
    const doorZ = az * along + pz * side * (WING_WIDTH / 2);
    const out = VESTIBULE + ROOM_DEPTH / 2;
    const roomX = doorX + px * side * out;
    const roomZ = doorZ + pz * side * out;

    slots.push({
      index: i,
      wing,
      side,
      door: { x: doorX, z: doorZ },
      room: { x: roomX, z: roomZ },
      // Face back down the entry direction, i.e. towards the door.
      facing: Math.atan2(-px * side, -pz * side),
      spawn: { x: doorX + px * side * (VESTIBULE + 1.5), z: doorZ + pz * side * (VESTIBULE + 1.5) },
    });
  }
  return slots;
}

/** How far down a wing its doors reach — used to size the wing walls. */
export function wingLength(count: number, wing: WingId): number {
  const indices = [];
  for (let i = 0; i < count; i += 1) if (WINGS[i % 4] === wing) indices.push(i);
  if (indices.length === 0) return WING_START;
  const deepest = Math.floor(Math.floor((indices.length - 1) * 4 / 4) / 2);
  return WING_START + deepest * DOOR_PITCH + DOOR_PITCH;
}
