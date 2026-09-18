import type { RoomDefinition } from '../contract';

/**
 * Source 30 — generated video as MOTION REFERENCE, not as the asset.
 *
 * Stub by honesty. The technique is a bridge — describe a motion, generate a
 * reference video, reconstruct or author pose from it, retarget onto our own
 * rig, ship only rig data — and its first step is a GPU video generation this
 * lane may not run, backed by a pose-reconstruction route equally out of
 * scope. A rig-retarget scene without the reference video would demonstrate
 * retargeting, not this row's bridge, so this door stays empty on purpose.
 */
export const room: RoomDefinition = {
  sourceId: 30,
  skill: 'game-animation-asset-pipeline',
  title: 'Video as motion reference, not asset',
  summary:
    'The owner-taught bridge: generate a reference video, reconstruct pose from it, retarget onto our own rig, and ship only the rig data.',
  kind: 'stub',
  limitation:
    'BLOCKED: the first step needs a local video generator this lane may not run and the second needs Blender or a pose-reconstruction route; the generated video itself is private scaffolding that never ships. Direct mocap or text-to-motion without the video bridge is the recorded alternate.',
};
