/**
 * Source 61 — COD 4 LiveLink in UE5 with multiplayer (thatkidpolito).
 *
 * An external door. The work is unreleased — the captured video is the only
 * artefact, with no repository, plugin or licence — and it runs in Unreal,
 * not in a browser. The room carries the launcher and the finding, and claims
 * no in-browser demonstration. Launcher mirrors the catalogue fallback so the
 * door keeps working if either copy is read first.
 */
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 61,
  skill: 'unreal-content-pipeline',
  title: 'COD4 LiveLink in UE5, multiplayer',
  summary:
    'An external game feeding a LiveLink source into UE5 driving a cinematic '
    + 'camera, multiplayer-synced and streamed for remote viewing.',
  kind: 'external',
  launcher: {
    label: 'Open the UE5 game-recording import notes',
    script: 'scripts/launchers/ue5-game-recording.cmd',
    note: 'Unreal Engine 5 plus a C2M-class extractor, on this machine only. Nothing is fetched or installed by the launcher; it opens the prepared notes and checks whether the prerequisites are present.',
  },
  limitation:
    'Unreleased: no repository, no plugin download and no licence, so nothing '
    + 'is demonstrable in-browser. Call of Duty 4 is commercial IP; any assets '
    + 'or capture data from it are private-use only and never redistributed. '
    + 'Whether the motion is retail capture or re-performance is not established.',
};
