# Lane W1 — rooms report

13 rooms owned (brief `W1-rooms.md`, wave of 2026-09-18). 3 room files edited,
1 report (this file). No other files touched. Never killed anything; never ran
a git write command.

Scope note: the working tree held a `lane-W1-rooms.md` from a previous wave
with a different assignment (sources 50/2/16/38/49/57). My brief names the 13
rooms below and this report path, so this file replaces it.

Target at time of work: **0.41** (`qa/rooms/target.json`, ratcheted up from
0.38 before this lane started). `--source` runs never raise it. I did not
edit the gate.

## Gate results (final, `qa/room-shot.mjs`, nvidia, WebGPU/high, target 0.41)

| source | q | door | verdict | cycles used |
|---|---|---|---|---|
| 59 Graalitoo article (stub) | 0.03 | 2% | EMPTY, honest | 0, nothing demonstrable |
| 27 feel loop | 0.41 | 19% | PRESENT, on the line | 3 (0.37 → 0.27 → 0.32 → 0.41) |
| 1 mocap plant step | 0.55 | 55% | PRESENT | 0 |
| 10 prop ingestion gate | 0.44 | 37% | PRESENT | 0 |
| 31 fps arms | 0.42 | 36% | PRESENT | 1 (0.38 → 0.42) |
| 40 voxel windows | 0.45 | 31% | PRESENT | 0 |
| 52 island schedules | 0.43 | 26% | PRESENT | 0 |
| 58 dermis bust | 0.57 | 59% | PRESENT | 0 |
| 3 stylised water | 0.60 | 48% | PRESENT | 0, comparator per catalogue blocker |
| 14 claudefare | 0.42 | 33% | PRESENT | 1 (0.39 → 0.42) |
| 25 shoreline (stub) | 0.02 | 2% | EMPTY, honest | 0, blocked by catalogue |
| 43 lumera | 0.70 | 56% | PRESENT | 0 |
| 62 AGR importer (external) | 0.04 | 2% | EMPTY, honest | 0, unreleased WIP |

10 PRESENT, 3 EMPTY-by-design. No console errors attributable to my rooms in
any run. One transient `page.goto` failure on the first 62 run (preview hiccup
under parallel-lane load); retry passed with the same honest-EMPTY numbers.

## What I changed and why (3 files)

- **27 feel loop** (`source-27-feel-loop.ts`, 3 cycles). The live
  cooldown/hitstop scoreboard never appeared in any doorway frame, so the
  room's "control" was invisible and its only continuous motion source was
  missing. Cycle 1 moved the board right of the striker post — half behind the
  post, half out of frame (0.37 → 0.27). Cycle 2 moved it to a label stand on
  legs centre-floor between camera and action — stand rendered, bars missing
  (0.32). Root cause found: bars sat at z=-2.15/-3.45, 5 cm BEHIND the wall
  panel from the door camera (sign error, present since the room was written —
  the bars were never visible in any capture). Cycle 3 put both bars 5 cm
  door-side of the panel (0.41, motion 1 → 10%). Drive-by fix in the same
  cycles: the hitstop bar's flash position was `x = 0` (arena centre) instead
  of the board — it now flashes on the board. HIT/STOP durations, swing,
  knockback, flash and update order untouched.
- **31 fps arms** (`source-31-fps-arms.ts`, 1 cycle). Square-on at 2.1x, one
  flat-shaded capsule side filled the doorway and shading starved at 1%.
  Turned the stage a quarter to the door (yaw PI + 0.45), 1.9x, half-step back
  (z -3.9 → -3.4, plinth followed), plus one warm exhibit spot from the
  upper-left-front where the world key leaves door-facing facets one flat tone
  (0.38 → 0.42, coverage 30 → 36%, shading 1 → 2%). IK, pole, curl untouched.
  Two self-inflicted edit slips repaired immediately (duplicated floor add,
  both verified by re-read; `tsc` green throughout).
- **14 claudefare** (`source-14-claudefare.ts`, 1 cycle). Steady state between
  muzzle bursts is a photograph (motion 0% across back-to-back captures,
  q=0.39 twice). Added ±2 cm idle sway at 2.1 rad/s to both viewmodel groups —
  real viewmodels never sit dead still, amplitude far below the recoil it must
  not mask (0.39 → 0.42, motion 0 → 2%). Burst cadence, materials, comparator
  geometry untouched.

## Per room (walk-in read from doorway frames)

- **59 (stub).** Numbers only, not eyeballed: 2% door. Correct outcome —
  article body never retrieved, catalogue carries no method, card says UNKNOWN.
- **27.** Striker arm mid-swing over the teal dummy in the railed arena, label
  stand centre frame with the green cooldown block and a red hitstop sliver
  visible. PRESENT on the line — a human should check the bar reads as a
  *filling* bar rather than a sliding block (it anchors rightward as it grows).
- **1.** Two ~3.4 m figures mid plant-step on a shared ground sheet, plant
  discs under both support feet; raw-FK skate vs hip-search stance reads at a
  glance. PRESENT, no touch.
- **10.** Two bays, drum + bollard each; warm preview bulb left, gated tight
  collider right, measured placards computed from the meshes. PRESENT.
- **31.** Posed brown arm reaching at the blue handle with curled fingers,
  grey ghost behind, gold joint markers, rimmed plinth. PRESENT after 1 cycle.
- **40.** Two voxel towers with amber emissive windows just inside the door;
  scripted carve runs on a timer (motion 5%). PRESENT. The limitation on the
  card (scripted carve, NOT emergent failure) is the honest half of this room.
- **52.** Isle filling the floor wall to near-wall: huts, farm rows, jetty
  boat, walking villagers (hues 18, highest in lane). PRESENT.
- **58.** Generic mannequin bust large in frame with strand hair and mottled
  skin, mid-blink channel. PRESENT. No image input exists anywhere — the point.
- **3.** Pale split water floor wall to wall, boat on the after side, foam and
  wake moving (motion 8%). Catalogue blocker recorded (no repository,
  comparator only); room invents nothing. PRESENT.
- **14.** BEFORE/AFTER gun slabs with rubric labels, dark gunmetal vs single
  skin, sway alive in steady state. PRESENT but thin (0.42). BEFORE label
  slightly clipped at frame right — flagged below, untouched.
- **25 (stub).** Numbers only: 2% door. Blocked (unreleased), empty on
  purpose, blocker on the card. No fix exists.
- **43.** Grey bays with orbiting glare, props relighting warm on the after
  side (motion 57%, shading 18% — the gate's model citizen). PRESENT.
- **62 (external).** Numbers only: 2% door. Unreleased UE WIP: launcher plus
  honest limitation, no in-browser claim. EMPTY is correct.

## Found outside my files (reported, not touched)

- **BEFORE label clipped, source 14 doorway.** Text reads "no ligh…" at frame
  right with a full-height vertical seam beside it — either the room's right
  wall close to camera or a slab edge. If it is the wall, halves at ±1.9 are
  near their limit; needs a world-lane eye, not a room-lane guess.
- **Capture beat-aliasing is real.** 27's 1.4 s beat vs the 1.3 s frame gap
  read motion 6% → 1% → 5% → 10% across identical-code runs; 14's 2 s burst
  read 28% once, 0% twice. Two-frame sampling cannot score periodic exhibits
  stably. Continuous motion sources (27's now-visible cooldown sweep, 14's
  sway) damp it but do not remove it.
- **Shared-preview cross-talk continues.** Three `build:nocheck` runs by this
  lane interleaved with whoever else is capturing; every rebuild bakes the
  whole tree including half-finished sibling rooms. All tabled numbers are
  per-capture truth from the final tree state.

## What was NOT verified

- Technique correctness anywhere: PRESENT/quality means visible and lively,
  never right. Nothing was validated against its source.
- A real human walkthrough: no mouse walkthrough; camera teleports only. The
  "walk in" lines above describe capture frames, not visits.
- Stubs/externals (59/25/62) were not eyeballed — numbers only.
- WebGL/low appearance: all captures WebGPU/high (nvidia). `quality` scaling
  is code-read, never captured.
- Frame rate and triangle/draw budgets: not measured in-browser for any room.
- Wall-card text was not re-read in frames this lane (prior wave verified the
  venue cards render; my rooms' summary/limitation strings are code-read).
- Finish-step commands: `npx tsc --noEmit` — empty output, exit 0 — at end of
  lane; `room-shot --source` per table above under target 0.41. Cycle budget:
  27 ×3, 31 ×1, 14 ×1, everything else ×0 — nothing exceeded, nothing hidden.
