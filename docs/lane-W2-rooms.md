# Lane W2 — rooms report

12 rooms owned, worst-first. Gate: `node qa/room-shot.mjs --source <id>` against a
`build:nocheck` + `vite preview` on port 5198 (own port; port 5199 left to other lanes).
All verdicts below are the gate's final numbers; PRESENT is not claimed as technique
correctness. No room imports another; all state is per-file, seeded, disposed, and
quality-scaled. `three` 0.185.1 API only.

## Final verdicts

| source | room | door | inside | verdict |
|---|---|---|---|---|
| 20 | armour duel + plate rack | 17.4% | 22.1% | PRESENT |
| 28 | threshold dissolve pair | 34.5% | 17.6% | PRESENT |
| 34 | contracted vs broadcast boxes | 49.1% | 37.3% | PRESENT |
| 40 | voxel towers, stale vs live windows | 31.1% | 63.7% | PRESENT |
| 49 | snap vs spring hinge chains | 19.6% | 35.2% | PRESENT |
| 59 | Graalitoo X (stub) | 1.9% | 23.7% | EMPTY, honest |
| 17 | failing vs meeting quality bar | 34.9% | 60.9% | PRESENT |
| 45 | raw vs cleaned shell | 11.6% | 46.1% | THIN |
| 60 | concept panel + derived diorama | 29.2% | 60.6% | PRESENT |
| 4 | hull doming + failing cut | 39.7% | 40.9% | PRESENT |
| 9 | leaky vs clean engines | 37.3% | 33.5% | PRESENT |
| 18 | grass meadow floor | 20.1% | 45.2% | PRESENT |

`npx tsc --noEmit`: zero errors in all 12 owned files (other lanes' files error;
not mine, not touched). No console errors from any owned room in any capture. The
pervasive `404` in every report's error list is host-level (present for all sources,
unrelated to rooms). Source 45's `computeBoundingSphere NaN` from cycle 1 is fixed
and gone (cause: fixed-size surfacing buffer overrun; now growable arrays).

## Per room

**20 — Engine-free armour and ballistics.** Walk in on two 4 m tanks mid-duel,
barrels crossing, a tracer in flight, gold lane between them, plate rack on the
back wall flashing ordered hits. Restaged: demo maths kept (front-face quad +
module-box ordered resolution, pen interpolation, 2-sigma dispersion), duel pulled
to ±2.5 m / z −2 so hulls sit inside the doorway frame. PRESENT, viewed.

**28 — Threshold dissolve.** Walk in on two 5.6 m panels in a shallow V: teal
intact beside orange dissolving with a cream edge band, threshold animating.
Restaged: demo's hash-noise/threshold/edge-band graph kept per-vertex, moved from
z +4.6 to z −1.2 (cycle 1 scored 2.5% — too far back). Before-panel evaluated at
−0.1 so it reads fully intact; panel emissive cut 0.18 → 0.05 against wash-out.
PRESENT, viewed (pair verified; the final emissive value itself judged by metric,
not re-viewed).

**34 — Subsystem contracts.** Walk in on two rows of six 1.8 m coloured blocks,
green pulses riding declared edges left, red pulses fanning everywhere right,
pulses shrinking by the source quadratic falloff. Restaged: rows from z +1.2 to
z −1, boxes 1.5 → 1.8 m, pulses 0.2 → 0.3 m, backdrops lit with a faint emissive
lift (cycle 1 scored 2.9% — small and light-starved). Human check: the difference
is in motion over seconds, not in one still. PRESENT, viewed.

**40 — Voxel windows.** Walk in on two 5.4 m towers banded with amber windows;
ceilings carve on a 0.55 s timer, left tower keeps glowing from its stale list,
right goes dark as the hollow-plus-ceiling query re-runs. Restaged: demo's
`litRoomCells` query kept verbatim, CELL 0.52 → 0.6, towers to z +0.5, structure
lightened so it cannot crush to black. PRESENT, viewed.

**49 — Motion scaffold.** Walk in on two 2.8 m five-hinge chains on a measurement
disc, terracotta snapping with corners beside sage gliding, tip trails drawing
both paths. Restaged: demo's critically-damped spring + 4-frame rolling context
kept, chains to z −1.2 with emissive-lifted materials (was THIN 11%). PRESENT,
viewed.

**59 — Graalitoo X article.** Stub, as the catalogue demands: body never
retrievable, no method, nothing to stage. The door opens onto the world's honest
empty room plus the wall card. EMPTY is the correct verdict; building anything
would invent the article. No capture-fix cycles apply.

**17 — Quality bar.** Walk in on a split diorama: sparse grey tufts and one flat
tree layer left, dense wind-blown blades with three canopy layers and a second
paler ridge behind right. Restaged: demo's four comparator properties kept at
room scale (1500/700 blades, depth-separated ridges). PRESENT, viewed. KNOWN
DEFECT (not fixed — would need an unverified rebuild to confirm): canopy cones
float ~1 m above their trunk tops (cone bottom ≈ 1.1·s+0.8 vs trunk top 1.1).
Fix: lengthen trunks to meet the cones.

**45 — Mesh cleanup.** Two voxel shells from one synthetic field: faceted red
with a glowing hole-ring left, smooth green with a sealed cap right, slow
turntable. Restaged + NaN fixed (see above). Cycle history: 1.9% EMPTY (NaN-culled)
→ 34.0% PRESENT (too close, markers cropped) → 11.6% THIN (pulled to z +0.5,
scale 1.25 — opened a centre gap that cost coverage). Three cycles used; stopping
per the brief. A walker sees whole shells with markers; the gate sees the gap.
Next step for a future pass: pull shells inward to x ±2.6 instead of backward.

**60 — Image-to-game.** Baked 6.2 m concept panel (emissive-lifted data texture)
left, ridge-derived skyline blocks + street slabs + pacing amber mover right.
Restaged forward from the back wall (was THIN 7.4%). The panel-to-diorama read
needs a head turn; acceptable for a comparator. PRESENT, viewed.

**4 — Underwater cut.** Walk in on two cyan sheets at waist height: left doming
over red hulls with glowing tear staples on a deliberately quantised tear, right
smooth with a sun glint. Restaged: demo's dome + laminar terms kept per-vertex,
grid quality-scaled (56/28). Catalogue blocker honoured: the cut is shown
FAILING, tear counted. PRESENT (39.7%), viewed. The tear staples render pale
rather than orange — cosmetic, technique unaffected.

**9 — Frame-loop audit.** Walk in on two engines: red housing climbing its red
bar and piling debris cubes beside green holding flat. Baseline PRESENT was
re-checked visually and found FALSE — blank doorway (engines at z +1.8 fell
outside the readable frame; the 25.2% was backdrop slabs plus lamp gradient, not
technique). Restaged to z −1.5 / x ±2.6 with inward-mirrored bars: genuinely
PRESENT 37.3%, viewed. Lesson: never trust the number without the picture.

**18 — Grass meadow.** Walk in on the technique as floor: 2400 jittered-grid
Bezier blades (1100 on low) over a ridge, three LOD rings, four-layer wind as
root rotation. Added a 2.5 m doorway apron rejection (cycle-1 blades stood in
the visitor's face). PRESENT (20.1%), viewed. Per-blade base orientation stored
so wind never snaps blades upright.

## What I did not verify

- Technique correctness in any room — the gate measures doorway coverage only,
  and so do I. Every limitation in the room files stands.
- Walk-through with a real player (WASD, collisions, streaming at walking pace).
  Only the two gate viewpoints per room, as stills.
- Motion-dependent reads (34's edge-vs-broadcast difference, 40's carve cycle,
  49's trail divergence, 9's bar climb) beyond confirming the update paths run
  error-free. A human should watch each for ~10 s: pulses taking different
  paths, windows dying only on the right, trails diverging, the red bar climbing.
- WebGL-fallback (`low`) staging beyond code inspection and count-halving. All
  captures ran on the NVIDIA WebGPU adapter.
- Frame rate / draw-call / triangle budgets under load — counts were reasoned
  (instancing throughout, pooled tracers, capped debris/trails), not measured.
- The final single-parameter tweaks on 28 (emissive 0.05) and 18 (apron) were
  judged by metric, not re-viewed; geometry unchanged, risk minimal but honest.
- 59's empty room: never walked in; the world renders the stub card, not me.

## For the human walking in

Look for: tracers and rack flashes (20); the edge band creeping as the orange
panel breathes (28); green pulses on rails vs red pulses everywhere (34); windows
dying right-only after each carve tick (40); the sage trail cornerless against
terracotta (49); the honest empty door (59); floating cones defect (17); ring vs
sealed cap (45); panel-ridge matching block skyline (60); the tearing left sheet
vs smooth right (4); red bar climbing while green holds (9); wind gusts rolling
across the meadow (18).
