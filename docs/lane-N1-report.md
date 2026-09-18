# Lane N1 report — overnight build and repair (2026-09-17, fourth invocation)

Scope per `briefs/N1-assignment.md`: FIX sources 1, 5, 10, 14, 20, 24, 28, 34, 44.
This report SUPERSEDES the third-invocation `docs/lane-N1-report.md` (whose cycle
accounting, catalogue readings and PNG viewings I reuse with attribution below, and
whose working-tree baseline is unchanged — byte sizes identical, zero edits this
invocation). I own no group-d file and touched none. All fresh captures attempted
against the real WebGPU adapter path with `--base http://localhost:5183/skills-lab/`;
none reached the stage (see §3).

## Finish-step outputs (exact)

1. `npx tsc --noEmit` — CLEAN, tree-wide, exit 0, no output:
   ```
   TSC_EXIT:0
   ```
   (Wall 2.42 s. No error in any file I own or any sibling file at this moment.
   The `group-c/source-49.ts` syntax breakage that poisoned the prior invocation's
   late captures is fixed.)
2. `node scripts/verify-catalog.mjs` — PASS:
   ```
   catalogue: 62 sources, updated 2026-09-17 (wave 3)
   status: implemented=22 comparator=16 blocked=9 method-extracted=13 alias=1 archive=1
   demo files declare 58 distinct source ids
   note: source 36: demo.entrypoint is not a module path — "source-assets: docs/technique-lab/group-c/blender/source-36-remesh.blend"

   PASS — no source claims more than the repository can show.
   ```
3. Captures — NO fresh verdict this invocation. Five consecutive attempts, all
   failing identically at `page.goto` before any demo mounted:
   ```
   page.goto: Timeout 45000ms exceeded.
   Call log:
     - navigating to "http://localhost:5183/skills-lab/?view=lab", waiting until "networkidle"
   ```
   Attempts: `--only 1` (×2: 46.22 s, 46.70 s), `--only 5` (50.47 s),
   `--only 10` (55.35 s), plus one `curl` probe of `/skills-lab/` that took
   22.36 s for 756 bytes and a second that exceeded 60 s. The dev server
   (`skills-lab-dev`, vite 8.1.3, port 5183) was restarted by me after being found
   `exited` (29 m uptime) and reported ready, but TTFB degraded 22 s → 60 s+
   across the invocation. Cause is fleet contention, not my code: wave 4 launched
   N1/N2/N3/N4 simultaneously at 22:06, the working tree shows 34 modified files
   across all lanes, and vite rebuilds continuously so `networkidle` never occurs.
   Prior invocation's gotcha #3 (goto flakes under concurrent HMR, ~6 timeouts all
   passing on retry) has become total blockage. I spent zero of my 3-per-demo fix
   cycles on edits because no failure was observed this invocation to feed back —
   grinding blind without a verdict would violate LH-8. Retained verdicts below are
   the standing record, with provenance stated per row.
4. This file.

## Per-demo record

| src | technique shown | cycles this inv. (lineage) | standing verdict |
|-----|-----------------|----------------------------|------------------|
| 1 Mocap plant step | FK eval, hip bisection, before/after + outlines + plant discs | 0 (2) | UNFRAMED 86%/4.88% — gate FAILED (true sample, PNG-viewed this inv.) |
| 5 Sprite atlas | extremes, key, hold timing + filmstrip w/ playhead | 0 (3 — CAP) | UNFRAMED 91%/2.37% pre-fix true sample (prior inv. PNG-viewed); post-fix frame UNVERIFIED — disk PNG is vite-overlay-poisoned 87%/20.12% (PNG-viewed this inv.) |
| 10 Prop registry | registry gate + plinths | 0 (0) | LOOSE 80%/4.48% — passes, frame content verified this inv. (drums + bollards) |
| 14 Viewmodel rubric | connected arm, material contrast, muzzle light | 0 (0) | LOOSE 79%/4.46% — passes, frame content verified this inv. (two viewmodels) |
| 20 Armour/ballistics | plate resolver, pen@distance, apron + outlines | 0 (3 — CAP, prior inv.) | UNFRAMED 80%/3.44% retained best (prior inv. PNG-viewed); disk PNG is stale wave-1 93%/1.79% (PNG-viewed this inv., grey-box era) — gate FAILED, stands |
| 28 Dissolve graph | threshold/noise/edge panels | 0 (0) | LOOSE 83%/12.49% — passes, frame content verified this inv. (intact + dissolving panels) |
| 34 Subsystem contract | contracted vs broadcast pulses | 0 (0) | LOOSE 82%/4.27% — passes, frame content verified this inv. (six boxes, edges, pulse) |
| 24 TAKEN | — (gap) | 0 | blocked, no file owned, `group-b/index.ts` row already honest |
| 44 Thin comparators | — (gap) | 0 | absent, `group-c/index.ts` row already honest, index untouched |

LOOSE is non-blocking per the frozen gate §3, so 10/14/28/34 are accepted on
framing. No verdict certifies correctness — the owner's eye is the final gate.

Catalogue readings (this inv., `sourceId` key): 1 implemented/adapted, no blocker;
5 blocked/adapted with licence blocker (MiniMax Community Licence excludes UK —
this machine is in the UK — model AND output, re-verified 2026-08-26, stands; demo
is the provider-neutral half only, no H3 fetched or used); 10 implemented/adapted,
no blocker; 14 comparator/adapted with client-shell blocker (138,790 B shell, no
technique content, comparator rubric only); 20 implemented/adapted, no blocker;
24 blocked/blocked (source NOT LOCATED, register search closed negative
2026-08-24); 28 implemented/adapted, no blocker (licence: NO licence, probe 404,
all rights reserved — restated, nothing copied); 34 implemented/adapted, no
blocker (MIT at d9b237b); 44 comparator/none (neither post resolves — the absence
IS the finding).

## Repairs made this invocation: none, and why

Zero edits to any owned demo file. Each non-edit is deliberate:

- **Sources 10, 14, 28, 34**: already LOOSE (non-blocking). Tightening them while
  blocking demos remain would mis-spend the budget (frozen gate: spend on blocking
  tiers, not LOOSE cosmetics).
- **Sources 1, 20**: remaining gaps sit inside measured run-to-run phase variance
  (source 1 true samples 86–93% modal; source 20 edges 3.2–4.7% with volley
  phase), and 20 is at lineage cap (3). Source 1 needs modal 86%→≤85% with edges
  already passing (4.88%) — a 1% staging churn is luck-grinding, which the
  contract prohibits. Both recorded as gate FAILED, best attempts kept. The
  current source-1 frame shows the technique reading (feet on plant discs, contact
  error visible); the boundary does not change what the owner sees.
- **Source 5**: at lineage cap (3 — CAP) including the prior invocation's
  separation fix (0.9→1.9, overlap defect, hypothesis-driven and type-clean).
  The fix is in the tree (verified by read: `sideBySide(..., 1.9)` with comment);
  its frame is UNVERIFIED because every capture since has been overlay-poisoned
  (this inv: source-49 overlay at 87%/20.12%; retained N1: source-27 TS
  redeclaration overlay). A second edit without a verdict to feed back would be a
  blind attempt, not an iteration (LH-8). Left as-is, recorded honestly.
- **Indexes** (`group-a/b/c/index.ts`): rows read in full this inv. — 1/5/10/14
  adapted with factories and truthful limitations (5 states the UK licence block,
  14 states comparator-only), 20/28/34 adapted with factories, 24/44 blocked with
  no factory. The working-tree diffs in `group-a/index.ts` and `group-c/index.ts`
  outside my rows are sibling lanes' active edits — not touched, not reverted.
  `group-b/index.ts` diff-free versus my rows.
- **Sources 24, 44**: legitimate gaps, no demo possible (blocked/absent). No
  source search reopened; nothing built to fill the slots.

## What I verified vs what I did not

Verified this inv.: tree-wide `tsc` clean (exit 0); `verify-catalog` PASS;
`three@0.185.1` pinned (package.json, no new APIs — zero edits); manifest honesty
for all nine sources (all three owned indexes read in full); retained PNG↔content
match by singly-viewed frames — 1 (two FK figures, discs, floors), 10
(drums/bollards on plinths, red/green plates), 14 (two viewmodels on slabs), 28
(intact/dissolving panels), 34 (six boxes, edges, pulse), 5-disk (vite error
overlay, invalid), 20-disk (stale wave-1 tank, superseded), retained-N1 5
(sibling TS-error overlay, invalid); five fresh capture attempts with exact
timeout outputs; dev-server restart and TTFB degradation measurements; byte sizes
below.
Did NOT verify: any fresh-adapter verdict this invocation (harness unreachable —
`networkidle` never achieved under wave-4 contention); post-fix frame of source 5
(edit type-clean but frame-unverified across two invocations); current state of
source 20 beyond the retained 80%/3.44%; pixel CORRECTNESS of any demo (verdicts
measure framing only); fps/draw-call cost; 390 px layout; host Atlas rendering.
Morning eye needed for: (1) before/after contact error readable at 86% modal;
(5) whether the separated quads both read and the keying looks clean (unverified
since the fix); (20) impact flashes red/blue against the apron; (14) whether the
arm reads as connected rather than floating at stage distance.

## Files owned, written, byte sizes

Edited (mine, this inv.): `docs/lane-N1-report.md` (this file).
Owned but deliberately untouched — sizes confirm zero drift versus the prior
invocation's baseline: `src/lab/demos/group-a/index.ts` (13,827 B),
`src/lab/demos/group-a/source-01.ts` (13,177 B),
`src/lab/demos/group-a/source-05.ts` (10,876 B),
`src/lab/demos/group-a/source-10.ts` (10,458 B),
`src/lab/demos/group-a/source-14.ts` (8,416 B),
`src/lab/demos/group-b/index.ts` (15,103 B),
`src/lab/demos/group-b/source-20.ts` (21,772 B),
`src/lab/demos/group-b/source-28.ts` (5,950 B),
`src/lab/demos/group-b/source-34.ts` (9,641 B),
`src/lab/demos/group-c/index.ts` (15,645 B).
Evidence: retained PNG + `report-source-<id>.json` pairs in `qa/captures/` (shared
dir; mine would be timestamped this inv. — none written, harness never reached
the stage) and `qa/captures-N1/` (prior inv. evidence, cited with attribution).
No demo file created, edited, moved or deleted; no git write command run; no
process killed; no dependency installed or upgraded.

## Gotchas for the orchestrator (all observed, none fixed — not my files)

1. **Wave-4 fleet contention makes `networkidle` unachievable, 5/5 this inv.**
   `curl /skills-lab/` degraded 22 s → 60 s+ for 756 bytes across the invocation
   while 34 files churned tree-wide. The harness's fixed 45 s `networkidle` goto
   cannot pass in this state. Prior inv. saw 6 flakes passing on retry; this inv.
   saw 5/5 hard timeouts. Mitigations are QA/supervisor jobs, not lane edits:
   stagger lane captures, or give the harness a warm-cache pre-pass. Cost this
   inv.: ~4 min of wall-clock on doomed captures plus one 60 s+ curl; zero Chrome
   leaks from my attempts (harness throws before spawning on goto failure — the
   leaked `.chrome-profile-*` dirs in `qa/captures/` predate me).
2. **Parallel image reads scramble file↔content pairing in review.** Three
   simultaneous PNG reads returned frames in an order that did not match the
   request order (overlay first attributed to source 1, since corrected by
   single reads with md5 confirmation). Any lane verifying鑑 multiple frames in
   one batch must re-confirm singly before claiming content match.
3. **Stale and poisoned PNGs share slugs with true samples.** `5-…png` on disk is
   the poisoned post-fix frame, not the 91% pre-fix true sample (overwritten,
   unrecoverable); `20-…png` on disk is wave-1 (93%), not the retained 80% best
   in `qa/captures-N1/`. File mtime ≠ verdict currency — read the JSON
   `capturedAt` and view the pixels before citing any number.
4. **Shared manifest files are multi-lane merge hazards.** `group-a/index.ts` and
   `group-c/index.ts` carry active rows from other lanes (sources 2/6/11,
   36/49). I made zero index edits precisely to avoid clobbering them; any lane
   that must touch a shared index should patch only its own row hunks.
