# Lane W3 — rooms report

12 rooms owned (sources 6, 7, 19, 37, 49, 58, 28, 48, 5, 17, 32, 46).
2 room files edited, one fix cycle each; 10 room files verified untouched;
no other lane's file touched. All captures by `qa/room-shot.mjs --source <id>`
against `http://localhost:5199/skills-lab/`, which I verified serves this
repository's own `dist` (identical `index.html` bundle hash at capture time),
NVIDIA adapter, `high` quality.

`npx tsc --noEmit`: exit 0, empty output (after the last edit).

Gate note: the quality target ratcheted 0.38 → 0.41 mid-lane via another
lane's `--all` wave. My brief's numbers were recorded at 0.38; everything
below is re-captured at 0.41. I never ran `--all` (only `--all` ratchets).

## Verdicts (target 0.41)

| source | q | cov | det | hue | mot | verdict | cycles |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 img2threejs contract | 0.57 | 41% | 4% | 9 | 2% | PRESENT | 1 |
| 32 WAN 2.2 (stub) | 0.04 | 3% | 1% | 0 | 0% | EMPTY, honest | 0 |
| 37 Z-up cm to Y-up m | 0.44 | 17% | 3% | 6 | 9% | PRESENT | 0 |
| 49 motion scaffold | 0.45 | 21% | 6% | 7 | 3% | PRESENT | 1 |
| 58 DERMIS bust | 0.42 | 27% | 6% | 5 | 1% | PRESENT, fragile | 0 |
| 46 bubble ocean | 0.46 | 21% | 5% | 3 | 29% | PRESENT | 0 |
| 7 night street | 0.46 | 27% | 6% | 8 | 1% | PRESENT | 0 |
| 19 raytracer | 0.51 | 34% | 6% | 8 | 0% | PRESENT | 0 |
| 5 sprite atlas | 0.55 | 41% | 5% | 4 | 4% | PRESENT | 0 |
| 17 quality bar | 0.62 | 35% | 10% | 8 | 2% | PRESENT | 0 |
| 28 dissolve | 0.77 | 34% | 17% | 5 | 11% | PRESENT | 0 |
| 48 interior look | 0.77 | 67% | 15% | 3 | 0% | PRESENT | 0 |

11 PRESENT, 1 door honest by design (stub, see below).

## Per room

**6 (webgpu).** Two 3x jerry cans on plinths: mesh-only failure left, gated
spec-plus-runtime right with brass socket markers, wire collider and bobbing
socket probe, red FAIL / green PASS bars behind. Cycle 1: bays sat at local
z +3.6 (≈16 m through-door read, q=0.33, det 1%, hue 2, mot 0%); moved to
z −1.5 (≈10 m) and put the gated half on a slow turntable (ungated stays put
as the control). Technique maths untouched. 0.33 → 0.57. Look for: the gated
can turning showing collider and probe; red bar left, green bar right.
Caveat: the doorway frame includes room 3's water plane lower-left (world
finding 1) — the PRESENT is earned mostly by the cans (the +0.24 delta is all
staging), but a standalone share was not isolated. `limitation` unchanged and
still accurate (no image input anywhere).

**49 (webgpu).** Two 2.8 m hinge chains on a measurement disc: per-frame snap
left, critically-damped spring right, tip trails drawing the difference.
Cycle 1: q=0.38, down on detail (3%) with the flat disc reading as blank;
added three range rings on the disc and a rolling-window cursor lapping the
stage (the window the next plan step would take — the one concept with no
visual). Spring/snap maths and 1.6 s phase untouched. 0.38 → 0.45. Look for:
the amber cursor circling while both chains chase targets, green trail
gliding where red corners. `limitation` unchanged (no network, five schematic
hinges).

**37 (webgpu).** Before bay (records fed raw, lying on their side) vs after
bay (converted, revealed behind a progress fill). Untouched; q=0.44 at the
current target. Coverage 17% is thin but the read is correct: from the door
the left half floats wrong and the right half stands. 0 cycles spent; a second
look would go at moving bays forward, but PRESENT means hands off. Look for:
blocks popping in behind the green progress bar.

**58 (webgpu).** Generic mannequin bust with strand hair, mottled skin, hazel
irises, single blink, head sway; chapter boards flank, diagnostic bars behind.
Untouched; q=0.42, margin 0.01 — the lane's most fragile pass, and motion 1%
means an unlucky two-frame probe could dip it under. Left alone per do-not-
grind; if it falls, the cheapest honest lever is a wider blink or sway, not
new content. Look for: the blink every ~4 s; no likeness input anywhere (the
point).

**46 (webgpu).** Two basins over one wave field: flat white tint wrong left,
absorption-filtered green scatter right, shared foam proxy. Untouched; q=0.46,
motion 29% (vertex paint every update). Stays inside its licence box: restated
textbook physics, sine crests not FFT, no product code — `limitation` says so.
Look for: white foam left vs green-shifted water right.

**7 (webgpu).** Over-lit street left vs budgeted emissive-first street right,
re-staged demo maths on a dark apron. Untouched; q=0.46. `limitation` owns the
missing post chain. Look for: window glow doing the work on the right.

**19 (webgpu).** CPU Whitted trace printed 10.5 m on the back wall, three
traced spheres rebuilt at human scale on plinths in front. Untouched; q=0.51.
Spheres idle-rotate (motion 0% on the probe — rotation too slow to register,
which is fine; the trace is the exhibit). Look for: print-to-plinth
correspondence left to right.

**5 (webgpu).** Raw locally-drawn clip on magenta beside keyed pose-extreme
atlas, filmstrip below with playhead. Untouched; q=0.55. Licence posture
verified against the catalogue before touching anything: no H3 model, weights
or output anywhere; `limitation` carries the UK exclusion plainly. 2D
billboard, never a rig. Look for: magenta keying out on the atlas half.

**17 (webgpu).** Sparse flat diorama left, dense wind-blown layered one with
distant ridge right. Untouched; q=0.62. NOT Cadle's scene (unretrievable —
catalogue blocker); our own comparator, stated in file and `limitation`.
Look for: density and depth right, flatness left. Same corner-overlap geometry
as rooms 5/6/7 (world finding 1) applies to this slot; no foreign content
confirmed in its frame.

**28 (webgpu).** Intact teal panel beside dissolving amber panel with bright
edge band, one animated threshold. Untouched; q=0.77, the lane's joint best.
CPU per-vertex stand-in for a GPU graph, stated in `limitation`. Look for: the
amber panel visibly dissolving with a light rim.

**48 (webgpu).** Two walk-between half-corridors: flat-lit failure left,
graded dark-interior look right (value band, emissive fixtures, distance
darkening, matte grime, motes, one exposure event). Untouched; q=0.77 on 67%
coverage — the technique IS the room. `limitation` owns the absent post chain.
Look for: the far end going dark because nothing lights it.

**32 (stub).** No `create`, per the catalogue blocker (weights unpinned,
licence unverified against weights, no GPU generation this lane may run).
EMPTY is the correct verdict; geometry here would fake a diffusion run. No
cycles spent, none owed. Door and wall card carry the blocker.

## World-level findings (not mine to fix — reporting, not editing)

1. **First-rank corner rooms interpenetrate.** `planDoors` (`src/world/layout.ts:76-108`)
   deals the same rank across all four wings at the same `along`, so adjacent
   wings' rank-0 rooms sit 8.49 m centre-to-centre (measured from the gate's
   own `__worldRooms`: pairs 1&8, 2&5, 3&6, 4&7; plus eight 12.53 m pairs e.g.
   11&6, 14&3) while shells are 14×16 m. A 9×9 m shared volume follows by
   construction. Consequence in my lane: room 3's water plane fills the
   lower-left of room 6's doorway frame, and room 6's inside frame shows a
   foreign terracotta/sage/brown figure (palette matches room 11's hero
   staging, 12.5 m behind the back wall) standing in front of room 6's own
   wall card. My rooms keep within their 14×16×6 bounds; the overlap is in the
   layout, and only the layout can fix it.
2. **Do not read my PRESENTs as correctness claims.** 6's 0.57 includes
   neighbour pixels (finding 1); 58's 0.42 has 0.01 margin. Both are floors,
   per the gate's own wording.
3. **Parallel image reads in this harness can come back swapped** (seen again
   this lane: two doorway PNGs returned each other's pixels in one block).
   Every visual claim above was verified serially; numbers are from
   `report-<id>.json`, not from pixels.

## What I verified vs did not

Verified: `tsc --noEmit` exit 0 empty after the last edit; every q/cov/det/
hue/mot number above from the current gate on the real adapter after a rebuild
from the edited tree (preview hash-matched to `dist`); catalogue blockers for
5/17/32/46 read before any decision; dispose paths walk the same registries
the builders fill; no `any`, no cross-room imports, no renderer/post access,
no third-party expression; seed-determinism untouched (turntable and cursor
are pure functions of elapsed time); `git status` confirms only my two room
files plus this report changed under my hand.

Did not verify: walking the rooms with a real player; WebGL-fallback
appearance; frame rate with four live rooms; the inside frames beyond room 6
(foreign figure unattributed by isolation test — palette/distance match to
room 11 only); whether rooms 5/7's frames contain neighbour pixels (geometry
says possible, pixels unconfirmed); other lanes' rooms beyond the findings.
