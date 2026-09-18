# Lane W1 — rooms report

13 rooms owned, 13 files written, 1 report (this file). No other files touched.
Preview server on :5199 belongs to another lane; used as-is, never restarted or killed.

## Gate results (final, `node qa/room-shot.mjs`, nvidia adapter, WebGPU/high)

| source | door | inside | verdict | captures used |
|---|---|---|---|---|
| 3 stylised water | 45.8% | 47.1% | PRESENT | 1 |
| 8 jungle | 15.7% | 44.7% | PRESENT | 1 |
| 13 gauntlet loop | 12.6% | 26.8% | PRESENT | 1 (marginal, did not grind) |
| 16 kimodo rigs | 16.0% | 33.8% | PRESENT | 2 |
| 19 raytracer | 33.9% | 37.6% | PRESENT | 2 |
| 27 feel loop | 16.5% | 31.3% | PRESENT | 2 |
| 32 WAN 2.2 | 2.9% | 17.9% | EMPTY (honest stub, blocked) | 1, no fix attempted |
| 39 editor ops | 19.0% | 42.6% | PRESENT | 1 |
| 42 vibe shelf | 16.9% | 53.4% | PRESENT | 1 |
| 46 bubble ocean | 21.6% | 40.1% | PRESENT | 1 |
| 54 pickup | 16.0% | 19.8% | PRESENT | 2 + 1 transient CDP crash, passed on retry |
| 56 smart mesh | 29.4% | 15.4% | PRESENT | 2 + 1 transient CDP crash, passed on retry |
| 58 dermis bust | 27.6% | 11.7% | PRESENT | 3 (one self-inflicted runtime break, repaired) |

`npx tsc --noEmit` final: clean, exit 0, zero errors project-wide.
Every capture logged one console error: `Failed to load resource: 404` (present on all rooms
including untouched lanes; favicon-level, not room code). No per-room errors in any final report.

## The one thing that mattered

The doorway camera stands 4 m inside the room (local z = −4, eye 1.62) looking toward the
back wall; the inside camera stands at room centre looking the same way. My first pass put
every hero at z ≥ +1, behind both sight cones: 19 scored 3.2%, 58 scored 3.2%. Moving heroes
to z ≈ −2.5 (19: 3.2 → 33.9; 27: 10.3 → 16.5; 16: 7.1 → 16.0) fixed all of them. 54's 4.6 m
truck could not sit on the centreline without photobombing the inside camera, so it moved
off-axis to (2.5, −1.5) and swings ±26° instead of spinning. 58 needed a third cycle:
shoulders, cropped fringe, plinth rim and two presentation wings (9.3 → 27.6).

## Per room

- **19 raytracer.** Walk in: three large orbs (gold metal, glass, red clearcoat) on plinths
  around you, the CPU Whitted trace printed 10.5 m wide on the back wall behind them.
  Restaged: demo's tracer runs at build into a DataTexture; spheres rebuilt at 1.1 m radius.
  Human check: print matches plinth order left-to-right; glass orb shows checkerboard through it.
- **27 feel loop.** Walk in: striker arm mid-swing left, teal dummy right, green cooldown / red
  hitstop bars on the back wall, flash pops every 1.4 s. Restaged: demo's update order
  (cooldown → hitstop → physics → decay) unchanged, arena moved to z = −2.2, flash faced door.
  Human check: arm freezes 0.12 s on impact while flash peaks.
- **32 WAN 2.2 (stub).** Walk in: honest empty room; wall card carries the blocker (weights
  unpinned, licence unverified, no GPU generation). Built nothing, correctly.
- **39 editor ops.** Walk in: empty grey grid left, built terrain with rocks/shrubs/pulsing
  trigger rings right, operation log as colour bars on the back wall.
  Human check: rings pulse; divider reads as before/after.
- **46 bubble ocean.** Walk in: two basins, pale-grey tint left, green-shifted scatter right
  over one wave field, foam on crests. Restaged physics only, no product code.
  Human check: at a crest the right basin goes green while the left goes white.
- **58 dermis bust.** Walk in: mannequin head with strand hair and hazel irises on a rim-lit
  plinth, chapter boards flanking. Limitation owned on the wall: not a likeness route.
  Human check: blink every 3.7 s; breeze in the strands; fringe stays off the face.
- **16 kimodo rigs.** Walk in: three colour-coded rigs (22/30/34 joints) marching, seam wall
  behind showing jagged red (hard cut) then smooth green (blended stitch).
  Human check: left pair pops at the seam, right pair glides.
- **42 vibe shelf.** Walk in: six emblem plinths in two rows; seventh plinth on its side, empty
  (no licence file, stays off the shelf). Index only, nothing installed.
- **56 smart mesh.** Walk in: robed mage turning between noisy dense rock and clean retopoed
  rock with green wireframe lift; poly bars on the back wall.
  Human check: wireframe sits exactly on the clean rock surface.
- **3 stylised water.** Walk in: one beach, flat water left, depth ramp + foam + wake right,
  boat on the after side. Highest door score of the lane (45.8%).
- **8 jungle.** Walk in: thicket of instanced leaf cards and mossy trunks; two giant leaves on
  the back wall show the dark-outline bug beside the fix.
- **13 gauntlet loop.** Walk in: rough red vs clean green figure on benches, critic booth with
  red pen, regression bars growing, budget dials. Marginal 12.6% — left alone per no-grind rule.
- **54 pickup.** Walk in: blue pickup swinging on yellow stands with full underbody
  (rails, driveshaft, exhaust, arms), outliner bars on the wall. Authorship claims not repeated.

## Cost (headless construction smoke, quality=high; positions do not change counts)

Draws/tris: 3: 6/1648 · 8: 24/2982 · 13: 16/1308 · 16: ~40/3554 · 19: 9/3112 · 27: 12/1304 ·
32: — (stub) · 39: ~50/5394 · 42: 20/1130 · 46: 6/2352 · 54: ~34/~900 · 56: 12/1242 ·
58: 23/2509 (re-measured after final edit). All far under 60 k tris; most over the rough
12-draw guidance with tiny static geos (≈100–150 draws with four rooms live — trivial).
Determinism: two builds per room, identical counts. Dispose/update exercised headless.

## What was NOT verified

- Technique correctness anywhere: PRESENT means visible, never right. The raytracer was not
  validated pixel-against-source; the ocean is sine crests, not FFT; foam is a proxy.
- A real human walkthrough: I never entered the world with a mouse. Camera paths only.
- WebGL/low appearance: captures ran WebGPU/high; low counts only smoke-tested headless.
- Frame rate: no timing measured in-browser.
- 58's inside view (11.7%) is thin by construction — the bust sits behind the centre camera.
  Acceptable: the door view is the gate, and walking visitors meet the bust face-on.
- 13 at 12.6% has no margin; any restyle of neighbouring content could tip it back to THIN.
