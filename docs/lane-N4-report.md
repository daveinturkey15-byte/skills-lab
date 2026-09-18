# Lane N4 report — overnight build and repair (2026-09-17, fourth invocation, wave 4)

Lane N4, `briefs/N4-assignment.md` (same assignment as waves 2–3). Sources: FIX 4, 9, 13,
19, 23, 27, 32, 43; BUILD 59. Budgets honoured: no gate weakened, no other lane's files
touched, no `index.ts` in any group touched, no git writes, no processes killed or
otherwise disturbed. This report supersedes the wave-3 N4 report; its verdict table is
carried forward below (attributed, not re-scored) because every demo file I own is
byte-identical to the wave-3 verified state.

## Finish-by outputs (N-build-common §Finish by)

1. `npx tsc --noEmit` — clean, no output, exit 0 (fresh this session, ~2.5 s).
2. `node scripts/verify-catalog.mjs` — `PASS — no source claims more than the
   repository can show.` (62 sources; standing source-36 entrypoint note, not mine).
   Fresh this session.
3. Captures — ATTEMPTED six times, ZERO scored. Environmental block, detailed below.
   No verdict numbers of my own this session; the table in §Results is wave-3's
   scoring on byte-identical files, explicitly marked as such.
4. This report.

## Why no fresh captures (environmental, not a skipped step)

The run's GPU loop is currently oversubscribed to the point of unusability:

- `http://localhost:5183/skills-lab/` (shared dev, `skills-lab-dev` pid 51444): three
  `page.goto … networkidle` timeouts (45 s each). The server accumulated ~20
  concurrent ESTABLISHED connections from sibling capture Chromes, so `networkidle`
  never fires; at one point even `/` stopped answering. Not a code failure.
- Built an isolated snapshot (`npx vite build --outDir dist-n4`, succeeded in 6 s)
  and served it on port 5200 (`n4-preview`, instant HTTP 200): twice headless Chrome
  came up with `hasGpu:true, adapter:false` — `requestAdapter({high-performance})`
  returned null. The discrete GPU is exhausted by ~10 concurrent sibling Chromes
  (profiles timestamped every minute in `qa/captures/` and `/tmp/skills-lab-n4/`).
  The harness correctly refused fallback (exit 3). This is contention, not absence.
- Mid-run a sibling rebuilt the shared `dist/` (it vanished: `dist/index.html` →
  ENOENT → my first preview 404'd). My isolated `dist-n4` was the fix for that;
  there is no fix for the adapter exhaustion from inside this lane.
- One further attempt (source 13, preview base) hit the 180 s job timeout; a plain
  `wc -c` of seven files timed out at 60 s. The machine is thrashing. Further
  attempts would only add load, so I stopped polling. Last successful capture
  recorded anywhere in the repo: 21:32 (sibling lanes' reports).
- Per the brief, a capture timeout is environmental and never counts as a fix
  cycle. Zero fix cycles consumed on any source this session.

Because no capture could be scored, I made NO demo edits: an edit without a
before/after capture is exactly the blind attempt LH-8 prohibits.

## Results (wave-3 verdicts on byte-identical files — NOT re-scored this session)

| source | technique | cycles (wave-4) | last scored verdict (wave-3) | gate |
|---|---|---|---|---|
| 4 underwater dome + cut | displaced-volume dome, laminar term, naive cut as red mesa | 0 — kept | LOOSE 76% / 13.8% | PASS (advisory) |
| 9 frame-loop audit | before/after allocation + disposal, live counters | 0 — kept | LOOSE 75% / 5.8% | PASS (advisory) |
| 13 gauntlet loop | propose-falsify-verify, frozen regressions + budgets | 0 — kept | DREW SOMETHING 54% / 2.7% | PASS |
| 19 classic ray tracing | Whitted/Hall CPU tracer, direct-only vs full recursion | 0 — kept | LOOSE 82% / 5.9% | PASS (advisory) |
| 23 deforming terrain | persistent accumulating field, toroidal snap, banked relax | 0 — kept | LOOSE 82% / 4.28% (marginal) | PASS (advisory) |
| 27 game feel loop | hitstop + pooled flash + shake + cooldown, explicit order | 0 — no edit (see §27) | UNFRAMED 84% / 1.95% | FAIL — kept, recorded (wave-3) |
| 32 WAN 2.2 video | blocked (weights unpinned, licence unverified vs weights) | 0 — no file owned | n/a (host: Missing / not delivered; manifest `adaptation: blocked`, no factory — re-read this session in `group-b/index.ts` lines 250–265) | legitimate gap |
| 43 lighting-as-parameter | baked-merged vs separable + live light | 0 — kept | LOOSE 64% / 4.3% | PASS (advisory) |
| 59 Graalitoo article | comparator, method NOT established, body unretrievable | 0 — no file created | n/a (catalogue `demo.status: absent`; no manifest row; `group-d/index.ts` untouched) | legitimate gap |

Byte sizes (owned demos, unchanged since wave-3): `group-a/source-04.ts` — 8393;
`group-a/source-09.ts` — 7809; `group-a/source-13.ts` — 11008;
`group-b/source-19.ts` — 15971; `group-b/source-23.ts` — 11523;
`group-b/source-27.ts` — 7973; `group-c/source-43.ts` — 9119.

Catalogue rows 4, 9, 13, 19, 23, 27, 32, 43, 59 re-read this session (`sourceId`
key): blockers/methods/limitations as wave-3 reported. Source 4's blocker still
frames the red-mesa cut as deliberately unsolved; 32 still `blocked/blocked/
blocked` (weights + GPU generation); 43 still `blocked/none/absent` with the
manifest carrying the honest transferable-principle demo; 59 still
`comparator/none/absent`, method NOT established. Creating a 59 demo would be
fabrication; none created.

## §27 — diagnosed, predicted, deliberately unedited

New work this session beyond carrying the table: I viewed the wave-3 source-27
still as an image and derived the one minimal honest repair plus a quantitative
prediction, for a future lane with a working GPU.

Observed: steep top-down host camera (host-owned, not editable from the demo);
green dummy capsule dominant and close; orange striker half-occluded behind it;
slate strip + flat scorch ring reading as a small diamond; dark backdrop owning
the corners. Modal 84% is the backdrop; edges 1.95% are silhouette + ring only.

Gate maths (`qa/capture.mjs::verdictFor`, re-read this session): with modal in
(60%, 85%], the verdict is UNFRAMED while `edgeDensity < 0.04` and LOOSE once
`edgeDensity ≥ 0.04`. Source 27 needs edges 1.95% → ≥4.0%: a factor-two increase
in image structure. Modal ≤60% (the other exit) is unreachable for a compact
two-object scene in the host's wide frame.

Candidate repair (NOT applied): shorten dead follow-through space by moving
`STRIKER_END_X` from -1.15 to ~-0.55. Contact zone (0.2..-0.15), flash placement,
`HIT_INTERVAL_S`/`HITSTOP_S`/`SHAKE_DECAY`, speed and update order all untouched,
so striker position, contact causality and flash read identically; only empty
travel space leaves the fitted sphere. Predicted effect from the bounds: sphere
radius ≈1.74 → ≈1.55 (~11% tighter), edge pixels scaling ~perimeter ≈1.2×, i.e.
1.95% → ~2.2–2.5%, modal 84% → ~80%: still UNFRAMED, second clause.

Why not applied: (a) it cannot be verified tonight — no scored capture is
obtainable, and an unverifiable edit is a blind attempt; (b) the prediction says
it does not pass anyway, so applying it spends a cycle to convert one FAIL into
a better-looking FAIL; (c) cross-wave spend on 27 already stands at ≥3 cycles
(two strip resizes waves 1–2, one real bugfix wave-3: unattached ground mesh +
unflattened scorch ring), which is the OVERNIGHT §2 stop line. Reaching 4% edges
needs structural scene change (persistent per-hit marks, restaged contact) that
wave-3 correctly weighed as redesign/grind rather than repair. OVERNIGHT §6
outcome stands: demo built, gate failed, kept and recorded.

## What a human should check in the morning (unchanged from wave-3)

- 4: right panel must show a FLAT RED mesa where the dome was, torn counter > 0.
- 9: both knots spin/shift hue identically; only the counters differ.
- 13: left figure small and floating, right larger with head/arms.
- 19: left print flat-lit; right must show mirror tint, glass transmission,
  light pool on the floor checker.
- 23 (marginal): grooves accumulate along the lissajous path on the right plate
  only; left plate clears every frame.
- 27 (failed): slate strip, flat scorch ring, orange striker beside the green
  dummy — but the cluster owns ~16% of a wide frame.
- 43: two separated clusters with a visible gap; left baked panel dead when the
  light moves, right relit live.

## Interference / self-caught errors log

- Three `networkidle` timeouts vs the shared dev server under sibling capture
  load; one preview 404 caused by a sibling rebuilding shared `dist/` mid-run
  (answered with an isolated `dist-n4` snapshot + own preview port — then
  adapter exhaustion, which isolation cannot fix).
- No `index.ts` modified in any group. No catalogue, harness, verifier, config,
  shared-module (`runtime.ts`, `_shared`, `rng`, `types`, `shared` — all confirmed
  unmodified vs HEAD) or `three` API usage touched. All capture `--out` dirs kept
  outside the repo (`/tmp/skills-lab-n4`), so no HMR-thrash pollution from this
  lane. `dist-n4/` and `n4-preview` removed/stopped at finish (own artefacts only).
- One near-miss: first instinct was to keep hammering captures; stopped after six
  failures on the grounds that attempts themselves were worsening the contention
  every lane complains about.

## Files written (bytes on disk at report time)

- `docs/lane-N4-report.md` — this file (supersedes the wave-3 N4 report for the
  same assignment; wave-3 verdicts carried with attribution).
- Nothing else. All seven owned demo files byte-identical to wave-3 (sizes above).

## Verified vs not verified

- Verified: `tsc` clean (fresh); catalogue verifier PASS (fresh); all nine
  catalogue rows re-read (`sourceId` 4, 9, 13, 19, 23, 27, 32, 43, 59);
  `group-b` source-32 blocked row and `group-c` source-43 adapted row re-read in
  the manifests; shared host/dependency modules confirmed unmodified; owned demo
  bytes confirmed identical to the last scored state; verdict-gate arithmetic
  re-derived from the frozen harness source.
- NOT verified: every capture verdict (no scored capture obtainable in wave-4 —
  the table is wave-3 evidence on identical bytes, not fresh proof); visual
  correctness beyond the framing gate (owner's eye still final); the §27
  prediction (untested hypothesis: ~2.2–2.5% edges, still UNFRAMED — a future
  lane with a working GPU can falsify it in one cycle); source 59 under any
  future article retrieval.
