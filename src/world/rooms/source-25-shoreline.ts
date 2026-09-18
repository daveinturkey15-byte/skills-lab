/**
 * Room for source 25 — Browser water with shoreline waves and blending (VOIDMODE).
 *
 * Honest stub, by catalogue design. The technique is unreleased: there is no
 * public source, no library and no pin to adopt, so there is nothing a browser
 * room could show without inventing the author's method. The door stays, and
 * the wall card carries the blocker, because a labelled gap beats a fake demo.
 */
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 25,
  skill: 'threejs-webgpu-water',
  title: 'Shoreline water (unreleased)',
  summary: 'The shoreline technique this door names is unreleased, so this room is empty on purpose.',
  kind: 'stub',
  limitation:
    'Blocked: no published implementation exists to demonstrate. The register keeps only a ' +
    'transferable note (shelving seabed, wading depth, depth-responsive foam), which is not ' +
    'this source’s method and is not built here.',
};
