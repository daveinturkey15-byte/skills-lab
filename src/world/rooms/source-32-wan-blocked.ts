/**
 * Source 32 — WAN 2.2 local text-to-video and image-to-video.
 *
 * Honest stub: the catalogue records this row as blocked (weights unpinned,
 * licence unverified against the weights, no GPU generation this lane may
 * run), so there is no artefact to stand in the room. The door and the wall
 * card carry the blocker reason instead of a faked cinema.
 */
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 32,
  skill: 'local-video-generation',
  title: 'WAN 2.2 local video generation',
  summary: 'Blocked: local video diffusion this room cannot run without pinned weights and a GPU generation.',
  kind: 'stub',
  limitation: 'Weights not pinned and the Apache 2.0 claim unverified against the weights; no video is generated or implied here.',
};
