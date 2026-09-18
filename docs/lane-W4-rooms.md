# Lane W4 — rooms report

12 rooms owned, 12 files written, nothing else touched. Order worked worst-first
as briefed. All captures against `http://localhost:5199/skills-lab/` (vite preview
serving this repo's `dist/`, rebuilt after every edit round) on a real WebGPU
adapter. PRESENT is reported as what it is — something big enough to see — never
as a claim the technique is correct.

## Gate results

1. `npx tsc --noEmit` — **exit 0, zero errors** (full project, final state).
2. `node qa/room-shot.mjs --source <id>` per room:

| source | room | door | inside | verdict |
|---|---|---|---|---|
| 24 | TAKEN | 2.9% | 18.8% | EMPTY FROM THE DOOR (honest stub) |
| 30 | motion reference bridge | 2.5% | 17.9% | EMPTY FROM THE DOOR (honest stub) |
| 37 | fable-test conversion | 24.9% | 20.7% | PRESENT (was 4.9% EMPTY) |
| 43 | lighting as parameter | 55.0% | 51.3% | PRESENT (was 3.6% EMPTY) |
| 55 | Project Aether | 1.5% | 5.5% | EMPTY FROM THE DOOR (honest stub) |
| 14 | Claudefare rubric | 14.3% | 18.8% | PRESENT (was 9.6% THIN) |
| 26 | arcade ring | 14.8% | 42.5% | PRESENT (was 6.2% THIN) |
| 50 | passability sweep | 20.1% | 39.3% | PRESENT (was 9.8% THIN) |
| 1 | mocap plant step | 41.2% | 31.3% | PRESENT first capture |
| 6 | img2threejs contract | 34.5% | 45.7% | PRESENT first capture |
| 11 | scaffold + hero | 20.5% | 31.9% | PRESENT first capture |
| 48 | dark interior | 66.8% | 15.6% | PRESENT first capture |

## Per room: what a visitor sees, what was restaged

- **24 TAKEN (`source-24-taken.ts`)** — stub, no geometry. Door opens onto an
  empty room whose wall card carries the blocker: playable page fetched, no
  repository resolves, register search closed negative. Building ground cover
  here would credit this source with our work, which its blocker forbids.
- **30 motion bridge (`source-30-motion-reference.ts`)** — stub. Card states the
  bridge (video → pose → retarget → ship rig data only) and why it is blocked
  (GPU generation out of scope; a rig scene without the video would demo
  retargeting, not this row's bridge).
- **37 fable-test (`source-37-fable-test.ts`)** — two 5.6 m bays, blocks to
  2.6 m. Left: records fed raw, lying wrong; right: same records through the
  demo's converter, revealed behind a progress fill on a 5 s loop. Reused the
  demo's `convertZupCentimetres` verbatim plus its record shape. Round 1 THIN
  (7.5%) → moved bays from z=+1.2 to −1.0 → PRESENT.
- **43 Lumera (`source-43-lumera.ts`)** — two 5.6 m bays. Left: one merged mesh
  with the demo's `bakedShade` folded into vertex colour; right: four separable
  props under a real point light orbiting on a loop. Reused demo props, bake
  position and irradiance fold. Round 1 THIN (6.4%) → moved bays z +1.4 → −0.8
  → PRESENT.
- **55 Aether (`source-55-aether.ts`)** — stub. Card: claim unverified (only a
  Discord invite recoverable), nothing established, nothing staged.
- **14 Claudefare (`source-14-claudefare.ts`)** — two 4x viewmodels at eye
  height, barrels toward the door. Left: floating, one skin material, no light;
  right: arm to a shoulder anchor, gunmetal/cloth contrast, muzzle light on a
  1.6 s firing cadence plus an emissive flash ball. Round 1 THIN (9.7%) → moved
  z +1.6 → −0.8 → PRESENT.
- **26 arcade ring (`source-26-arcade-menu.ts`)** — ring arithmetic, short-way
  delta, two-stage commit and clamped accent kept verbatim from the demo at
  1.7 m card width; focus totem pillar, hero plate, wall-size raw/clamped
  swatches, focus rail. Round 1 THIN (7.4%; doorway saw only the hero plate) →
  moved installation z +2.2 → −0.6 → PRESENT.
- **50 QA sweep (`source-50-qa-harness.ts`)** — two 9 m corridors with the
  demo's `sweepCorridor` re-implemented (1.5 m stations, 0.34 m disc, widest
  gap). Left keeps the crate-pair defect (red stations), right is cleared
  (green), floor washed by verdict, one disc per station, travelling sweep bar
  on a 6 s loop. PRESENT first capture.
- **1 mocap (`source-01-mocap.ts`)** — two 2.2x FK figures (~3.4 m) on one
  ground sheet with plant-target discs. Demo's RIG numbers, action-spec beats
  and hip-height bisection kept; bisection runs per frame against the live
  scene graph. PRESENT first capture (41.2% — large but inside the room).
- **6 img2threejs (`source-06-img2threejs.ts`)** — two 5x jerry cans on plinths
  from the demo's spec (6 components, 3 sockets, collider compound, budgets).
  After half draws brass socket markers, a wireframe collider and a bobbing
  probe; red FAIL / green PASS verdict bars behind each half from the
  re-implemented action-ready gate. PRESENT first capture.
- **11 scaffold (`source-11-hero-scaffold.ts`)** — two 6.4 m scaffolded plots
  (ground, 5 props, verb ring). Before hero sunk sideways, after hero measured,
  rescaled, re-seated and faced onto the mark; both walk toward it on a loop.
  One deliberate deviation: the demo's −PI/2 facing lands the +X nose on +Z, so
  the room uses +PI/2 to face the door-side mark — recorded here, limitation
  text unchanged. PRESENT first capture.
- **48 interior (`source-48-interior-look.ts`)** — two 5.6×12 m half-corridors:
  flat-lit left, value-composed right (emissive fixtures, 2 local lights on
  visible fixtures only, per-vertex darkening, matte patches, 3 red accents,
  130 motes, one travelling exposure event). Three captures: 80.0% with the
  flat half blown white → 70.7% at 0.33 grey → **66.8% at 0.16 grey** with
  columns dropped to match. The world lamp runs ~4x hot on these surfaces, so
  mid-grey paint must be authored dark. Stopping here: gate passes strongly and
  the comparison reads (flat bright vs composed dark).

## What was NOT verified

- **Technique correctness was not verified for any room.** PRESENT means
  visible-from-the-door only. Walk-in checks a human should do: 1 — support
  foot stays planted through the crouch beat on the right figure only; 6 —
  probe bobs on the pour socket and bars read FAIL/PASS; 11 — right hero faces
  the brass ring; 14 — muzzle flashes ~every 1.6 s; 26 — ring steps the short
  way and the rail follows the focused card; 37 — after-blocks appear with the
  green fill; 43 — moving light relights only the right bay; 48 — exposure
  block travels the dark end every 9 s; 50 — left corridor shows red discs mid
  corridor, right all green.
- **Draw calls exceed the rough 12/room budget** in the articulated and
  architectural rooms (mocap ~27, viewmodel ~16, ring ~14, sweep ~27, interior
  ~29, fable ~22, lumera ~10, jerry ~21, scaffold ~21). Geometries and materials
  are shared within each room; triangle counts are small (boxes/spheres, well
  below 60k). Reducing further means InstancedMeshes or dropping the
  before/after comparison the brief asks for — left as is, disclosed here.
- **Stubs 24/30/55 were verified only as honest empties** (wall card via the
  world shell, which I did not screenshot-read). Their EMPTY verdicts match the
  pre-existing stub baselines to within 0.5%.
- Console errors on every capture: a **favicon 404** (probed: catalogue URL
  returns 200, favicon 404 — pre-existing site gap, not a room) and, on the
  round-1 source-37 capture only, a `BufferGeometry.computeBoundingSphere`
  NaN-radius error. Console output is page-global (up to four rooms live), so
  the NaN is unattributed; none of my geometries can produce NaN (all extents
  positive constants or seeded positive ranges) and it did not recur in round 2.
- **Full `tsc --noEmit` passed exit 0 only at the end**; mid-lane it failed on
  other lanes' files (source-29, source-4, source-49, source-51 at various
  times — not mine, not touched). Scoped check of my 13 files passed clean
  before the fix cycles; every fix cycle was re-verified by rebuild + capture,
  and the final full run is green.
- Mechanical notes: several of my file edits landed on wrong line ranges
  (edit-tool range drift) and briefly broke declarations in 37 (`converted`),
  43 (`BAKE`), 14 (helper body), 26 (header) and 48 (floor block). Each was
  repaired in the same pass; the mid-lane scoped-tsc error list is the receipt,
  and the final green run plus working captures are the proof. No other lane's
  file was touched — collision check at finish: exactly one file per owned
  sourceId in `src/world/rooms/`. Overlap warning: brief W6 also lists sources
  11 and 55; no W6 files for those ids exist at finish, so no conflict
  materialised, but the orchestrator should know the assignment overlaps.
- Not checked: 390 px mobile width, WebGL-fallback `low` quality paths (code
  halves counts but was never captured), disposal under streaming (dispose
  releases every tracked geometry/material/texture by construction; streaming
  itself not exercised), and neighbour leakage beyond staying inside ±7/±8
  bounds by construction (48's doorway screenshots show only world chrome
  through the open corridor ends).
