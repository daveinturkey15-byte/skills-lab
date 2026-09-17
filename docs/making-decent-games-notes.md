# Lane C notes — authoring `making-decent-games`

Date: 2026-09-17. Lane C of the skills-lab run. Deliverable: the bootstrap/router skill
"how to make decent games" and its references, written only into the files this lane owns.

## Files written (final)

| File | Lines | Bytes |
|---|---|---|
| `Skills/game-development/making-decent-games/SKILL.md` | 199 | 13,901 |
| `Skills/game-development/making-decent-games/references/quality-gates.md` | 142 | 8,491 |
| `Skills/game-development/making-decent-games/references/build-order.md` | 101 | 5,671 |
| `Skills/game-development/making-decent-games/references/measurement-discipline.md` | 107 | 6,217 |
| `Skills/game-development/making-decent-games/references/anti-patterns.md` | 206 | 12,586 |
| `skills-lab/docs/making-decent-games-notes.md` (this file) | — | see below |

`SKILL.md` is under the 200-line cap. Front matter copies the shape of the newest
neighbours (`threejs-webgpu-interior-lighting-look`, `photoreal-procedural-scene-forge`):
`name`, single-line `description`, `version`, `author: Claude Code (dave-gaming-pc)`,
`license: MIT`, `platforms`, `metadata.hermes.tags` + `related_skills`.

## Research record: every file read

### Read in full (line counts from `wc -l`)

Four named cross-cutting skills:

- `Skills/quality/visual-gauntlet-loop/SKILL.md` — 83
- `Skills/software-development/realtime-browser-qa/SKILL.md` — 215
- `Skills/autonomous-ai-agents/agentic-harness-discipline/SKILL.md` — 104
- `Skills/software-development/software-development-workflows/SKILL.md` — 146

Register sections read in full (`stuff/akp-passport/references/ai-3d-technique-register.md`,
1,501 lines total): lines 1395–1501 — "Explicitly out of scope", "How this register is
used", "Intake procedure — runnable cold, by any harness", "How this loop is enforced",
"Open items for the owner", and the two 2026-09-11 intake stubs. Rows skimmed via a
heading pass (rows 1–50 summaries; row 34 and row 35 text read in the pass).

Gotchas (`Agent-Memory/claude-code/`), read in full — the 25 games/rendering/measurement
files: gotcha-published-but-unselectable-pass (53), gotcha-stale-build-published-green
(33), gotcha-flat-frame-flatters-aggregate (54), gotcha-flat-frame-is-often-light-not-material
(75), gotcha-movement-mirrored-against-camera (37), gotcha-identical-readings-measured-nothing
(72), gotcha-unoccluded-ambient-reads-flat (48), gotcha-metrics-that-move-on-nothing (51),
gotcha-blind-measurement-station (37), gotcha-arena-fps-measured-under-load (29),
gotcha-custom-shader-skips-tonemapping (42), gotcha-fly-wave-star-count-inverted (40),
gotcha-twin-drawn-but-never-ticked (47), gotcha-material-color-tint-cannot-lighten (34),
gotcha-camera-shake-divergence (41), gotcha-gate-drives-debug-backdoor (71),
gotcha-snap-to-ground-never-runs (16), gotcha-viewmodel-stairs-obstruction-aabb (17),
gotcha-microduck-peck-dead-zone (36), gotcha-policy-below-gait-minimum (34),
gotcha-iqbattle-mp-seed-contract (31), gotcha-vite-env-object-read-ships-nothing (45),
gotcha-static-batcher-attribute-mismatch (16), gotcha-silent-disable-error-paths (49),
gotcha-silent-arena-rollback-device-limit (21).

### Read as front matter + section headings (grep pass, not full bodies)

All 18 `Skills/game-development/*/SKILL.md` files — `name`/`description` front matter and
`#`/`##`/`###` headings; line counts: webgpu-tsl-arena-forging 38, game-release-benchmark-guard
48, threejs-source-prop-ingestion 54, game-hud-menu-overhaul 90, blender-gauntlet-loop 125,
reference-image-catalog 130, atomic-acres-procedural-art-authoring 151, atomic-acres-asset-authoring
173, photoreal-procedural-scene-forge 187, threejs-webgpu-interior-lighting-look 201,
ai-3d-asset-generation-loop 202, comfyui-3d-native-pipeline 246, open-world-city-art-loop 284,
procedural-sdf-raymarched-worlds 287, threejs-webgpu-water 342, game-animation-asset-pipeline 361,
img2threejs 613, threejs-rtx-runtime-route 706. (Total 4,238 lines.)

`Skills/software-development/*/SKILL.md` — `name`/`description` front matter for all 34
skills in the category; full-body line counts for the five used in routing:
threejs-game-development 130, threejs-frame-loop-audit 173, threejs-procedural-vegetation
443, browser-multiplayer-netcode 103, browser-game-runtime-debugging 197. (The
browser-game-dev-server-troubleshooting and live-release-state-verification bodies were
not read; only front matter. Their descriptions were the routing basis.)

### Machine-readable evidence

- `skills-lab/public/assets/skills-lab/source-catalog.json` — 2,487 lines. Read via `jq`:
  top-level schema (`schemaVersion`, `sources` (50), `updatedAt`, `adapterNotes`), source
  1 verbatim, then a compact projection of all 50 rows (id, title, status, adaptation,
  demo.status, skillMappings relations, limitations count, blocker head). Honest-state
  facts carried into the skill: statuses implemented/method-extracted/comparator/blocked/
  alias/archive; adaptation adapted/blocked/none; demo implemented/delivered/blocked/absent;
  relations implements/informs/compares/candidate/blocked.
- `skills-lab/CONTEXT.md` — in full (75 lines): the honesty contract and hard rules.

## Routing-table verification

All 31 skill names referenced by `SKILL.md` and its references were confirmed with
`test -d` against the canonical store on 2026-09-17 (first verification attempt used bare
names and failed — the skills live in category subdirectories; corrected):

quality/visual-gauntlet-loop; game-development/{threejs-webgpu-water,
threejs-webgpu-interior-lighting-look, threejs-rtx-runtime-route, game-hud-menu-overhaul,
ai-3d-asset-generation-loop, img2threejs, comfyui-3d-native-pipeline,
game-animation-asset-pipeline, open-world-city-art-loop, photoreal-procedural-scene-forge,
procedural-sdf-raymarched-worlds, reference-image-catalog, webgpu-tsl-arena-forging,
game-release-benchmark-guard, threejs-source-prop-ingestion, blender-gauntlet-loop,
making-decent-games}; software-development/{threejs-procedural-vegetation,
browser-multiplayer-netcode, threejs-frame-loop-audit, live-release-state-verification,
realtime-browser-qa, browser-game-runtime-debugging,
browser-game-dev-server-troubleshooting, atomic-acres-gameplay-patterns,
atomic-acres-release-coordination, the-forge-game-engine,
software-development-workflows, threejs-game-development};
autonomous-ai-agents/agentic-harness-discipline. **31/31 OK, zero misses.**

## Assertions not grounded in a file I read (stated plainly)

1. **The stub-substitution mechanism** in the defensive-loading rule is prescribed by the
   brief (owner instruction), not found in a local gotcha. The fail-visible corollaries
   (announce the stub, surface status) are grounded in gotcha-silent-disable-error-paths
   and gotcha-silent-arena-rollback-device-limit. `references/build-order.md` labels the
   rule "brief-mandated; locally reinforced" and marks the code sketch illustrative.
2. **"Input-to-photon is tight"** — the phrase and the gate framing come from the brief.
   No file I read contains an actual input-to-photon latency measurement. The gate is
   operationalised only with grounded practices (counts vs milliseconds, real-input
   driving, both-direction movement tests, multi-run FPS).
3. **Gate 4's "audio agrees"** — no audio gotcha or audio-owned skill was found or read;
   quality-gates.md marks this clause explicitly as the brief's definition applied under
   the same look-at-the-frame discipline.
4. **The five-gate decomposition itself** (reachable/legible/responsive/coherent/
   finishable) is the brief's framing of the owner's feedback; each gate's concrete test
   is grounded in the cited files, but the five-way split is not quoted from any file.
5. **"Vertical slices"** as a term is a general engineering principle, not a local
   phrase; its spirit (finishable, bounded, honest scope) is grounded in register row 35
   and the skills-lab honesty contract.
6. **"Do not load ahead of need"** in §3 is this lane's conservative routing policy, not
   a quoted directive.
7. **Front-matter `tags`/`related_skills` membership** is my selection; only the shape is
   copied from neighbours.

## Verified vs not verified

**Verified.** Every routing-table skill name exists as a directory (31/31, command output
above). Every gotcha cited in the four written files is one of the 25 files read in full
(no citation from a file only wc'd). SKILL.md is 199 lines (< 200). Byte sizes and line
counts recorded from `wc`. Front-matter shape matches two read neighbours.

**Not verified.** The skill has not been loaded by any harness runtime, so its
`description` trigger behaviour ("fires on game requests without swallowing specialist
requests") is untested — that requires the harnesses' own skill-loader and is the
orchestrator's governance step. No evaluation record was written and no regression guard
was run: the brief reserves both for the orchestrator. The byte sizes in this file are
the sizes at writing time; any later edit by another lane is not reflected. I did not run
git commands (except none), did not kill processes, and touched only the six files this
lane owns.
