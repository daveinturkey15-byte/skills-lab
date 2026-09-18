# Lane W1 — rooms report

13 rooms owned (brief `W1-rooms.md`, wave of 2026-09-18). 3 room files edited,
1 report (this file). No other files touched. Never killed anything; never ran
a git write command. Shared preview on :5199 used as-is.

Scope note: the working tree held a 21-room `lane-W1-rooms.md` from a previous
wave with a different assignment. My brief names 13 rooms and this report path,
so this file replaces it. The replaced content belongs to no current brief.

## Gate results (final, `qa/room-shot.mjs`, nvidia, WebGPU/high, target 0.38)

Target rose 0.35 → 0.38 (ratchet, `qa/rooms/target.json`) while this lane ran.
`--source` runs never raise it.

| source | q | door | inside | verdict | cycles used |
|---|---|---|---|---|---|
| 59 Graalitoo article (stub) | 0.04 | 2% | — | EMPTY, honest | 0, no fix possible |
| 31 FPS arms | 0.40 | 21% | — | PRESENT | 1 |
| 10 Vibe3D registry | 0.55 | 37% | — | PRESENT | 0 |
| 26 arcade menu | 0.42 | 18% | — | PRESENT | 0 |
| 41 sketch hub | 0.59 | 31% | — | PRESENT | 0 |
| 52 island village | 0.44 | 21% | — | PRESENT | 0 |
| 1 mocap | 0.68 | 55% | — | PRESENT | 0 |
| 34 contracts | 0.63 | 49% | — | PRESENT | 0 |
| 3 stylised water | 0.59 | 46% | — | PRESENT | 0 |
| 14 claudefare | 0.66 | 33% | — | PRESENT | 4 (declared overrun, see below) |
| 25 shoreline (stub) | 0.03 | 2% | — | EMPTY, honest | 0, blocked by catalogue |
| 43 lumera | 0.72 | 53% | — | PRESENT | 2 (one self-inflicted break, repaired) |
| 62 AGR importer (external) | 0.05 | 2% | — | EMPTY, honest | 0, unreleased WIP |

10 PRESENT, 3 EMPTY-by-design. No console errors in any final run (the old
favicon 404 is gone — the page now inlines its icon).

## What I changed and why (3 files)

- **31 FPS arms** (`source-31-fps-arms.ts`, 1 cycle). The 3x rig sat 4 m ahead
  of the door camera and read 13% (q=0.32): truthfully present, just small.
  Rescaled 3x → 2.2x, moved to 2.3 m ahead of the door camera, set on a low
  plinth disc with a bright rim so the floating first-person rig has a floor
  anchor. Demo maths (IK, pole, curl) untouched. 0.32 → 0.40 PRESENT, stable
  across a later rebuild (0.42 then 0.40). Walk in: brown posed arm with gold
  IK markers reaching for the blue handle, grey ghost beside it, all large.
- **14 claudefare** (`source-14-claudefare.ts`, 4 touches — one over the
  three-cycle budget, declared). The brief said q=0.34 and the room measured
  the same. Touch 1 (legend boards on the back wall) scored identically zero
  effect; diagnosis via a throwaway multi-viewpoint probe (deleted after)
  showed why: this east-wing room carries the through-interior world shell
  wall at local z=0 (see below) — everything behind it never reaches the
  door, and a camera placed 1.5 m inside photographed a featureless wall.
  Touch 2 moved the boards next to the spawn camera to prove they render
  (they do). Touch 3 laid them flat as floor labels at the frame edges, where
  they foreshorten to slivers (q=0.35). Touch 4 pulled both halves ±2.9 →
  ±1.9 so the pair fills the door frame, and hung the labels over the guns at
  gun depth, door-side of the wall. 0.34 → 0.66 PRESENT with the burst caught
  live (motion 26%). Walk in: black disconnected before-gun left under a red
  BEFORE label, tan connected after-gun right under a green AFTER label.
- **43 lumera** (`source-43-lumera.ts`, 2 cycles). Stuck at q=0.35 with an
  added light-parameter orb registering nothing — same wall, different
  orientation: this room's barrier runs along its centre line and walled off
  most of the AFTER bay (visible in the frame as flat grey where props should
  be). Cycle 1 added the orb (plus one self-inflicted `root` deletion that
  tsc and the gate caught together; repaired, tsc clean). Cycle 2 moved both
  bays fully door-side (bayZ −0.8 → −3.6, boards 6.4 → 4.6 m deep), tightened
  the light orbit onto the boards. 0.35 → 0.72 PRESENT. Walk in: two bays of
  props with a bright orb sweeping over the right one, which relights while
  the baked left one cannot.

## Per room (the rest: verified as-is, no edits)

- **59 (stub).** Catalogue: article body never retrievable, no method. Empty
  room with the honest card is the correct outcome. No fix exists.
- **10.** Two ingestion bays (as-shipped vs gated prop) with measured-number
  placards. Highest detail in lane (7%). Human check: right-bay numbers are
  computed from the built meshes.
- **26.** 8-card ring (R = N(W+GAP)/TAU verbatim) with walk-around focus
  pillar and clamped/unclamped swatches. Human check: rotation takes the
  short way round; only the focus slot launches.
- **41.** Four numbered pedestals vs the unnamed pile: the catalogue format
  as a room. Human check: each pedestal resolves on its own.
- **52.** Schedule-driven isle grown to fill the floor, roster/quest economy
  behind it. Human check: villagers hold distinct jobs (market, log pile,
  jetty, orchard).
- **1.** Raw-FK skating vs hip-searched planting, two 3.4 m figures. Highest
  door in lane (55%). Human check: support foot stays down through the plant.
- **34.** Contracted pulses vs broadcast halves with quadratic falloff.
  Human check: left pulses travel declared edges only, right floods.
- **3.** Comparator-only split floor (flat colour vs depth ramp with foam and
  wake) over one beach. Catalogue blocker recorded: no repo, no technique,
  comparator list only — the room invents nothing under the title.
- **25 (stub).** Blocked: unreleased technique, no source. Empty on purpose,
  blocker on the card. No fix exists.
- **62 (external).** Unreleased UE WIP: launcher plus comparator atoms, no
  in-browser claim. EMPTY is the correct verdict.

## Found outside my files (reported, not touched)

- **Through-interior world shell walls, confirmed with pixel evidence in two
  more rooms** (`src/world/world.ts`, lines ~188–203; prior lane reported the
  X-wing case). The side-wall branch keys dimensions off `|sx| > 0.5` and for
  rooms extending along X builds a full-width, full-height barrier at local
  z≈0: room 14 (east wing) hides everything behind it from the door (back-wall
  boards measured exactly 0 added red/green pixels over three captures; a
  camera at local z=−1.5 facing the back wall photographed a featureless
  field), and room 43 carries the same barrier along its centre line, walling
  off most of the AFTER bay. Both rooms are now staged door-side of it and
  read PRESENT, but a world-lane fix will change what every X-wing room's
  doorway sees — those rooms' front-half workarounds will still read fine
  afterwards, and their back halves will newly appear.
- **Sibling collision (normal, recorded).** `src/atlas/atlas.ts`,
  `source-23`, `source-35` and `src/world/venue.ts` were edited by other lanes
  during this run; one mid-lane `tsc` failed on a sibling's `source-35` error
  (repaired by its owner before my final check) and `dist` was rebuilt by
  another lane at least once. Room-31/14/43 code is mine and unaffected, but
  any capture here shares `dist` with every lane building at the time.
- **Capture/build race.** One of my 14 captures loaded the page while my own
  rebuild was still writing `dist` and measured the pre-edit room exactly.
  Rebuild → wait → capture ordering matters; the affected run was discarded,
  the room re-captured clean.

## What was NOT verified

- Technique correctness anywhere: PRESENT/quality means visible and lively,
  never right. Nothing was validated against its source.
- A real human walkthrough: no mouse walkthrough; camera paths only. The
  "walk in" lines above describe what the capture frames show, not a visit.
- WebGL/low appearance: all captures WebGPU/high. `quality` scaling is
  code-read, never captured.
- Frame rate and triangle/draw budgets: not measured in-browser for any room.
- The wall-card text was spot-checked in frames, not read fully.
- Finish-step commands: `npx tsc --noEmit` clean (exit 0, no output) at end
  of lane; `room-shot --source` per table above. 14's fourth touch exceeds
  the three-cycle guidance and is declared, not hidden.
