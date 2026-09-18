# Lane W2 — rooms report

12 rooms owned (brief `W2-rooms.md`, wave of 2026-09-18): 23, 37, 2, 16, 33,
41, 53, 8, 4, 15, 30, 44. 4 room files edited + this report; nothing else
touched. Never killed anything; never ran a git write command.

Scope note: this path held a report from a previous wave with a different
assignment (13/31/52/6/18/40/51…). My brief names these 12 rooms, so this file
replaces it.

Gate is `qa/room-shot.mjs` on the NVIDIA WebGPU adapter; ratcheting target at
time of capture **0.41** (from `qa/rooms/target.json`; it rose 0.38 → 0.41
mid-day as the world median improved). Quality is computed from the doorway
frame only:
`q = cov/0.6·0.38 + det/0.14·0.17 + hue/7·0.10 + mot/0.10·0.15 + shd/0.45·0.20`.
Verdicts: coverage < 6% EMPTY, < 12% THIN, else quality < 0.41 BELOW BAR, else
PRESENT. PRESENT is not claimed as technique correctness.
`npx tsc --noEmit`: empty output, exit 0 (run after the last edit; no edits
since). All captures below ran 16:34–16:39 against builds of the current tree.

## Final verdicts

| source | room | q | door | inside | det | shd | hue | mot | verdict | cycles |
|---|---|---|---|---|---|---|---|---|---|---|
| 23 | Deforming-terrain combat sim | 0.14 | 16% | 12% | 4% | 0% | 0 | 0% | BELOW BAR | 3, out of budget |
| 37 | Z-up centimetres to Y-up metres | 0.40 | 20% | 32% | 4% | 0% | 5 | 11% | BELOW BAR | 3, out of budget |
| 2 | Spectral FFT ocean | 0.43 | 28% | 27% | 5% | 8% | 4 | 7% | PRESENT | 1 |
| 16 | Text to character animation locally | 0.46 | 36% | 33% | 4% | 7% | 3 | 8% | PRESENT | 0 |
| 33 | Partitioned terrain with worker LOD | 0.44 | 36% | 41% | 7% | 7% | 10 | 0% | PRESENT | 1 |
| 41 | Technique-demo hub | 0.49 | 31% | 15% | 6% | 5% | 10 | 6% | PRESENT | 0 |
| 53 | Verdant woodland | 0.59 | 39% | 57% | 13% | 13% | 7 | 2% | PRESENT | 0 |
| 8 | Fully procedural jungle | 0.66 | 71% | 51% | 10% | 5% | 7 | 3% | PRESENT | 0 |
| 4 | Underwater hull, unsolved cut | 0.57 | 44% | 42% | 9% | 9% | 9 | 3% | PRESENT | 0 |
| 15 | Native RTX runtime (blocked) | 0.06 | 7% | 19% | 1% | 2% | 0 | 0% | honest stub | 0 |
| 30 | Video as motion reference (blocked) | 0.03 | 2% | 18% | 2% | 0% | 0 | 0% | honest stub | 0 |
| 44 | Sweep comparators (no method) | 0.03 | 2% | 18% | 2% | 0% | 0 | 0% | honest stub | 0 |

No console/page errors from any owned room in any round (the gate prints
them; it printed none — including for 23, which matters below).

## Per room: what a visitor sees, and what changed

- **23 (BELOW BAR, 3 cycles — budget spent).** Two tilted snow plates on dark
  base boxes in the back half, one walker per plate. Cycle 1: moved the
  exhibit from z = −3.5 (at the camera plane — half behind it, half under the
  floor) to z = +2.0 on pivots at y 2.55, added base boxes, walkers blue→lime
  (0.19→0.11; the move overshot before the next fix landed). Cycle 2: found
  and fixed a real bug — the plate pivots were never added to the room root,
  so every capture before this lane ever saw was walkers + shell only
  (0.11→0.14; plates attached, white verified in pixel bytes as the authored
  snow colour through the output transform). Cycle 3 (diagnostic, then
  reverted): red poles + lime walkers provably in the served bundle, zero
  pixels in any capture from any stance — see diagnosis below. Technique
  (field, brush, banked relax, lissajous) untouched throughout.
- **37 (BELOW BAR, 3 cycles — budget spent).** Two bays face the door: raw
  red blocks floating/intersecting on the left (the unswapped-axes failure),
  converted blue blocks standing on the right revealing behind a green cache
  fill. Cycle 1: grew the synthetic records (converter untouched), bigger
  pads (0.33→0.35). Cycle 2: rebalanced (records smaller again but still
  above original, before-bay display spread ×1.6, cache loop 5 s→3 s so the
  gate sees ~half revealed, 0.35→0.32 — the faster loop phase-aliased that
  capture). Cycle 3: bays forward (bayZ −1.0→−1.8), taller blocks, widget
  follows (0.32→0.40). One hundredth under the bar; out of budget, left
  standing.
- **2 (PRESENT, 1 cycle).** Sine-sea left, JONSWAP/FFT sea right over a dark
  basin. Demo maths untouched; stage scale 1.6→1.8 only (0.40→0.43).
- **16 (PRESENT, 0 cycles).** Three rigs by joint count marching; hard-cut
  seam left, blended seam right. Untouched; verified 0.46 at target 0.41.
- **33 (PRESENT, 1 cycle).** 4×4 LOD floor (constrained seams left, raw
  right), gold boundary rail, legend + error-curve charts. Near chart
  3.5×1.1→4.6×1.44 m only — algorithms, tolerance, palette untouched
  (0.41→0.44).
- **41 (PRESENT, 0).** Pile-of-techniques left, four numbered pedestals
  right. Untouched; 0.49. Inside coverage (15%) trails doorway (31%) — the
  inside stance is past the pedestals looking at the back wall; fine.
- **53 (PRESENT, 0).** Seeded woodland disc scaled to the walls. Untouched;
  0.59, strongest shading in the lane (13%).
- **8 (PRESENT, 0).** Walkable thicket + the two giant demo leaves (buggy
  bake left, clean bleed right). Untouched; 0.66, strongest coverage (71%).
- **4 (PRESENT, 0).** Domed sheet left, deliberately tearing naive cut right
  with emissive tear markers. Untouched; 0.57. The catalogue blocker (cut
  unsolved upstream) is the exhibit; the limitation says the cut is shown
  FAILING. Do not "fix" this room without reading the blocker.
- **15/30/44 (stubs, 0 cycles).** Honest empty rooms: plate, summary, reason
  on the wall. 15 needs a native build + owner product decision (an
  in-browser substitute would repeat the recorded substitution error); 30
  needs a local video generator + pose route this lane may not run; 44 has no
  repository/tool/licence behind either post (the absence is the finding).
  Untouched; building anything would invent content. (15 reads THIN rather
  than EMPTY because the shell lamp + card leak 7% past the metric; the room
  itself is empty by design.)

## 23 diagnosis — for the next lane that touches it

Three independent facts, all verified in bytes: (1) the served bundle is the
current file (fetched the exact chunk URL from the running page: lime walkers
and pole diagnostics present, old constants absent); (2) boxes and plates
render (box tops and snow strips located by colour in the doorway PNG);
(3) walkers, poles — plain-colour `MeshBasicMaterial` meshes with static,
sane transforms — render zero pixels from doorway, inside, side, and behind
stances, and door-vs-door motion is exactly 0. The pre-rolled groove is
saturated (brush 9.0/s vs relax 0.125/s), so the only moving pixels would be
walkers — consistent with mot 0 if they are culled, not with update() being
dead (no errors, content otherwise live). Prime suspect: stale
frustum-culling state — `applyField` rewrites plate vertices every frame and
`computeVertexNormals` runs every second frame, while walkers ride
`pivot.localToWorld` positions; try `frustumCulled = false` on the walkers
(and plates) and re-capture. Second suspect: the room's update runs but the
world never calls it for this slot — instrument with a counter, not with
more pixels. Do not re-stage blindly: two stagings measured 0.11–0.19 and the
geometry model (34° drafting tables at z +2, pivots y 2.55) is verified
against the inside view, where the plates correctly tower either side of the
centre gap.

## Shared-tree hazard — observed, worked around

Sibling lanes rebuilt `dist/` throughout (mtime moved under my captures; the
:5199 preview itself was restarted 16:36 mid-lane by another hand — it serves
this repo, hash-verified). `git status` gained other lanes' room edits during
the lane (source-14/27/31/42/45). Mitigation used: rebuild immediately before
each capture; quote verdicts only from the run's own `report-*.json`, never
from PNGs (a previous lane caught doorway PNGs transiently crossed by a
concurrent run). One capture (23 cycle 3) repeated the previous run's numbers
exactly and was re-run rather than trusted.

## What I did not verify

- Technique correctness anywhere: the gate measures frame statistics. Every
  limitation stands as written.
- Walk-through with a real player (WASD, collision, streaming at pace). Only
  the two gate viewpoints as stills. 23's room in particular has never been
  seen by a human eye walking in — its numbers come from stills only.
- The 23 culling hypothesis (above): a guess with evidence, not a finding.
  The lime walker colour and 0.8 size have never rendered, so they are
  unproven choices, though reasoned (contrast against the blue groove).
- 37's margin: BELOW BAR by 0.01 with no cycles left; the reveal phase makes
  it wobble ±0.03 run to run. Do not nudge it without spending a cycle
  honestly — the next lever is the before-bay display spread, not the
  converter.
- 33 (mot 0%) and 2 (mot 7%): LOD refinement and wave motion were not watched
  over time; stills only.
- WebGL-fallback (`low`) staging beyond count-halving in code. All captures
  ran on the NVIDIA WebGPU adapter.
- Frame rate / draw-call / triangle budgets under load — reasoned (shared
  geometries, capped segments, instancing where the demo had it), not
  measured. 37 runs ~27 draw calls against the ~12 soft budget; it inherited
  ~22 and my cycles added none (count unchanged at 9/bay).
- Other lanes' files and the world shell: read for diagnosis, never edited.
  My diff is the four room files below and this file. The :5199 preview
  server was used as found, never restarted, nothing killed.

## For the human walking in

Look for: twin snow drafting tables with an orange—lime walker ball on each
and one grooved trail on the remembering plate (23 — if the balls are
missing, the culling bug is still live); raw red slabs floating left,
standing blue blocks revealing right behind a green fill bar (37 — catch it
mid-loop, the reveal cycles every 5 s); sine sea vs white-folding FFT sea
(2); three marching rigs with hard cut left, blend right (16); LOD-coloured
floor split by a gold rail, curves chart beside the legend (33); pile vs
pedestals (41); woodland disc with trail corridor (53); thicket underfoot
plus the two giant leaves, buggy left clean right (8); domed sheet vs torn
cut with glowing staples (4); three honest empty doors, read the cards
(15/30/44).

## Files written

- `src/world/rooms/source-23-deforming-terrain.ts` — 12855 bytes (reposition
  to back half, base boxes, lime walkers, `root.add(pivot)` fix; diagnostics
  reverted).
- `src/world/rooms/source-37-fable-test.ts` — 6640 bytes (synthetic records
  grown, before-bay spread ×1.6, cache loop 5 s→3 s, bays to −1.8, taller
  blocks, widget follows).
- `src/world/rooms/source-33-terrain-lod.ts` — 15516 bytes (near chart
  3.5×1.1→4.6×1.44 m; one line).
- `src/world/rooms/source-2-spectral-ocean.ts` — 2980 bytes (stage 1.6→1.8;
  one line).
- `docs/lane-W2-rooms.md` — this file.

Verified: `tsc --noEmit` empty/exit 0; gate verdict + both coverages for all
12 rooms above, each from its own run's `report-*.json` at target 0.41.
Not verified: everything listed in "What I did not verify".
