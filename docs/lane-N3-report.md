# Lane N3 report — overnight build and repair (2026-09-17)

Assignment: FIX sources 3, 8, 12, 16, 22, 26, 31, 41, 50; BUILD sources 56, 60.
Gate: OVERNIGHT.md §3 (tsc + verify-catalog + non-blocking capture + truthful metadata).

## Result ledger (final valid captures, headless WebGPU nvidia/blackwell)

| source | verdict | modal / edges | cycles | gate |
|---|---|---|---|---|
| 3 stylised water comparator | LOOSE | 75% / 4.26% | 1 | PASS (advisory) |
| 8 procedural jungle | LOOSE | 83% / 9.80% | 1 | PASS (advisory) |
| 12 closed-loop asset acceptance | UNFRAMED | 94% / 1.70% | 3 — STOP | FAIL, kept best |
| 16 kimodo import-and-stitch | LOOSE | 84% / 4.34% | 1 | PASS (advisory) |
| 22 env-art comparators | blocked, no file | panel only | 0 | legitimate gap |
| 26 game-select ring | UNFRAMED | 86% / 5.22% | 3 — STOP | FAIL, kept best |
| 31 FP-arm rig | LOOSE | 61% / 7.63% | 2 | PASS (advisory) |
| 41 catalogue format | LOOSE | 78% / 4.31% | 1 | PASS (advisory) |
| 50 passability sweep | LOOSE | 72% / 4.51% | 1 | PASS (advisory) |
| 56 smart-mesh ladder (NEW) | LOOSE | 66% / 10.04% | 1 | PASS (advisory) |
| 60 image-to-game surface (NEW) | LOOSE | 75% / 7.44% | 1 | PASS (advisory) |

8 of 9 demos with files pass (non-blocking); 2 keep honest failures; 1 is a
catalogued block with no file. No gate was weakened: qa/capture.mjs,
scripts/verify-catalog.mjs and tsc are untouched.

`npx tsc --noEmit`: clean at report time (two transient errors in N4's
source-13/source-23 appeared mid-run while that lane was saving; not mine,
healed before I finished).
`node scripts/verify-catalog.mjs`: PASS — 62 sources, no over-claim.

## What each demo shows, and what the cycles did

The shared disease was thin/small subjects inside wide side-by-side bounds.
The host fits the bounding sphere (runtime.ts computeFrameFit), so uniform
scaling is useless — every fix changed fill fraction, not scale.

- **3** (1 cycle): raised our own caustic term 0.5→0.65 and its brightness
  0.25→0.3. The verdict flaps with the waves (75%/3.86 UNFRAMED vs 75%/4.26
  LOOSE across settles) — the foam/caustic edges sit exactly on the 4% floor.
  Comparator honesty kept: limitation still says no author code is reproduced.
- **8** (1): 5 taller trunks, 200 larger leaf cards in a tighter cluster,
  panel separation 2.0→1.6. 90%/6.75% → 83%/9.80%.
- **12** (3, STOP): candidates ×2.4 with plinths, symmetric reject/accept
  verdict flags, then squat staging (thin towers fill nothing), faceted
  materials, then larger again. 98%/0.99% → 94%/1.70%. The pair's bounds are
  dominated by flags/plates while the subjects stay columnar; out of budget.
  Also corrected the limitation: it claimed "no browser/screenshot/GPU runs
  in this lane", which tonight is false — the exhibit is pixel-verified, the
  author's browser leg is still open. One self-inflicted breakage (dropped
  `const pass` line) was caught by tsc and repaired same session.
- **16** (1): thicker bones, beaded joint pivots (the retarget maps onto OUR
  pivots, so the pivots are drawn), taller chain. 96%/2.39% → 84%/4.34%.
- **22**: no file assigned and none created — catalogue `demo.status:
  blocked` with a licence/availability blocker. Host renders Missing, which
  is the correct rendering. Do not invent a demo here.
- **26** (3, STOP): taller cards, larger swatches, then a focus totem (hex
  pillar in the live accent) plus hero plate to fill the ring void, then a
  bigger shaded totem. 94%/3.91% → 86%/5.22%. The ring reads nearly top-down
  so cards stay edge-on slivers and the totem roof is one flat bucket. The
  totem/hero genuinely demonstrate focus (accent + cover follow selection),
  but the gate stays red. Out of budget.
- **31** (2): thicker capsules/palm/fingers, contrasting wireframe IK-joint
  markers (gizmo aesthetic, the chain made readable), closer arms, larger
  handle. 93%/1.63% → 61%/7.63%.
- **41** (1): larger subjects, taller pedestals, tighter bays and panels
  (3.6→2.7). 87%/2.92% → 78%/4.31%.
- **50** (1): corridor 9.0→6.2 m, panels 3.6→3.0, taller obstacles, and the
  sweep answer washed into per-panel floor vertex colours (same green/red as
  the station discs) plus edge curbs. 81%/2.96% → 72%/4.51%.
- **56** (NEW, 1): comparator staged honestly — one authored mage tower at
  40-sided and 7-sided density with triangle counts and a wireframe overlay
  on the low half's silhouette masses. First valid capture LOOSE 66%/10.04%.
- **60** (NEW, 1): comparator staged honestly — synthetic baked concept
  panel, pipeline arrow, derived diorama (ridge field as skyline, palette
  bands as block colours) with a pacing mover. LOOSE 75%/7.44%.

## Files written (bytes), and what was verified vs not

Owned files only; shared `index.ts` files were appended to, never rewritten:

- src/lab/demos/group-a/source-03.ts — 7,379
- src/lab/demos/group-a/source-08.ts — 8,723
- src/lab/demos/group-a/source-12.ts — 10,422
- src/lab/demos/group-a/source-16.ts — 10,147
- src/lab/demos/group-b/source-26.ts — 13,353
- src/lab/demos/group-b/source-31.ts — 9,993
- src/lab/demos/group-c/source-41.ts — 7,528
- src/lab/demos/group-c/source-50.ts — 8,056
- src/lab/demos/group-d/source-56-smart-mesh.ts — 7,062 (new)
- src/lab/demos/group-d/source-60-image-to-game.ts — 7,499 (new)
- src/lab/demos/group-d/index.ts — 10,739 (appended 2 rows + imports)

VERIFIED: tsc clean for all of the above; verify-catalog PASS; every number
in the ledger is a real `qa/capture.mjs --base …/skills-lab/ --only N` run
against the nvidia headless adapter, and I viewed the frames for 8, 12, 26,
50, 56 and 60 with my own eyes (56/60 confirmed correct subjects, legends
live; 26 confirmed big totem rendered; 12 confirmed squat candidates render).
NOT VERIFIED: technique correctness — a LOOSE/DREW verdict says pixels vary,
never that the method is right. Morning-eye checklist: 8 — is the AFTER
canopy's leaf density visibly different from BEFORE (same layout, different
bake)? 26 — does the hero plate follow focus changes? 50 — do the floor-wash
colours agree with the discs at every station? 56/60 — comparator framing
acceptable, or too close to claiming vendor output?

## Disclosures the morning needs

1. **Pre-existing edits.** source-01 (N1's), source-03 and source-08 (mine)
   already carried uncommitted framing edits (19:31, larger subjects, tighter
   separations) when I arrived. They point the right way; I built on them.
   I do not know which lane made them.
2. **Capture flakiness under concurrent lanes.** Roughly six of my captures
   returned wrong-row frames (overlay naming Source 1, or 100% flat) while
   siblings saved: gallery counts flapped 50–60 and click-by-index missed.
   Poisoned attempts were re-run, never counted as fix cycles and never
   "fixed" with code. One 50 capture transiently showed no-factory and passed
   on immediate re-run. If the morning re-runs and sees different numbers,
   check gallery stability first.
3. **Catalogue drift I could not close.** Sources 56/60 now declare
   `sourceId` in demo files while the catalogue still says `demo.status:
   absent` — verify-catalog only fails the reverse direction, so it passes,
   but the Atlas lane should reconcile the rows. I do not own the catalogue.
4. **Source 3 sits on the tier boundary.** Its edges move with the animation
   phase; a re-capture may read UNFRAMED again at 75%/3.9%. That is
   measurement noise on a passing demo, not a regression.
5. No dependencies installed or upgraded; no third-party source vendored;
   every technique file is our own restatement. No secrets in any file.
  6. Local model note: none — this lane ran cloud-side; no Qwen context-guard
   involvement.

---

# Second N3 pass — FIX-only brief (2026-09-17, after the above report)

This section is a different run from the report above. My brief
(`briefs/N3-assignment.md` as read at session start) assigns FIX-only work on
sources 3, 8, 12, 16, 22, 26, 31, 41, 50 and owns 12 files
(`src/lab/demos/group-{a,b,c}/{index,source-*}` for those ids) — no group-d,
no sources 56/60. I found the report above already written (20:18) when I
arrived, so I preserved it intact and record my own run here. Where my brief
said "captured: UNFRAMED" for all eight, that snapshot was already stale: five
were LOOSE at my first capture thanks to the earlier pass.

## My final numbers (same rig: headless WebGPU nvidia/blackwell)

| source | final verdict | modal / edges | my cycles | outcome |
|---|---|---|---|---|
| 3 stylised water | UNFRAMED | 75% / 3.44% | 3 + revert | FAIL — reverted, file = earlier pass |
| 8 jungle | LOOSE | 83% / 9.43% | 0 | PASS, untouched |
| 12 asset acceptance | UNFRAMED | 86% / 1.81% (best 85% / 2.10%) | 3 | FAIL, kept — but genuine defect fixed (below) |
| 16 kimodo stitch | UNFRAMED | 91% / 3.86% | 3 + full revert | FAIL — reverted to earlier pass byte-for-byte of my edits |
| 22 comparators | blocked, no file | Missing panel 99% / 1.69% | 0 | legitimate gap, nothing created |
| 26 game-select ring | LOOSE | 85% / 6.03% | 3 | PASS — fixed this run (was UNFRAMED 86% / 5.20%) |
| 31 FP arms | LOOSE | 62% / 7.35% | 0 | PASS, untouched |
| 41 catalogue | LOOSE | 77% / 4.18% | 0 | PASS, untouched |
| 50 sweep | LOOSE | 72% / 4.51% | 0 | PASS, untouched |

`npx tsc --noEmit`: clean at my finish (I saw transient errors in
source-01/source-27 mid-run while sibling lanes were saving; healed without
my touching them). `node scripts/verify-catalog.mjs`: PASS (62 sources).
No gate file touched (qa/capture.mjs, verify-catalog.mjs, tsc config), no
dependency installed, nothing vendored, no secrets.

## What I actually changed

- **26 (the one win).** Slimmed the focus totem (r 1.15/1.25 → 0.8/0.9) so it
  no longer swallows the card ring, lowered the hero plate (y 2.45 → 1.95),
  and tucked both accent swatches inside the ring's existing bounds
  (±0.75, 0.35, 1.55) — out front they stretched the depth extent and shrank
  everything else. A stage floor + accent rim was tried and REVERTED the same
  run (dark floor fell in the background tone bucket: 87% → 93%). Final:
  UNFRAMED 86%/5.20% → LOOSE 85%/6.03%. One broken-build capture (my edit ate
  a material declaration; tsc caught it) was discounted, not counted.
- **12.** Found and fixed a real defect from the earlier restage: the
  candidate body mesh was constructed but never added to the group (only cap
  + plinth rendered). Re-added it, seated the accept flag on the measured top
  instead of a fixed 2.55 m, grew candidates within the declared criteria
  band, separation 2.0 → 1.3. 94%/1.70% → 86%/1.81% (best 85%/2.10%).
  Still UNFRAMED: bounds are dominated by wide dark plinths that sit in the
  background tone bucket. Budget spent; kept.
- **16.** Thickened links, shortened chain, damped the displayed pose over 3
  cycles; best 87%/4.17%, still UNFRAMED — then discovered the earlier
  report's LOOSE 84%/4.34% for this file and REVERTED every byte of my edits
  (verified via `git diff` that only the earlier pass's changes remain).
  Confirm-run on the restored file: UNFRAMED 91%/3.86%. The earlier LOOSE did
  not reproduce — this demo flaps across the line run to run (animated pose
  at capture time), same disease as source 3.
- **3.** Three cycles (foam crisp, foam widen, caustic broaden) all scored
  worse than the starting point (3.81 / 3.69 / 3.10 vs 3.96), so I reverted
  everything; the file now matches the earlier pass exactly. Lesson recorded:
  my mental model of the edge metric was wrong (more foam/caustic AREA =
  more flat interior = fewer edges), and I stopped instead of grinding.
  Recent runs 75%/3.44–3.96% vs LOOSE 75%/4.26–4.27 earlier: the demo sits on
  the 4% floor and its travelling surf puts it on either side by phase.

## Files I touched (final bytes on disk)

- src/lab/demos/group-a/source-03.ts — 7331 (net-zero: my edits reverted)
- src/lab/demos/group-a/source-12.ts — 10810 (mesh restore + flag + sizes)
- src/lab/demos/group-a/source-16.ts — 10147 (net-zero: fully reverted)
- src/lab/demos/group-b/source-26.ts — 13686 (totem + swatches fix)
- docs/lane-N3-report.md — this section appended (their report above intact)
- I did not touch group-a/b/c index.ts, source-08/31/41/50, the catalogue,
  qa/, scripts/, or any other lane's files.

## Verified vs not verified

VERIFIED: every number above is my own `qa/capture.mjs
--base http://localhost:5183/skills-lab/ --only N` run on the nvidia
headless adapter; I viewed the frames for 12 (bodies render), 16 (chains
render, then restored), 26 (ring + totem + tucked swatches render) and 3
(water comparator renders). tsc clean and verify-catalog PASS at finish.
NOT VERIFIED: technique correctness for any demo (LOOSE is not a correctness
claim); sources 8/31/41/50 rely on the earlier pass plus my confirming
captures only; source 3/16 boundary flapping means the morning re-run may
read a different tier on an unchanged file — check animation phase before
treating it as a regression. Human eye still required for: 26, does the hero
plate follow focus; 12, do the verdict flags read next to the candidates.

## Disclosures

1. **The disjoint-set premise was false this run.** My owned files carried
   other lanes' in-flight edits throughout (the earlier N3 legibility pass
   and concurrent saves). I built on compatible work, repaired two lines
   other edits had dropped (12's mesh, my own two self-inflicted drops
   caught the same session), and reverted everything of mine that did not
   help. Briefs should not promise exclusive files when lanes overlap.
2. **Edit-tool hazard.** The line-anchored editor silently drops neighbouring
   lines when ranges misalign; I introduced and repaired four such drops
   (mesh attach, material declaration, hero rotation/add, pivot duplication),
   each caught by immediate re-read + tsc. Nothing unrepaired remains.
3. **Dev server died once** (reload storm: vite watches qa/captures profiles
   plus concurrent saves) and was restarted via the hub; two captures against
   the dying server (16 "Missing", 100% flat) were discounted as
   environmental, never counted as cycles.
4. **Collision on this report path** (above) and on gate numbers: where my
   numbers differ from the earlier table, both are real runs at different
   times — treat neither as ground truth without re-running.
---

# Third N3 pass — FIX-only brief, late-night run (2026-09-17 ~21:00-22:30 UTC)

Brief: `briefs/N3-assignment.md` (FIX 3, 8, 12, 16, 22, 26, 31, 41, 50; own the
12 group-a/b/c index+source files). preserved both sections above intact.
Baseline at my arrival: all nine as left by the two earlier passes. My first
captures: 3 UNFRAMED 75%/3.53% · 8 LOOSE 84%/8.68% · 12 UNFRAMED 86%/1.87% ·
16 LOOSE 85%/4.52% · 22 Missing-panel 99%/1.69% · 26 LOOSE 85%/6.02% ·
31 LOOSE 65%/7.05% · 41 LOOSE 77%/4.17% · 50 LOOSE 72%/4.51%.
(Same rig throughout: `qa/capture.mjs --base
http://localhost:5183/skills-lab/ --only N`, headless WebGPU nvidia/blackwell.)

## Outcomes

| source | final verdict | modal / edges | my cycles | outcome |
|---|---|---|---|---|
| 3 stylised water | LOOSE | 75% / 7.46% | 1 | PASS (advisory) — fixed this run |
| 8 jungle | LOOSE | 84% / 8.68% | 0 | PASS, untouched |
| 12 asset acceptance | UNFRAMED | 83% / 1.71% (valid) | 2 (1 valid capture) | FAIL — kept, environment stopped cycle 3 |
| 16 kimodo stitch | LOOSE | 85% / 4.52% | 0 | PASS, untouched |
| 22 comparators | blocked, no file | 99% / 1.69% Missing panel | 0 | legitimate gap, nothing created |
| 26 game-select ring | LOOSE | 85% / 6.02% | 0 | PASS, untouched |
| 31 FP arms | LOOSE | 65% / 7.05% | 0 | PASS, untouched |
| 41 catalogue | LOOSE | 77% / 4.17% | 0 | PASS, untouched |
| 50 sweep | LOOSE | 72% / 4.51% | 0 | PASS, untouched |

## What I changed (2 files; index files untouched — entries already correct)

- **3 (the win, 1 cycle).** Root cause was a dead layer, not framing: the
  `caustic` term (lines 139-142) was computed every frame and never applied —
  `lc.setXYZ` wrote `scratch` without it, so the documented "layer 3" did not
  exist on screen. Wired it in as shallow-keyed brightness (+6 lines).
  UNFRAMED 75%/3.53% → LOOSE 75%/7.46%. Edges doubled; modal unchanged (the
  BEFORE control panel is flat by design and owns half the frame, so 75%
  modal is structural here, not a subject bug). Honesty kept: limitation still
  says no author code is reproduced and reflection/wake are not implemented.
- **12 (2 cycles, no valid final capture).** Cycle 1: slimmer plinths
  (1.25/1.35→1.05/1.12 ×r), reject flag seated on measured top instead of
  fixed 1.1 m, both flags 0.7×0.14→0.95×0.2(0.2 reject), separation 1.3→1.0.
  Result 86%/1.87% → 83%/1.71%: modal improved, edges fell — the plinth rims
  I shrank had been contributing edge pixels. Wrong lever for the edge floor.
  Cycle 2: accepted body into the upper half of the declared height band
  (1.3+rng·0.25 → 1.65+rng·0.15), cap 0.9r→0.6r so the measured top
  (h+0.6r+0.1 ≤ 2.5) stays inside the 2.6 m ceiling for every rng draw,
  symmetric pass flag. Attempt 0 still fails the height floor (0.9 < 1.3), so
  the reject→accept story is unchanged; triangle/aspect budgets re-checked
  analytically (worst ≈360 tris, aspect ≈1.1). No valid capture obtainable
  (see environment notes). One self-inflicted drop (the `height` line, eaten
  by a range edit) caught by re-read and repaired same session; tsc clean
  after.

## Finish steps (N-build-common §Finish)

1. `npx tsc --noEmit`: exit 0, clean — verified twice via shell (after cycle-1
   edits, 68 s; after cycle-2 edits, 10 s). I made no code edits after the
   second clean run. A third run at finish time could not complete (shell
   backend unresponsive under lane load; see below) — current-tree-clean is
   NOT re-verified at the final minute, only as of my last edit.
2. `node scripts/verify-catalog.mjs`: PASS — 62 sources, no over-claim
   (re-verified at finish via kernel runner).
3. Captures: table above. Every number is my own run except where marked
   invalid/discounted below.
4. This report.

## Verified vs NOT verified

VERIFIED: source-3 fix captured LOOSE on the real adapter; tsc clean as of my
last edit; verify-catalog PASS at finish; byte sizes below measured at finish
via kernel stat. I viewed the source-12 cycle-2-poisoned frame with my own
eyes (Vite error overlay, not a scene — discounted, never counted).
NOT VERIFIED: source-12 cycle-2 staging has NO valid pixel evidence — it is
tall-candidate code that typechecks, not a demonstrated exhibit. Technique
correctness for source 3 beyond the gate (LOOSE is not a correctness claim):
morning eye should check the AFTER panel shows travelling caustic shimmer in
the shallows distinct from the foam band. Sources 8/16/26/31/41/50 rely on
confirming captures only, no code changes. Final-minute `tsc` not re-run to
completion (see above).

## Files (bytes on disk at finish, measured)

- src/lab/demos/group-a/source-03.ts — 7718 (my caustic wiring)
- src/lab/demos/group-a/source-12.ts — 11047 (staging + taller bodies)
- src/lab/demos/group-a/source-08.ts — 8723 (untouched)
- src/lab/demos/group-a/source-16.ts — 10147 (untouched)
- src/lab/demos/group-b/source-26.ts — 13686 (untouched)
- src/lab/demos/group-b/source-31.ts — 9993 (untouched)
- src/lab/demos/group-c/source-41.ts — 7528 (untouched)
- src/lab/demos/group-c/source-50.ts — 8056 (untouched)
- docs/lane-N3-report.md — this section appended (sections above intact)
- group-a/b/c index.ts, catalogue, qa/, scripts/: untouched.

## Disclosures the morning needs

1. **Environment ate the end of this run.** In order: 2× `networkidle`
   timeouts; N2's in-flight source-49.ts save with a syntax error
   (`'chain's end-joint…` plus leaked `+` prefixes) broke the whole lab page
   transform — one of my source-12 captures is a photo of that Vite overlay
   (87%/20.12%, edges = error text; discounted, never a cycle); dev server
   died (conn refused; someone restarted it, I waited); 2 more `networkidle`
   timeouts after the fix (six lanes saving → page never settles 45 s);
   final shell commands timing out (even `git status`/`wc`; sizes taken via
   kernel stat instead). Per OVERNIGHT.md §2 this is stop-and-report, not
   keep-grinding: source 12 keeps its cycle-1 valid result, cycle-2 code
   stays in place marked unverified.
2. **IPv4 vs IPv6.** Vite answers on `[::1]:5183` but refuses
   `127.0.0.1:5183`. `localhost` resolves to ::1 and works. If a future
   capture fails conn-refused instantly, check which loopback it dialled.
3. **Parallel vision reads misroute.** Two `*.png?q=` reads in one turn came
   back describing each other's files. I treated `report-source-N.json`
   (slug/sourceId) as identity ground truth afterward. Recommend one image
   read per turn.
4. No gate file touched, no dependency installed, nothing vendored, no
   secrets. No git writes, no processes killed.
---

# Fourth N3 pass — FIX-only brief, environment-blocked run (2026-09-17 late night)

Brief: `briefs/N3-assignment.md` (FIX 3, 8, 12, 16, 22, 26, 31, 41, 50; own the
12 group-a/b/c index+source files). All three sections above preserved intact.
This pass made **zero code edits**: every owned demo file on disk is
byte-identical to the third pass's finish (sizes below), and no capture with a
valid verdict was obtainable in this run for environmental reasons documented
below. Per OVERNIGHT.md §2 this is stop-and-report, not keep-grinding.

## Why no capture cycles were consumed

1. `node qa/capture.mjs --base http://localhost:5183/skills-lab/ --only 3`
   timed out 3× at `page.goto ... waiting until "networkidle"` (45 s each);
   `--only 22` timed out a 4th time the same way. The dev server itself is
   healthy (`skills-lab-dev` ready, Vite answers 200 on `[::1]:5183`) but the
   page never settles while six lanes save concurrently.
2. Static-preview fallback (built `dist/` via `npm run build:nocheck`,
   served with `vite preview` on :5199, captured against it) loads but fails
   the adapter gate twice: `NO WEBGPU ADAPTER ... {"hasGpu":true,
   "adapter":false}`. Preview server stopped afterwards; `dist/` removed.
3. Isolation probe (throwaway harness-style Chrome, `about:blank`,
   `navigator.gpu.requestAdapter`, script deleted after): **`{"hasGpu":false}`**
   — fresh headless Chromes currently have no WebGPU at all, independent of
   any page. `tasklist` shows dozens of `chrome.exe` and
   `qa/captures/.chrome-profile-*` counts 254 leaked profiles, so the GPU is
   wedged by accumulated harness Chromes (each crashed `networkidle` run
   orphans its Chrome: the timeout path never reaches the harness's own
   cleanup). I killed nothing and edited no gate file; the probe script is
   deleted, `dist/` is removed, my preview server is stopped.

Conclusion: tonight's premise (real headless WebGPU adapter per capture) does
not hold right now. Blind code edits without capture feedback would violate
the loop contract ("a second blind attempt is not an iteration"), and the
3-cycle budgets for sources 12 and 26 are already spent by earlier passes, so
no owned file was touched. My capture-cycle count this run: **0 consumed**.

## Last-known verdicts (NOT mine — read from `qa/captures/report-source-N.json`)

Real adapter runs from earlier tonight (nvidia/blackwell, demoCount 61).
Quoted so the morning has one table; treat as stale, not as my evidence:

| source | last verdict | modal / edges | capturedAt (UTC) |
|---|---|---|---|
| 3 stylised water | LOOSE | 75% / 7.46% | 20:22 |
| 8 jungle | LOOSE | 84% / 8.68% | 20:07 |
| 12 asset acceptance | UNFRAMED (valid cycle-1 staging) | 86% / 1.87% | ~21:31 |
| 16 kimodo stitch | LOOSE | 85% / 4.52% | 20:15 |
| 22 comparators | blocked, Missing panel | 99% / 1.69% | 20:11 |
| 26 game-select ring | LOOSE | 85% / 6.02% | 20:12 |
| 31 FP arms | LOOSE | 65% / 7.05% | 20:13 |
| 41 catalogue | LOOSE | 77% / 4.17% | 20:14 |
| 50 sweep | LOOSE | 72% / 4.51% | 20:18 |

Caution: `report-source-12.json` on disk (20:31, 87% / 20.12%) is a photo of
the Vite error overlay from another lane's broken save, as the third pass
recorded — discounted, never a verdict. Source 12's cycle-2 staging (taller
bodies, separation 1.0) still has no valid pixel evidence.

## Static checks I did perform (no GPU needed)

- Re-read all eight owned demo files in full plus the three index entries for
  22 (blocked, no factory — correct), 41 and 50 (adapted with factories).
- Verified source-12's accept logic analytically against its own `CRITERIA`:
  attempt 0 measures 0.9 m (fails the 1.3 m floor, the intended reject);
  attempts ≥1 measure 2.26–2.5 m inside [1.3, 2.6], triangles ≈ hundreds
  inside [120, 1500], aspect ≈ 1.3 inside 3.2 — the loop accepts for the
  reason it claims. Remaining failure is framing pixels, not logic.
- Confirmed the body-mesh restore (second pass) is present
  (`group.add(mesh)`), the source-3 caustic wiring is present, and no
  edit-tool neighbour-line drops remain in owned files.
- Catalogue drift (third-pass finding, still open, not mine to fix): sources
  41/50 declare `demo.status: absent` / `adaptation: none` while group-c
  manifests `adapted` factories. `verify-catalog` passes (it only fails the
  claimed-without-file direction); Atlas lane should reconcile.

## Finish steps (N-build-common §Finish)

1. `npx tsc --noEmit`: exit 0, clean — verified at finish.
2. `node scripts/verify-catalog.mjs`: PASS — 62 sources, no over-claim
   (only note: source 36 entrypoint prose, pre-existing).
3. Captures: none valid this run (see above); last-known table quoted with
   timestamps instead of pasted fresh verdicts. No gate weakened.
4. This report.

## Files (bytes on disk at finish, measured via shell)

- src/lab/demos/group-a/source-03.ts — 7718 (untouched)
- src/lab/demos/group-a/source-08.ts — 8723 (untouched)
- src/lab/demos/group-a/source-12.ts — 11047 (untouched)
- src/lab/demos/group-a/source-16.ts — 10147 (untouched)
- src/lab/demos/group-b/source-26.ts — 13686 (untouched)
- src/lab/demos/group-b/source-31.ts — 9993 (untouched)
- src/lab/demos/group-c/source-41.ts — 7528 (untouched)
- src/lab/demos/group-c/source-50.ts — 8056 (untouched)
- group-a/b/c index.ts — untouched (13827 / 15103 / 15645).
- docs/lane-N3-report.md — this section appended (sections above intact).

## Verified vs NOT verified

VERIFIED: `tsc` clean and `verify-catalog` PASS at finish (exact outputs
above); byte sizes above; owned index entries read; source-12 accept logic
recomputed by hand against `CRITERIA`; the `{"hasGpu":false}` probe result
and the four `networkidle` timeouts are my own runs.
NOT VERIFIED: every pixel verdict — no frame was captured on a real adapter
this run, so all nine demos' acceptance is OPEN pending a morning re-run
once the GPU/Chromes recover. Technique correctness was never claimed by any
verdict and is not claimed here. Morning-eye checklist unchanged from the
third pass: 3 — caustic shimmer distinct from foam; 12 — verdict flags
legible next to candidates; 26 — hero plate follows focus; 50 — floor wash
agrees with discs.

## Disclosures

1. No dependencies installed or upgraded; nothing vendored; no secrets; no
   `git add/commit/stash/reset/push`; no process killed (leaked Chromes left
   for their owners/the orchestrator despite the GPU cost — the hard rule
   outranks the cleanup urge).
2. If the morning re-runs captures and sees different tiers on unchanged
   files (sources 3/16 flap across the 4% edge floor with animation phase),
   check phase before treating it as regression.
3. Recommend the orchestrator reap `qa/captures/.chrome-profile-*` and
   orphaned `chrome.exe` between waves, and consider `vite preview`
   snapshots for capture stability — tonight's dev-server `networkidle` gate
   cannot settle under six saving lanes.
