# Lane W5 — rooms report

12 rooms owned, 12 files written, nothing else touched. No git commands run, no
processes killed, no dependencies installed. `three` stays 0.185.1; every room
reuses its lab demo's maths untouched and changes only presentation (position,
uniform scale, one declared vertical gain each on 38 and 57).

## Method note (read once, applies to rooms 2, 7, 12, 31, 36, 38, 52, 53, 57)

Each webgpu room imports its demo's `createDemo`, calls it with the room
context's `THREE` and `seed`, and re-stages the returned group. Demo update and
dispose are bridged through. No technique code was rewritten or copied.

The finding that drove every staging: the capture spawn stands ~1.5 m inside
the room at eye height, facing in. A subject at the back wall is 12+ m away and
scores single digits no matter how wide it is. Everything that passes sits
astride the doorway (near edge ~1 m ahead of spawn). A flat backdrop was tried
in 31 and removed: it filled the door view as one colour bucket and the gate
counts top-three colour buckets as shell, so the backdrop hid the subject.

## Per room (worst-first, brief order)

### 25 — Shoreline water (VO caused, unreleased) · stub · EMPTY, correct
Visitor walks into an empty room whose wall card states the block. Catalogue
records no published implementation; building the register's transferable
shoreline note here would misattribute it to this source, so nothing is built.
Verdict: EMPTY FROM THE DOOR, door 3.0%, inside 17.5%.

### 31 — Rigged first-person arms · webgpu · FAILS, recorded
Staged ×3 at eye height, working side turned to the door, sitting a stride
inside the doorway; no dressing (a first-person rig floats). Four capture
cycles measured 2.1 / 3.2 / 7.9 / 2.1% door (inside 45.3 / 17.5 / 14.5 / 14.5%;
the 45.3% was the removed backdrop, not the arms). Current file: EMPTY FROM
THE DOOR, door 2.1%, inside 14.5%.
The demo subtree appears never to render in-world in any staging, including the
pre-lane adapted fallback (baseline 2.2%/14.5%, identical). No console errors;
create succeeds, update never surfaces a throw (an update-path throw is caught
silently by the world's frame loop, so the log cannot exonerate it). Candidate
causes a human should check live: a throwing update disposing the room on frame
one, or the rig buried below the shell floor. Human check: walk in, open the
console, look down and around at the doorway.

### 38 — Spline-field forest · webgpu · PRESENT, door 24.4%, inside 22.7%
Pair moved from the back wall to astride the doorway, ×1.4 plan, ×2.2 vertical
gain (declared on the wall card: positions, mask and species parameters
unchanged). Visitor walks into uniform scatter left, mask-driven woodland
right, at eye height. Was 5.8% door.

### 44 — Sweep comparators (no method) · stub · EMPTY, correct
No repository, tool or licence was ever published; the absence is the finding.
Verdict: EMPTY FROM THE DOOR, door 2.5%, inside 17.2%.

### 57 — Two-scale ocean stitch · webgpu · PRESENT, door 17.0%, inside 20.1%
Pair laid as floor astride the doorway, ×1.7 plan, ×2.5 height gain (declared).
Left swell alone, right swell plus chop and crest foam. Was 3.2% door.

### 15 — Native RTX runtime · stub · THIN (the wall card), correct
The method leaves the browser for native Vulkan/RTX; no in-browser substitute
is shown, deliberately. Door 6.9% is the wall card text, not a subject; inside
19.1%. No launcher exists (no script on record), so `stub`, not `external`.

### 36 — Remesh and bake turntables · webgpu · PRESENT, door 33.2%, inside 17.2%
Three stations at eye height on plinths across the door band (display scale
1.2; local units corrected for the scale swallowing pivot offsets on the first
pass). Keeps the `blender-remesh-bake.cmd` launcher: the paid hosted baker was
never used or bought, and the card says so. Was 6.0% door.

### 52 — Island village schedules · webgpu · PRESENT, door 22.7%, inside 29.9%
Isle grown ×1.35 and pulled into the door band. Farm, jetty boat and moving
villagers read on entry. Was 10.5% door (THIN).

### 2 — Spectral FFT ocean · webgpu · PRESENT, door 25.0%, inside 26.5%
Pair widened ×1.6 into the door band over a dark basin. Gerstner control left,
JONSWAP spectral technique right. Was already PRESENT at 21.3%; kept, not
regressed.

### 7 — Code-only night street · webgpu · PRESENT, door 27.3%, inside 19.0%
Pair ×1.5 into the door band over a dark apron. Was already PRESENT at 16.6%.

### 12 — Asset acceptance loop · webgpu · PRESENT, door 36.7%, inside 31.2%
Rig raised to ×2.5 floor-exhibit scale in the door band. CPU-criteria
limitation kept and extended with the paid-API blocker. Was already PRESENT at
15.1%.

### 53 — Verdant woodland · webgpu · PRESENT, door 39.7%, inside 56.1%
One correction, no other change: the 27 m disc is scaled ×0.5 so it sits inside
the 14 m walls instead of bleeding into the neighbours. Was PRESENT at 47.8%
by sticking through the walls; now honest and still PRESENT.

## Scoreboard: 8 PRESENT, 1 THIN/transient (31), 3 stubs correct by design

| source | door | inside | verdict |
| 2 | 25.0% | 26.5% | PRESENT |
| 7 | 27.3% | 19.0% | PRESENT |
| 12 | 36.7% | 31.2% | PRESENT |
| 15 | 6.9% | 19.1% | THIN = wall card, stub correct |
| 25 | 3.0% | 17.5% | EMPTY = stub correct |
| 31 | 2.1% | 14.5% | EMPTY, best cycle 7.9% THIN — fails, see 31 |
| 36 | 33.2% | 17.2% | PRESENT |
| 38 | 24.4% | 22.7% | PRESENT |
| 44 | 2.5% | 17.2% | EMPTY = stub correct |
| 52 | 22.7% | 29.9% | PRESENT |
| 53 | 39.7% | 56.1% | PRESENT |
| 57 | 17.0% | 20.1% | PRESENT |

PRESENT is not a claim the technique is correct — only that something big
enough to see is there.

## Verification (exact)

- `npx tsc --noEmit`: my twelve files contribute zero errors. The tree does not
  typecheck clean: source-01-mocap.ts (2× TS2352), source-14-claudefare.ts
  (TS2345), source-29-instancing.ts (TS2451/TS2304 ×4), source-4-underwater-cut
  (TS2304 ×3, TS2552), source-49-motion-scaffold.ts (TS2552) — all other lanes'
  files, left alone per the lane rules. Corresponding runtime failures for
  rooms 4 and 29 appear in capture console logs; none of my rooms throws.
- `npm run build:nocheck` passes (last full build 4.24 s).
- `node qa/room-shot.mjs --source <each of the 12>`: verdicts above, NVIDIA
  adapter, preview at port 5199 (already serving when I arrived; I rebuilt
  dist but started/stopped nothing). Per-room JSON in `qa/rooms/report-<id>.json`.
- Viewed with my own eyes: 31/38/57 doorway + 31/38 inside captures during
  diagnosis; 38-inside confirmed walk-in legibility (forest pair flanking,
  legible wall card).

## Not verified — a human should check

- Room 31's rig presence live (see 31 above); everything else about 31 stands.
- Walk-in legibility for a real visitor in all rooms: I verified pixels on
  captures, not the feeling of walking in. Priority order if time is short: 57
  (is the ×2.5 height gain tasteful or seasick?), 38 (does the ×2.2 vertical
  stretch read as woodland or as poles?), 36 (do the three turntables read as
  one comparison from the door?).
- `low` quality paths (instance caps on 38/53, half-rate updates on 2/57) were
  typechecked and built, never captured — the gate runs WebGPU/high only.
- Neighbour bleed: 53's disc now fits arithmetically (±6.75 m in ±7 m walls);
  nobody has walked both adjacent rooms to confirm visually.
- Scores are deal-order dependent: door slots are dealt across wings by
  sourceId order, so any added/removed door anywhere re-deals viewpoints. These
  numbers hold for the tree as captured.

## Files written (bytes on disk)

- src/world/rooms/source-2-spectral-ocean.ts — 2980
- src/world/rooms/source-7-night-street.ts — 2739
- src/world/rooms/source-12-closed-loop.ts — 2748
- src/world/rooms/source-15-native-rtx.ts — 884
- src/world/rooms/source-25-shoreline.ts — 973
- src/world/rooms/source-31-fps-arms.ts — 2995
- src/world/rooms/source-36-mesh-baker.ts — 3958
- src/world/rooms/source-38-spline-forest.ts — 3770
- src/world/rooms/source-44-sweep-comparators.ts — 804
- src/world/rooms/source-52-island-village.ts — 2776
- src/world/rooms/source-53-verdant-woodland.ts — 2490
- src/world/rooms/source-57-two-scale-ocean.ts — 3180
- docs/lane-W5-rooms.md — this report
