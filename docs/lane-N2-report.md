# Lane N2 — overnight build and repair report (2026-09-17 → 2026-09-18)

Lane N2, model `muse-spark-1.3-contributor`. Assignment: FIX sources
2, 6, 11, 15, 21, 25, 30, 36, 49. No BUILD items in this brief.
This report OVERWRITES a prior `lane-N2-report.md` draft that covered
BUILD sources 54/59 — those are not in this brief, their files were not
touched by this lane, and nothing below claims them.

Capture route used: the harness's own node-spawned Chrome never brings up
CDP in this environment (two attempts, `Chrome CDP never came up`, 30 s each;
a file-based probe showed node-spawned Chrome exits immediately while a
python-spawned Chrome with identical flags brings CDP up in ~1 s). Workaround:
hub-started Chrome + `node qa/capture.mjs --only <id> --port <port> --base
<base> --out C:/Users/david/AppData/Local/Temp/skills-lab-N2` (out-of-repo so
my profiles never join the `qa/` HMR storm). All verdicts below are from a
real WebGPU adapter (nvidia / blackwell, headless).

## Gate results

| source | verdict | modal | edges | my cycles | outcome |
|---|---|---|---|---|---|
| 2 Spectral FFT ocean | UNFRAMED | 87% | 3.04% | 1 | gate FAILED, best attempt kept |
| 6 Image→procedural model | LOOSE | 84% | 4.28% | 0 | PASSES (advisory) |
| 11 Scaffold/hero | LOOSE | 79% | 8.77% | 0 | PASSES (advisory) |
| 15 Native RTX runtime | UNFRAMED (placeholder) | 99% | 1.65% | 0 | legitimate gap, blocked by design |
| 21 Classic RT alias | LOOSE | 82% | 5.90% | 0 | PASSES, inherits source-19 lane |
| 25 VOIDMODE shoreline | UNFRAMED (placeholder) | 99% | 1.89% | 0 | legitimate gap, blocked by design |
| 30 Video-as-reference | UNFRAMED (placeholder) | 99% | 2.08% | 0 | legitimate gap, blocked by design |
| 36 Voxel remesh bake | DREW SOMETHING | 57% | 3.22% | 0 | PASSES |
| 49 MotionBricks scaffold | UNFRAMED (pre-change) | 82% | 1.89% | 1 | CHANGED, re-capture NOT obtained |

Working-tree note: this lane started from a tree that already contained a
prior N2 attempt's fixes (6/11/36/49 matched that draft's numbers to the
second decimal on re-capture). I verified rather than repeated: 0 cycles on
anything already passing, 1 cycle each on the two blocking demos I could
still move.

## Per demo

### Source 2 — Spectral FFT ocean (FIX, 1 cycle, gate failed, kept)
Technique: JONSWAP+TMA → Tessendorf h0 → inverse FFT → choppy displacement →
Jacobian-negative foam, against summed-Gerstner control. Frame shows both
patches reading (smooth left, chopped right) but floating in void: a flat
wide pair under a bounding-sphere fit cannot own the frame.
Change (`source-02.ts` only): side-by-side separation 2.6→2.2 m (tightest
honest layout for 2 m patches, 0.2 m gap), foam whitening gain 3.2→4.5
(response only; spectrum, threshold and test untouched). 89%/2.97% →
87%/3.04%. LOOSE needs modal ≤ 85%; this pair cannot get there without
changing what is demonstrated, so I stopped after 1 cycle.
Unverified hypothesis from the PNG: no white foam is visible at all — at
N=32 / chop 0.9 the Jacobian may never drop below the 0.62 threshold, which
would make any foam *gain* a no-op. NOT verified (would need the
minJacobian counter out of the page). Morning: either accept as failed or
instrument the foam coverage first; do not just raise gains blindly.

### Source 6 — Image to procedural model (0 cycles, passes)
LOOSE 84%/4.28%. No edit. Frame not re-viewed this lane; verdict matches the
prior state and the gate is advisory-only.

### Source 11 — Scaffold/hero (0 cycles, passes)
LOOSE 79%/8.77%. No edit. PNG viewed: two grid-grounded worlds with verb
rings and props; left hero small/sunk/sideways, right full-height facing the
ring. The harmonisation story reads. NOT verified: anything beyond framing
(animation/gameplay harmonisation explicitly unclaimed).

### Sources 15, 25, 30 — blocked (0 cycles, legitimate gaps)
Placeholders at ~99% modal are the host's "Missing / not delivered" state,
not demos. Catalogue `status: blocked` + manifest entries (no factory) are
correct for all three and were left untouched: 15 needs a native C++/Vulkan
product decision; 25 is an unreleased technique with no source; 30's first
step is a video generation this lane may not run.

### Source 21 — Classic RT alias (0 cycles, passes via neighbour)
LOOSE 82%/5.90%, inherited from the source-19 lane's live fix.
`group-b/index.ts` intentionally UNTOUCHED (zero diff by me). Coupling
flagged: if the 19 lane regresses, this regresses with it.

### Source 36 — Voxel remesh bake (0 cycles, passes)
DREW SOMETHING 57%/3.22%. No edit.

### Source 49 — MotionBricks scaffold (1 cycle, CHANGED but NOT verified)
Pre-change: UNFRAMED 82%/1.89% on clean runs (stable across runs; storm-time
runs gave BLANK, a screenshot timeout and a 50-demo host state — recorded as
shared-infra noise, not demo signal). Frame: two thin vertical chains on a
big flat disc in void; edges must double (≥4%) to pass.
Change (`source-49.ts` only): 150-frame end-joint tip trails (terracotta =
naive snap with its arrival corner, bright sage = spring) drawn into
preallocated ring buffers with zero per-frame allocation; baked 64²
measurement-grid floor (byte texture, disposed via
`disposeTree(root, [gridTexture])`); chunkier links (0.17 m, beads 0.115);
method/limitation/counters updated to disclose trails+grid as presentation
instrumentation. `npx tsc --noEmit` clean AFTER all edits.
NOT verified: the new frame was never captured. Infra collapsed before
verification — shared dev server wedged (listens on ::1 only, then stops
responding; ~60 stale HMR sockets from `qa/captures` chrome-profile junk
other lanes write into the repo), 240 s capture timeouts, then the whole
shell backend stopped responding (even `ls` timed out). A snapshot build +
preview server (`n2-preview`) and fresh Chrome (`n2-chrome2`) were staged
for isolation but the shell died before they could be used. Morning MUST
re-capture 49 before trusting it. The change is kept: small, reviewed,
type-clean, and strictly more technique-visible than the failed state —
but "more visible" is my judgement, not a measured verdict.

## Shared-infra notes for the orchestrator
- `skills-lab-dev` DIED mid-lane (hub: exited); I restarted it per
  `N-build-common.md`, it served briefly, then wedged. Do NOT treat its
  "ready" badge as serving — probe the port.
- Lanes must stop writing Chrome profiles into `qa/` (default `--out`):
  every profile file reloads every lane's page and poisons `networkidle`.
  This lane used Temp for all runs.
- The harness leaks one page per run into the shared browser (newPage
  without close). After ~12 runs my shared Chrome wedged the GPU; restart
  shared Chromes between lanes.
- My hub processes at lane end: `n2-preview` (snapshot build server, port
  55982) and `n2-chrome2` (fresh headless Chrome, CDP 55992) left RUNNING
  for the morning re-capture of 49; `n2-chrome` (old) already exited. Reap
  or reuse as needed. `C:/Users/david/AppData/Local/Temp/skills-lab-N2/`
  holds all PNGs + `report-source-<id>.json` files.
- `dist/` was rebuilt (`npm run build:nocheck`, 24 s) for the snapshot —
  build output only, no source impact.

## Finish-by evidence
1. `npx tsc --noEmit` — clean, exit 0 (run AFTER all source edits).
2. `node scripts/verify-catalog.mjs` — PASS (`implemented=22 comparator=16
   blocked=9 method-extracted=13 alias=1 archive=1`; run BEFORE the
   source-49/02 edits, which touch no catalogue surface and no manifest —
   all three owned index files are byte-identical to lane start by my hand;
   concurrent lanes also own them, so re-verify at commit).
3. Captures: per-demo verdicts above, all `--port` + Temp `--out`; PNGs +
   `report-source-<id>.json` in Temp dir. DREW/LOOSE is not a correctness
   claim — per-demo eye-checks listed above are OPEN for the morning.
4. This report.

## Files I wrote (sizes NOT measured — shell backend died before `wc`)
- `src/lab/demos/group-a/source-02.ts` — 2-line change (separation,
  foam gain) + 2-line comment. Nothing else in the file touched.
- `src/lab/demos/group-c/source-49.ts` — trails, grid floor, thicker
  links/beads, metadata/counters/dispose. Two self-caught edit wounds
  (dropped disc transform + chain-state declarations; a duplicated method
  sentence) were repaired in-file and tsc is clean.
- `docs/lane-N2-report.md` — this file.
- Deliberately UNTOUCHED (all owned but left alone): `group-a/index.ts`,
  `group-b/index.ts`, `group-c/index.ts`, `source-06.ts`, `source-11.ts`,
  `source-36.ts`. Never touched (not mine): catalogue, harness,
  vite config, `group-d/*`, every other lane's demo files.
- No `git add/commit/stash/reset/push`. No kills (only hub lifecycle ops on
  my own `n2-*` processes).

## What I verified vs what I did not
Verified: tsc clean post-edit; verifier PASS; sources
6/11/15/21/25/30/36 verdicts on a real WebGPU adapter this lane; source 2
pre/post numbers for my 1 cycle; source 49 pre-change numbers (stable) and
PNG; three pinned at 0.185.1 (only core geometries/materials/DataTexture
already used elsewhere in the repo); no third-party source vendored; no
secrets; byte-sizes and post-change-49 capture NOT obtained (stated above).
Did NOT verify: any technique's correctness beyond framing verdicts;
source 49's new frame at all; the foam-never-fires hypothesis for source 2;
anything in another lane's files; a full-suite capture.

---

## Pass 2 (same lane id, re-invoked ~22:00) — verification only, zero source edits

Re-invocation of lane N2 found Pass 1's tree intact (all framing fixes present,
`group-b/index.ts` still zero-diff). This pass made **no source edits**: with the
capture loop down, any edit would be a blind attempt (LH-8), so the entire budget
went to verification and diagnosis. Edit cycles used this pass: **0 on every source**.
Pass 1's per-source cycle counts and verdicts stand, except where re-measured below.

### Baselines (all verified this pass)
- `npx tsc --noEmit` — clean, exit 0.
- `node scripts/verify-catalog.mjs` — PASS (`implemented=22 comparator=16 blocked=9
  method-extracted=13 alias=1 archive=1`, "no source claims more than the repository
  can show").
- `three` 0.185.1 confirmed from `node_modules/three/package.json`. Power plan: High
  performance (`8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`). `qa/node_modules` present.
- Dev server: the shared `skills-lab-dev` process serves
  `http://localhost:5183/skills-lab/?view=lab` (HTTP 200). It answers on the
  `localhost` hostname (IPv6 ::1) only — numeric `127.0.0.1:5183` is refused. My own
  duplicate server (`n2-dev`) was stopped to leave the shared one alone.

### Source 2 foam hypothesis — CONFIRMED with measured numbers (was: hypothesis)
Pass 1 guessed the Jacobian foam test never fires at N=32/chop 0.9. This pass
executed the repo's exact `source-02.ts` logic headless (Node 24 type-stripping,
real `three` from `node_modules`, Temp-only copies, repo untouched) over 601 frames
(10 s) per seed, reading `metadata.counters.minJacobian` against threshold 0.62:
seed 1 → minJ **0.6214 (never fires)**; seed 7 → 0.6170 (fires, peak foam
intensity ≈ 0.01); seed 1234 → 0.5957 (fires, peak intensity ≈ 0.11). So foam
whitening is absent-to-trace: the spectral half has no whitecaps in most seeds,
which corroborates the UNFRAMED verdict structurally, not just visually. A chop
sweep (0.9/1.2/1.5/2.0) was staged but the shell backend died mid-run — no numbers,
not claimed. Morning: any chop/threshold change alters the demonstrated regime and
must be disclosed in the limitation; foam *gain* alone is proven a no-op.

### Captures — infra-blocked, no verdicts obtained this pass
- 3× `node qa/capture.mjs --only 49 --base http://localhost:5183/skills-lab/ --out
  <Temp>` (plus 1 earlier `--only 49` without `--base`, which exposed that the
  default base misses `/skills-lab/`): all died navigating to the lab page
  (`networkidle` timeout, 45 s). No PNG, no `report-source-*.json` produced.
- A throwaway probe (Temp script, run from `qa/` for module resolution, deleted
  afterwards — `qa/` verified clean) showed the cause: the page **does boot** in
  headless Chrome (WebGPU flags as the harness uses, plus `--no-proxy-server`),
  but under current 6-lane contention the vite dev module graph takes far longer
  than 45 s to become interactive, and `networkidle` never fires amid other lanes'
  edits. Chrome-side load, not a demo bug. Each dead run leaves a
  `.chrome-profile-*` dir; this pass's are in
  `C:/Users/david/AppData/Local/Temp/skills-lab-N2b/`, not in the repo.
- Consequence: source 49 is now **two passes without a post-change verdict**. The
  change stays (small, type-clean, reviewed) but remains "more visible by
  judgement, not measurement". Source 2's UNFRAMED stands on Pass 1's numbers.

### Untouched this pass (deliberately)
All 8 owned source/index files, the catalogue, the harness, vite config, and every
other lane's files. Sources 15/25/30 remain legitimate blocked gaps; 21 still
inherits the 19 lane. No `git add/commit/stash/reset/push`. No kills (one lifecycle
stop of my own duplicate `n2-dev` only).

### What Pass 2 verified vs what it did not
Verified: tsc clean; verifier PASS; three pin; power plan; dev server serving;
Pass-1 foam hypothesis now measured (numbers above); `qa/` left clean; owned-file
sizes below. Did NOT verify: any capture verdict (infra-blocked); any technique
correctness beyond the foam numbers; source 49's new frame (still OPEN for the
morning); anything in another lane's files; a full-suite capture.

### File sizes at end of Pass 2 (bytes, measured via file API — shell `wc` wedged)
- `src/lab/demos/group-a/index.ts` — 13827 (not edited this pass)
- `src/lab/demos/group-a/source-02.ts` — 15147 (not edited this pass)
- `src/lab/demos/group-a/source-06.ts` — 10280 (not edited this pass)
- `src/lab/demos/group-a/source-11.ts` — 9122 (not edited this pass)
- `src/lab/demos/group-b/index.ts` — 15103 (not edited this pass)
- `src/lab/demos/group-c/index.ts` — 15645 (not edited this pass)
- `src/lab/demos/group-c/source-36.ts` — 15110 (not edited this pass)
- `src/lab/demos/group-c/source-49.ts` — 13700 (not edited this pass)
- `docs/lane-N2-report.md` — 9430 before this addendum (only file written this pass)
