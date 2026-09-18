# Lane W2 — rooms report

12 rooms owned: 59, 2, 16, 35, 45, 57, 18, 47, 4, 15, 30, 44.
Gate is `qa/room-shot.mjs` on a real NVIDIA WebGPU adapter; ratcheting target at
time of capture **0.41**. Quality `q = 0.45·coverage + 0.25·detail + 0.15·hues +
0.15·motion` is computed from the doorway frame only; PRESENT is not claimed as
technique correctness. All captures below are one fresh `build:nocheck` +
`vite preview` on port 5196 (own port; 5199 left to other lanes).
`npx tsc --noEmit`: empty output, exit 0, whole repo.

Note: this path previously held a report for a superseded assignment (sources
23/13/33/42/54/8, now lane W1's). That content is replaced, not merged. Where
it described rooms still in this lane (35/47/4/15/30/44) its cycle notes are
superseded by the captures below.

## Final verdicts

| source | room | q | cov | det | hue | mot | verdict |
|---|---|---|---|---|---|---|---|
| 59 | Graalitoo X article — not retrieved | 0.04 | 2% | 2% | 0 | 0% | honest stub, by catalogue design |
| 2 | Spectral FFT ocean | 0.50 | 26% | 5% | 4 | 9% | PRESENT |
| 16 | Text to character animation locally | 0.53 | 36% | 4% | 3 | 9% | PRESENT after 2 cycles |
| 35 | One-page scene brief, all-procedural | 0.52 | 33% | 8% | 3 | 4% | PRESENT |
| 45 | Cleaning a generated shell | 0.46 | 14% | 5% | 5 | 10% | PRESENT |
| 57 | Two-scale ocean stitch | 0.46 | 22% | 5% | 3 | 24% | PRESENT |
| 18 | Procedural grass meadow | 0.64 | 20% | 15% | 4 | 10% | PRESENT |
| 47 | Street cell: a bar, not a pipeline | 0.62 | 46% | 12% | 3 | 0% | PRESENT |
| 4 | Underwater hull, unsolved cut | 0.59 | 40% | 6% | 7 | 2% | PRESENT |
| 15 | Native RTX runtime (blocked) | 0.06 | 7% | 1% | 0 | 0% | honest stub, by catalogue design |
| 30 | Video as motion reference, not asset | 0.05 | 2% | 2% | 0 | 0% | honest stub, by catalogue design |
| 44 | Sweep comparators (no method) | 0.05 | 2% | 2% | 0 | 0% | honest stub, by catalogue design |

No console/page errors from any owned room in any round.

## Per room: what a visitor sees, and what was (not) changed

- **59 (stub).** Door opens onto the honest empty room: plate, summary, and the
  limitation that the article body was never retrievable. Catalogue: comparator,
  adaptation none, no skill mappings, demo absent. Untouched; no cycles apply —
  building anything would invent content.
- **2 (PRESENT).** Two water patches side by side over a dark basin: summed-sine
  control against the JONSWAP/FFT spectral treatment going white where it folds.
  Inherited the group-A demo's maths via `createDemo`, scaled 1.6×. Untouched
  this lane; no cycles needed.
- **16 (PRESENT, 2 cycles — the only room worked).** Three coloured rigs march
  on pedestals just inside the door, joint dots bobbing; the back wall carries
  the stitch comparison, jagged red half against smooth green ramp. Cycle 1:
  rigs pulled from mid-room (z −2.0) to 3.8 m inside the door, scaled 1.15×,
  seated onto 0.8 m pedestals (they visibly floated before — confirmed in the
  inside still), emissive lift 0.25, wander narrowed so feet stay over the
  pedestals, seam bars enlarged 1.25× — q 0.30 → 0.53. Cycle 2: mirrored the
  seam halves (see shell note below) so the summary's "hard cut on the left" is
  true on entry — q 0.54. One cycle of budget unspent.
- **35 (PRESENT).** Forecourt comparison underfoot plus an eye-height lectern by
  the door (flat grey against `asphalt()`-sampled patch with puddle), brass
  verb markers with the refused verb toppled. Inherited; untouched this lane.
- **45 (PRESENT).** Raw faceted voxel shell with a punched hole (glowing tear
  ring) on the left, welded/filled/smoothed shell on the right, both large
  against contrasting backdrops. Inherited; untouched this lane.
- **57 (PRESENT).** Room floor is the two-scale ocean: long swell on one side,
  swell plus directional chop and crest foam on the other. Demo maths kept,
  laid wall to wall with display gain on height only. Inherited; untouched.
- **18 (PRESENT).** Walk-in meadow: instanced tapered blades over a ridge,
  wind-blown, thinning into cheaper LOD rings. Strongest detail score in the
  lane. Inherited; untouched.
- **47 (PRESENT).** Street cell walked door-to-back: treated road/pavement/
  facades at the door decaying to greybox beyond. Static by design (mot 0%).
  Inherited; untouched.
- **4 (PRESENT).** Submerged hulls doming two water sheets; the right sheet's
  naive waterline cut tears by design with emissive tear markers. The
  catalogue blocker (cutting unsolved upstream) is the exhibit; the limitation
  says the cut is shown FAILING. Inherited; untouched.
- **15/30/44 (stubs).** Honest empty rooms with the reason on the wall: 15
  needs a native C++/Vulkan build and an owner product decision; 30 needs a
  video generator this lane may not run; 44 has no repository, tool or licence
  behind either post. Untouched; no cycles apply.

## World-shell findings — reported, not edited

- **Placement rotation mirrors left/right.** `world.ts:224` sets
  `group.rotation.y = atan2(ox, oz)`; for room 16 the outward is −Z so the room
  sits at π and local +X reads on the visitor's left (verified against two
  captures, then against the code). Any summary promising "X on the left" is
  false unless the room compensates, as 16 now does. This is systematic: every
  side-by-side comparison room on a rotated slot is affected the same way
  (e.g. source 2's "left water / right water"). Fixing those summaries belongs
  to their lanes or to the world owner; I changed only room 16.
- **Doorway settle lottery.** A temporary multi-angle probe (since removed)
  showed the gate's doorway teleport for room 16 can settle the player in
  different places run to run — once in the corridor facing the opposite door
  (doorway coverage 0.148), twice inside the room (0.35+). Spawn sits 1.5 m
  inside the room past the vestibule gap, plausibly inside collision geometry,
  so ejection decides the framing. Scores for every room therefore carry
  run-to-run wobble; room 16 read 0.30/0.53/0.54 across three identical-code
  builds with only staging changed. Do not re-tune rooms to chase single
  runs. Probe scratch (`qa/probe16-tmp.mjs`, `qa/probe16/`) removed.

## What I did not verify

- Technique correctness anywhere: the gate measures frame statistics, and so
  do I. Every limitation stands as written.
- Walk-through with a real player (WASD, collisions, streaming at pace). Only
  the two gate viewpoints as stills, plus removed-probe angles on 16.
- Motion-dependent reads beyond error-free update paths: 57's chop (mot 24% —
  the liveliest water), 45's shells, 16's march. A human should watch each
  ~10 s.
- WebGL-fallback (`low`) staging beyond count-halving in code. All captures
  ran on the NVIDIA WebGPU adapter.
- Frame rate / draw-call / triangle budgets under load — reasoned (shared
  geometries/materials, capped segments), not measured.
- Whether `dist/` was rebuilt by another lane between my build and any given
  capture. All numbers above come from one final build+capture loop on port
  5196 against the final tree.
- Other lanes' files and the world shell/layout/atlas: read for diagnosis
  (rooms.ts override keying, world.ts lifecycle, layout.ts slots, player
  teleport), never edited — except `source-16-kimodo-rigs.ts`, the one room
  file in this lane needing work. The `w2-prev5196` server (port 5196) was
  left running: never kill a process.

## For the human walking in

Look for: the honest empty doors (59/15/30/44 — read the cards); the twin
waters (2); three bright rigs marching on pedestals with the jagged-vs-smooth
stitch wall behind them, hard cut on your left (16); the lectern by 35's door
then the full floor comparison with brass verbs and the toppled refusal; raw
vs cleaned shells with the glowing tear ring (45); swell-vs-chop underfoot
(57); the meadow and its ridge (18); greybox melting into treated street
(47); the domed sheet vs the torn cut with glowing staples (4). In 16, walk
to the middle and look back at the wall: the red jagged half should be on
your left. If it is not, the room's rotation compensation is wrong and the
summary lies — say so.
