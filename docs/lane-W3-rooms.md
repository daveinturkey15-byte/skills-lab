# Lane W3 — rooms report

12 rooms owned, 12 files written, no other lane's file touched. All captures by
`qa/room-shot.mjs` against `http://localhost:5199/skills-lab/` on the NVIDIA
adapter (real WebGPU, `high` quality). `tsc --noEmit` exit 0, zero bytes output.

## Verdicts

| source | door | inside | verdict | build measured on |
| --- | --- | --- | --- | --- |
| 22 comparators | 2.5% | 18.6% | EMPTY (stub, honest) | first |
| 29 instancing | 47.0% | 14.7% | PRESENT | fixed |
| 35 gas-station brief | 13.1% | 13.2% | PRESENT | fixed |
| 41 sketch hub | 31.2% | 13.9% | PRESENT | fixed |
| 51 weather states | 27.1% | 61.9% | PRESENT | first |
| 62 AGR importer | 2.2% | 19.5% | EMPTY (external, honest) | first |
| 23 deforming terrain | 12.7% | 31.0% | PRESENT | first |
| 47 street cell | 46.6% | 38.9% | PRESENT | fixed |
| 61 COD LiveLink | 4.0% | 18.0% | EMPTY (external, honest) | first |
| 5 sprite atlas | 41.3% | 16.1% | PRESENT | fixed |
| 10 prop ingestion | 16.6% | 63.4% | PRESENT | first |
| 33 terrain LOD | 17.0% | 28.0% | PRESENT | fixed |

9 PRESENT, 3 doors honest by design (one stub, two external launchers).

## Per room

**22 (stub).** Visitor sees the world wall card and nothing else: three linked
pages held as quality targets, with the blocker stated. No geometry by
catalogue instruction — the register forbids substituting original scenes
under this title. Nothing to scale; nothing further to verify beyond the card
text, which I read in the inside frame.

**29 (webgpu).** Two 5.4 m panels facing the door: 64 white cubes as separate
meshes against one InstancedMesh with per-instance colour, placards carrying
live counts (`64 meshes, 64 draws` / `1 draw, 64 instances`). Restaged from
`group-b/source-29.ts` at ~7x scale; field cut 240 → 64 for the draw budget
(stated in the limitation). First capture 1.9%: everything sat at local z +3
behind the mid-room shell wall (see finding below). Moved to the door half;
47.0%. Look for: white mosaic left, colour mosaic right, both pulsing gently.

**35 (webgpu).** Floor split underfoot: synthesised asphalt at the door, flat
placeholder beyond, three brass markers plus glowing whitelist rings
(pump/door/fridge), one toppled grey marker (drive refused), verdict board on
the back wall. Restages `group-c/source-35.ts` surfacing maths (restated) at
room scale. Swapped halves + added rings across two cycles: 3.8% → 13.1%.
Look for: the puddle and tar seams near the door, brass rings glowing.

**41 (webgpu).** Merged pile on one block left, four numbered pedestals right,
each subject rotating on its own clock. Restages `group-c/source-41.ts`
exhibits (restated geometry) with light pedestals and 1.35x subjects for
doorway distance. 2.1% → 31.2%. Look for: mess left, order right.

**51 (webgpu).** Sea as the floor, sky backdrop, cloud deck overhead, 700 rain
drops, driven sun, eight meter bars plus a state board (CALM / STORM FRONT /
INSIDE THE STORM) on the left wall. Restages `group-d/source-51-storm.ts`
(driver, chase, targets) with restated sea/cloud maths; 48 s loop. Passed
first try at 27.1%; never touched again. Look for: meters breathing out of
sync, board flipping as states blend. The author's demo is unreleased — every
system here is an original study, stated in the limitation.

**62 / 61 (external).** Launcher doors mirroring the catalogue fallback
labels, scripts and notes; no `create`, per the contract. 2.2% / 4.0% is the
wall card seen from the doorway — the correct signature for an external door.
Look for: the launcher line on the card.

**23 (webgpu).** Two 6.2 x 12 m snow plates fill the room; one walker each;
left plate forgets, right plate grooves blue. Restages `group-b/source-23.ts`
(field, shared brush, banked recovery) at ~1.5x; the toroidal follow window
is deliberately not shown (a room floor follows nobody — stated). Passed at
12.7%, close to the 12% line; the file is untouched since, so treat the margin
as thin. Look for: the right plate scarring while the left stays clean.

**47 (webgpu).** Street canyon the full 16 m: treated half at the door,
greybox beyond, instanced bays and furniture on the treated half. Restages
`group-c/source-47.ts` (restated surfacing) widened 1.6x. Swapped halves in
cycle 2: 27.3% → 46.6%. Look for: walking out of detail into grey.

**5 (webgpu).** Giant magenta-before / keyed-after billboards plus atlas
filmstrip with playhead, facing the door. Restages `group-a/source-05.ts`
maths exactly (drawFrame, poseExtremes, holds). Moved to the door half in
cycle 2: 35.4% → 41.3%. Look for: raw clip chattering at 12 fps beside slow
pose holds. Licence-blocked model route stated; frames drawn in code.

**10 (webgpu).** Two bays: raw install with breathing preview bulb and
oversized red collider beside gated bay with tight green measured collider;
placard compares declared vs Box3-measured bounds in metres. Restages
`group-a/source-10.ts` at ~2x. Passed at 16.6% on the only correct-shell slot
I own; untouched since. Look for: the bulb glaring left, green wireframe
hugging the drum right.

**33 (webgpu).** Floor is a 4x4 partitioned terrain, colour as the level map,
left columns neighbour-constrained, right columns raw, brass survey posts on
the boundary, legend board by the door. Restates the three LodSelector
algorithms. Three cycles: 4.3% (lit) → 10.3% (unlit levels) → 17.0%
(trough clamp). The unlit choice is in the limitation: colour is data, not
lighting. Look for: green at your feet warming to red at distance, seams
cracking open on the raw right half as you walk.

## World-level findings (not mine to fix — reporting, not editing)

1. **Shell side walls are transposed for every room whose outward axis is X**
   (`src/world/world.ts:188-203`). For `[tx, tz] = [0, ±1]` the boxes come out
   (0.5, 6, 16) centred on the room's middle line instead of (16, 6, 0.5) on
   its sides: a grey fin stands across local z = 0 through 10 of my 12 rooms'
   slots, and the true sides stand open. Evidence: 29 at 1.9% with all content
   at local z +3 → 47.0% after moving it door-side, same technique; probe
   photographs of the fin in `qa/rooms/29-probe-*.png` (since removed with the
   probe). My rooms stage their heroes at local z < 0, which reads under both
   the current and a corrected shell — no rework needed either way.
2. **`facing` looks into the room, not back at the door.** `layout.ts:102-103`
   says "towards the door", but yaw-back photographs show the door behind the
   camera and inside frames show the back-wall card. All my staging assumes
   facing-into-room (verified per room in the frames).
3. **Transient black frames.** Two captures at identical coordinates came back
   near-black while repeats seconds later were normal; attributed to GPU
   contention (six lanes capturing against one adapter), not to room code.
   Re-running the gate was sufficient every time it appeared.
4. **A 404 on every capture run** (`Failed to load resource ... 404`). The
   catalogue itself serves 200 and all 62 rooms resolve, so this is incidental
   (likely favicon). Not diagnosed further.

## What I verified vs did not

Verified: `tsc --noEmit` exit 0, empty output (final run after the last edit);
`npm run build:nocheck` green; every verdict above from the real gate on the
real adapter; each PRESENT room visually inspected in its doorway frame;
dispose paths walk the same registries the builders fill; no `any`, no
cross-room imports, no renderer/post access, no third-party expression.
Seeded generators everywhere except 51's mount-age storm clock (stated in its
limitation, as in its demo).

Did not verify: walking the rooms with a real player (no locomotion check —
colliders are the shell's business); WebGL-fallback appearance (no low-quality
adapter on this machine; counts halve by code, not by measurement); 60 fps
with four live rooms (no profiling harness run); the inside-view percentages
as aesthetic judgements (reported, not tuned — the gate passes on doorway);
other lanes' rooms or the world integrator beyond the two findings above.
