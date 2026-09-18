/**
 * Source 62 — AGRPLUGIN, AGR-based UE importer work-in-progress (mallowed).
 *
 * An external door. Early work-in-progress with no repository, download or
 * licence, running in Unreal rather than a browser. The room carries the
 * launcher and the comparator atoms, and claims no in-browser demonstration.
 * Launcher mirrors the catalogue fallback so the door keeps working if either
 * copy is read first.
 */
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 62,
  skill: 'unreal-content-pipeline',
  title: 'AGRPLUGIN: AGR-based UE importer',
  summary:
    'A work-in-progress UE importer turning a captured session into per-entity '
    + 'Sequencer tracks, stressed against a 5,400-actor Highrise map.',
  kind: 'external',
  launcher: {
    label: 'Open the UE5 game-recording import notes',
    script: 'scripts/launchers/ue5-game-recording.cmd',
    note: 'Same pipeline as the neighbouring door. Extracted commercial game assets are private-use only and are never redistributed.',
  },
  limitation:
    'Unreleased with no repository, download or licence, so nothing is '
    + 'demonstrable in-browser. The frames show Call of Duty-derived assets, '
    + 'which are private-use only and never redistributed. What "AGR" '
    + 'abbreviates is deliberately left open.',
};
