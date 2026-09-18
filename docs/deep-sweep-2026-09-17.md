# Deep sweep — every skill against every source, 2026-09-17

Lane R. Companion machine-readable file: `public/assets/skills-lab/gaps.json` (90 gaps, every one
carrying a checkable evidence string). Read for this sweep: the full 62-row catalogue (wave 3),
all four lab group manifests, `src/lab/runtime.ts`, the 19:25:59Z WebGPU capture report, all five
intake research reports, and 28 skill files — the full bodies of every skill a claim below rests
on, front matter and structure for the six first-party process skills where nothing more was
needed. What this analysis did **not** do is stated at the end. Nothing here was rounded up.

## 1. Skill coverage

Relations per skill, counted from `skillMappings[]` across all 62 catalogue rows. "Carrier"
notes whether the skill body actually contains the mapped method (read this sweep), which is a
different question from whether the mapping exists.

| Skill (vault location) | Sources | Relations | `implements`? | Carrier state |
|---|---|---|---|---|
| game-animation-asset-pipeline | 8 | 1 informs, 5 blocked, **16 implements**, 30 blocked, 31 informs, 49 candidate, 52 compares, 58 candidate | yes (row 16) | Lanes A/A2/A3 carry rows 1, 5, 6, 16, 49 in full; stale line about row 16 licences (§4) |
| threejs-webgpu-water | 7 | 2 informs, 3 compares, 4 informs, 25 blocked, 46 blocked, 51 compares, 57 informs | **no** | Rows 2/3/4/46 ingested (live-source contract + physical stack); 25/51/57 not yet in body |
| ai-3d-asset-generation-loop | 6 | 6, 11, 12, 45 informs, 52 candidate, 56 compares | **no** | Rows 6/10/11/12/36/45 ingested incl. Needle and ComfyUI sections |
| photoreal-procedural-scene-forge | 2 | 7 informs, 35 informs | **no** | Row 35's brief-freeze is gate 1; the skill's *primary* source (morning-diner) has no catalogue row (§4) |
| threejs-webgpu-interior-lighting-look | 2 | 7 candidate, 48 informs | **no** | Row 48 fully ingested (this skill *is* that method); row 7's candidate verified consistent by reading both bodies — promotable |
| img2threejs | 3 | **6 implements**, 43 compares, 60 candidate | yes (row 6) | Body is the row-6 contract; row 60 is a scope mismatch (§2) |
| threejs-source-prop-ingestion | 2 | **10 implements**, 42 informs | yes (row 10) | Body is the vibe3d/thaikit route; row 42's shelf index not yet in body |
| threejs-procedural-vegetation *(`software-development`)* | 4 | 8 informs, **18 implements**, 38 informs, 53 informs | yes (row 18) | **The skill body carries none of the four methods** — it is first-party Fibonacci/instancing content; the blade/wind/LOD method lives only in `source-18.ts` (§4) |
| threejs-frame-loop-audit *(`software-development`)* | 1 | **9 implements** | yes (row 9) | Fully ingested, with the modified-MIT boundary |
| visual-gauntlet-loop *(`quality`)* | 2 | **13 implements**, 47 compares | yes (row 13) | Fully ingested |
| threejs-rtx-runtime-route | 1 | 15 blocked | — (blocked only) | Rows 15 and 19 both in body, with the CC0 direct-adaptation exception; one stale line (§4) |
| game-hud-menu-overhaul | 1 | 26 candidate | **no** | Body restates row 26 verbatim with an explicit row citation — candidate promotable |
| comfyui-3d-native-pipeline | 1 | 45 informs | **no** | Fully ingested; resolves row 45's licence discrepancy (§4) |
| blender-gauntlet-loop | 1 | 54 compares | **no** | Comparator only; correct — the skill's own source (louszbd brief) is not a catalogue row (§3) |
| local-video-generation *(`creative`)* | 1 | 32 blocked | — (blocked only) | Teaches a MiniMax H3 workflow that row 5's licence blocker contradicts (§4) |
| realtime-browser-qa *(`software-development`)* | 1 | 50 informs | **no** | §10 is the ingested passability/draw-calls-first pattern |
| unreal-content-pipeline *(`software-development`)* | 2 | 61, 62 candidate | **no** | Body carries no LiveLink or importer content; rows 61/62 belong to the new game-recording skill (§2) |
| brief-driven-scene-production | 1 | 35 informs | — | **Skill does not exist** (§2/§4 of gaps.json) |
| atomic-acres-production-asset-governance | 1 | 36 candidate | — | **Skill does not exist** |
| atomic-acres-destructible-world | 1 | 40 candidate | — | **Skill does not exist** |

**Skills fed entirely by `informs`/`candidate` — nobody has tested them against their evidence:**
`threejs-webgpu-water` (7 mappings, zero implements), `ai-3d-asset-generation-loop` (6, zero),
`photoreal-procedural-scene-forge` (2, zero), `threejs-webgpu-interior-lighting-look` (2, zero),
`comfyui-3d-native-pipeline` (1 informs), `realtime-browser-qa` (1 informs), `blender-gauntlet-loop`
(1 compares), `unreal-content-pipeline` (2 candidates, miscategorised), `game-hud-menu-overhaul`
(1 candidate, now verifiable). The starkest case is the water skill: seven mappings, the deepest
physical stack in the library, and not one demo registered as executing it — while the one demo
that exercises its steps 1–3 (`source-46.ts`) captured FLAT and is mapped to nothing.

## 2. Orphan sources

23 of 62 sources have empty or entirely-`candidate` `skillMappings`. Each is either a skill we
should write or a source we should stop citing:

**Should become skills (real, executed methods with no carrier):**

- **19** — classic Whitted tracer, CC0 (the register's *only* directly-adaptable licence), demo
  built, zero mappings — and the method is *already restated* in `threejs-rtx-runtime-route`.
  The mapping is simply missing; add it before writing anything.
- **20** — plate-level armour/ballistics resolution, demo delivered, no carrier. Gameplay-ready
  and unique in the library; write the skill.
- **23** — persistent deformation state (accumulate, never clear; banked recovery), demo built,
  no carrier.
- **33** — LOD by projected geometric error with hysteresis + neighbour constraints: **the only
  catalogue demo-built row that passes today's gate**, and it feeds nothing.
- **34** — subsystem-contract decomposition, demo delivered, no carrier (the city skill cites it
  in prose without a mapping).
- **37, 39** — both *passing* today (coordinate-boundary conversion; replayable editor-operation
  log), both carrier-less. Niche but genuinely reusable.

**Candidate mappings this sweep verified or would re-file (catalogue edits, not new work):**

- **26** → `game-hud-menu-overhaul`: candidate can be **promoted**; the body cites row 26 and
  restates it fully.
- **49** → `game-animation-asset-pipeline`: candidate can be **promoted**; Lane A3 *is* row 49.
- **61, 62** → re-file from `unreal-content-pipeline` (no LiveLink content there) to
  `game-recording-to-engine-import`, which ingested tonight's research completely.
- **58** → miscategorised (DERMIS is not an animation-pipeline source); re-file or drop.
- **60** → scope mismatch with `img2threejs` (image→game ≠ image→model); drop or refile.
- **36, 40** → target skills do not exist; write them or drop the mappings.
- **19** (above) → add the missing mapping the body already justifies.

**Correctly unmapped — stop-citing class, keep as comparators/blocked:**

- **14, 17** — comparators whose demos are our own formulations; 14 is cited by
  `atomic-acres-asset-authoring` with no recorded mapping (add it or leave comparator-only).
- **21** — alias; must never be counted as a technique.
- **22, 24, 44, 55, 59** — blocked or contentless by the register's own finding; no skill should
  be written from any of them. 24's comparator properties duplicate rows 18/38; consider archiving.

## 3. Orphan skills

Eleven of the 22 `game-development` skills are fed by no source at all. Split honestly:

**First-party by design — legitimate orphans (6):** `making-decent-games` (router built from our
own gotchas), `game-release-benchmark-guard`, `webgpu-tsl-arena-forging`,
`atomic-acres-procedural-art-authoring`, `atomic-acres-asset-authoring`,
`procedural-sdf-raymarched-worlds` (own maths). Nothing has disappeared; nothing needs a source.

**Written from evidence that never entered the catalogue (5):**

- `likeness-to-game-character` — rests on tonight's face-capture family (KeenTools FaceBuilder,
  MPFB2, ICT-FaceKit, MediaPipe, MakeHuman, CMU Mocap, 100STYLE). None is a catalogue row; the
  nearest row (58, DERMIS) is explicitly *not* a likeness route.
- `generated-asset-rigging` — rests on SkinTokens, UniRig, Puppeteer, RigAnything, RigNet
  (MIT/Apache/non-commercial readings from tonight). No rows.
- `game-recording-to-engine-import` — authored tonight (OMP Lane F) from the AGR/C2M/LiveLink
  research; its format and tool sources (advancedfx, C2Mv3, C2UE, Greyhound, T6GR tooling) have
  no rows.
- `reference-image-catalog` — cites one @0xrishi post; no row.
- `open-world-city-art-loop` — names register row 47 as its source, but row 47's mapping points
  only at `visual-gauntlet-loop`.

The pattern is consistent: **the catalogue's 62 rows do not include several families that are
load-bearing for skills written this week.** If the Atlas is to answer "which evidence feeds
which skill", these families need rows, not just skill files.

## 4. Stale and contradicted evidence

The three worked examples from tonight's run (row 53 verdant-forest licence-less and learn-only;
row 57's transpiler pinned to r186 against this repo's 0.185.1; the Mixamo §3.6/§3.5 position)
are all confirmed by the underlying files and are recorded in `gaps.json`. Beyond them:

**Skill bodies contradicting the catalogue:**

- `game-animation-asset-pipeline` says row 16's licences are "not yet inspected"; row 16's
  evidence records them read (Apache-2.0 file body; NVIDIA Open Model License weights with no
  country exclusion; SMPL-X RP checkpoint unusable). The skill would send a lane back to redo a
  completed reading.
- `threejs-rtx-runtime-route` says row 15's sources have "no pinned commit or an inspected
  licence yet"; row 15 pins threepp @ 367ec39 and records its MIT licence file read.
- `local-video-generation` teaches a MiniMax H3 reference-to-video workflow; row 5 records that
  model **and its output** as licence-excluded in the UK, register position re-verified 2026-08-26
  and standing. One of these records is wrong; the discrepancy is load-bearing for any
  generated-animation lane.

**The r186 question, stated precisely.** The weather/cloud/grade report is verified against
r186, not the installed 0.185.1. I checked the installed build directly: `RenderPipeline`,
`VolumeNodeMaterial` and `SkyMesh`'s `cloudCoverage` all exist at 0.185.1, so the risk is
API-detail drift, not wholesale absence — but every API adoption still needs the
confirm-against-`node_modules` pass, and cuda-webshader's bridge (row 57) hard-throws on
anything but r186 today.

**Skills ahead of the catalogue (the good direction):** `comfyui-3d-native-pipeline` resolves
row 45's "repackage licence discrepancy" (Comfy-Org repos carry no LICENSE file, only a card
field; the DINOv3 encoder is Meta's custom licence with attribution conditions), and
`ai-3d-asset-generation-loop` carries the same finding — the row's limitation still just defers it.

**New contradictions found this sweep:**

- The catalogue says **29** sources have a demo built; the code has **43** distinct source ids
  with a real factory (§5). Both numbers are currently wrong about reality in opposite
  directions, and the 19:25Z capture says only 5 mounted demos pass the gate — of which just
  **one (33)** is a row the catalogue credits.
- `repos-and-assets.md` states "no rigging skill" in the catalogue;
  `generated-asset-rigging/SKILL.md` existed by 18:24, before the report file's 18:59 write. The
  report's internal check likely predates the skill; the line needs a correction note either way.
- `qa/captures/report.json`'s `readout` field is one constant string on all 54 rows, and the four
  group-d rows carry `sourceId: null` — two evidence-integrity defects for anything joining on it.
- `group-d/index.ts`'s header claims the host dedupes by sourceId keeping the first;
  `runtime.ts` `refreshGroups` does no such thing (variants are per-title; all four source-51
  demos mounted and captured). The comment is stale, not the host.
- All 29 catalogue demo entrypoints point at `src/map3/technique-lab/...` paths that do not
  exist in this repository — every join on `demo.entrypoint` fails until rows are re-staged.
- `threejs-procedural-vegetation` carries an `implements` mapping (row 18) whose method —
  blade/wind/LOD — appears nowhere in the skill's 443 lines; it lives only in the demo file. The
  relation vocabulary defines `implements` via demo evidence, so the mapping is *true as
  defined*, but anyone reading it as "the skill contains this" would be wrong.

**Age, where it matters:** rows 1–50's evidence is uniformly 2026-09-12 (five days — fine). The
genuinely old load-bearing items are row 45's generator licences (read 2026-09-02, since refined
by two skills), row 5's MiniMax position (register re-verify 2026-08-26, now contradicted by a
vault skill), and the super-terrain pin e417c04 (2026-08-23) that rows 33/38 still ride — the
MIT licence exists only at HEAD b82e823, so adoption requires the re-pin plus a file-read that
has not happened.

## 5. The demo/claim mismatch

Three numbers circulate. Established from the manifests, the imports, and `runtime.ts` — not
from a build:

- **29** — catalogue rows with `demo.status` implemented (23) or delivered (6). Overcounts by
  the alias (row 21 reuses row 19's factory and frame), and includes rows 3/4/5/14/17 whose
  demos are explicitly *our own formulation* of comparator or licence-neutral material, and row
  36 whose catalogue entrypoint is a Blender artefact.
- **51** — distinct source ids appearing anywhere in the lab (ids 1–51, i.e. every wave-1/2/3
  row except the eleven wave-3 posts 52–62).
- **43 — the load-bearing number: distinct source ids with a real `createDemo` factory.**
  47 of the 54 manifest entries carry a factory (43 ids + alias 21 delegating to 19's + three
  further source-51 variants); 7 entries are honestly factory-less (15, 22, 24, 25, 30, 32, 44);
  11 sources (52–62) are absent from the lab entirely, matching their `demo.status: absent`.

The difference is timing, not deception: the catalogue was frozen at wave 3 before tonight's
group-C/D builds. Fifteen rows (35, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50, 51) have
factories the catalogue still calls absent — and four of those (37, 39, 42, 47) **pass** today's
gate, so the catalogue understates accepted coverage. Conversely, of the 29 rows the catalogue
credits with demos, **28 captured blocking** at 19:25:59Z (46 UNFRAMED, 2 FLAT, 1 BLANK across
the whole 54; only 33, 37, 39, 42, 47 drew something). Today's honest sentence is: *43 sources
have a real demo; 5 pass the framing gate; exactly 1 of those is a row the catalogue credits.*
The gate measures framing, not technique correctness (OVERNIGHT §3), so this is a framing-repair
queue, not an indictment of the methods.

## 6. What to build next, ranked

1. **Skill: `threejs-webgpu-storm-weather`.** Tonight's largest research artefact (volumetric
   clouds, cloud shadows, the r186 grade chain, the storminess state machine) has no carrier
   skill, and the four group-d demos that hint at it all fail the gate. One skill absorbs the
   whole report and gives the demos a home.
2. **Demo: a GPU/TSL volumetric cloud for source 51.** The current bake is CPU at 96×128 with
   32 view steps by its own admission; the report's §5 build order (0.4× res, baked 3D noise,
   JBU upsample) is the graded path to the one look the owner originally pointed at.
3. **Rebuild: source 49 (MotionBricks planner) — the repo's only BLANK capture.** A
   constraint-spring visualiser of the critically-damped placement would turn the one
   nothing-renders demo into the carrier for Lane A3's teaching.
4. **Demo: source 53 as an original instanced-LOD woodland.** The "cool forest" that prompted
   this project is learn-only; its technique (per-cell instancing, distance-budgeted density,
   wind-inflated bounds) is restatable and feeds `threejs-procedural-vegetation`, whose body
   currently carries none of its four sources' methods.
5. **Skill: `brief-driven-scene-production`.** Row 35 declares its authorship OPEN; the
   one-page-brief pattern is already the forge skill's gate 1 and the template for the owner's
   map briefs. Cheapest skill-missing gap to close.
6. **Demo: repair source 46 (FLAT) — the only demonstration of the water skill's physical
   stack.** Absorption + upstream backscatter + Jacobian foam is the skill's steps 1–3, the
   precondition for everything else in that skill; it currently renders flat.
7. **Demo: source 57's two-scale GPU-resident ocean without the transpiler.** The r186 bridge
   throws today, but the method (JONSWAP bake, depth-dispersed march, conjugate-symmetric stitch)
   is portable to a hand-written 0.185.1 WGSL/TSL path — the water skill's step 5, unblocked.
8. **Skill: terrain deformation state machine (from source 23).** Persistent accumulating state,
   texel-snapped toroidal windows, banked recovery — a completed demo and no carrier.
9. **Skill: `threejs-subsystem-contract-architecture` (from source 34).** The decomposition
   pattern is already cited by the city skill and demonstrated in a delivered demo; it deserves
   a carrier that is not a prose mention.
10. **Catalogue re-staging pass (not a demo, load-bearing anyway).** Fifteen rows' `demo.status`
    are stale, all 29 entrypoints point at dead paths, and the verified-candidate mappings
    (26→hud, 49→animation, 19→rtx, 61/62→game-recording) need recording — otherwise the Atlas
    will faithfully render a fiction the tree outgrew yesterday.

## What this analysis did not establish

- Verdicts are from the 19:25:59Z snapshot; build lanes are iterating and the report rotates.
  Every capture number here ages.
- No external URL was re-fetched; catalogue evidence dates stand as recorded. The Adobe §3.6
  clause text is taken from tonight's report (which re-fetched it via the AEM fragment with
  second-party verification), not re-verified by this lane.
- The MiniMax H3 contradiction (row 5 vs `local-video-generation`) is established as a
  discrepancy between two vault records; this lane did not re-read the MiniMax licence itself,
  so it cannot say which record is correct — only that both cannot be.
- `microsoft/TRELLIS.2`'s dependency licences (nvdiffrast and friends) remain flagged-not-resolved
  in tonight's research and are unresolved here.
- Ten first-party skills were read to front matter and structure only; no claim below the fold
  of those files is made.
- The capture harness's `readout` defect and group-d `sourceId` nulls were observed, not
  diagnosed; the capture script belongs to another lane.
