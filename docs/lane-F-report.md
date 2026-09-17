# Lane F report — game-recording-to-engine-import skill

## Files written (byte counts from `wc -c`, 2026-09-17)

| File | Bytes |
|---|---|
| `Skills/game-development/game-recording-to-engine-import/SKILL.md` | 8990 |
| `.../references/agr-format.md` | 3934 |
| `.../references/c2m-format.md` | 3386 |
| `.../references/licences.md` | 2978 |
| `skills-lab/docs/lane-F-report.md` (this file) | 6610 (exact after this edit; re-check with `wc -c`) |

`SKILL.md` is 154 lines (`wc -l`), under the brief's 180-line cap. Nothing else
was created or edited; no file outside the three owned paths was touched.

## Claim trace — skill line to research-file line

Research file: `skills-lab-intake-20260917/research/ue5-agr-c2m.md` (cited as R).

- AGR≠CoD correction; HLAE hooks GoldSrc/Source 1/Source 2 only, no CoD hook →
  R§1.3 (line 23).
- T6GR as the BO2 analogue; "T6 = Black Ops 2"; same people (Devostated) →
  R§5.1, §5.6 (lines 91, 96) and R§(b) lines 132–134.
- Support Discord literally named "AGR TechSupport", ~3,209 members, `c2m`
  channel → R§3.16 (line 68).
- 14-byte falsifier `afxGameRecord\0` → R§1.4 (line 22) and R§(b) line 141.
- AGR PRO / AGR V marketplace collision → R§2.6 (line 48).
- Mal's AGRPLUGIN two readings kept open → R§4.5–4.6 (lines 80–81), R§(b)
  lines 136–141; distribution unknown → R§4.4 (line 79), R§(d).2 (line 264).
- Three-pipeline split (record-then-import vs. map extraction vs. LiveLink) →
  R§(b) lines 159–174, R§6.1–6.4 (lines 103–107).
- No public Unreal importer for AGR (related-tools list has no Unreal entry) →
  R§2.4 (line 44); none for T6GR → R§5.5 (line 95).
- AGR carries no geometry; Asset Path + Blender Source Tools SMD workflow →
  R§1.16 (line 34), R§(b) line 128.
- Viewmodel split is one trailing `viewModel` bool → R§1.12 (line 30).
- Poison detail retained: v6 3×4 matrices, parent-relative bones, horizontal FOV,
  dictionary interning, hidden-offset seek, version 5/6 gate → R§1.4–1.15
  (lines 22–33); full restatement lives in `references/agr-format.md`.
- Tier 1 pins (UE 5.6, C2Mv3 v3.0.5 2025-11-30 3,609,725 B, C2UE v1.0.3
  2025-11-24 37,494,652 B, `mp_nuketown_2020`) → R§(c) Tier 0–1 (lines 184–216),
  R§3.4 (line 56), R§3.15 (line 67).
- Independent `struct`-header verification and instance-count equality gate →
  R§(c) Tier 1 steps 4–6 and pass table (lines 218–238); kept verbatim in
  spirit because it is the mechanism that stops partial imports passing green.
- FOV 76.75 as Mal's cine choice vs. BO2 default MP 65 → R§(c) Tier 0 step 5
  (line 199).
- Doorway 190–230 cm; CoD unit ≈ 1 inch → R§(c) pass table (line 235).
- tris > 100k, `mapGeometry`, quantised-colour check, `stat unit` 16.6 ms,
  Warning+ log triage → R§(c) lines 201–204, 229–238.
- Tier 2 (LiveLinkFreeD + synthetic UDP, Camera role, Take Recorder, ≥300 keys,
  <~2-frame latency) → R§(c) Tier 2 (lines 239–250); the "converge on the same
  artefact" note paraphrases line 250.
- MIT rows (advancedfx, afx-blender-scripts, cast, bo2-cam-to-ae) → R§1.2, §2.2,
  §3.18, §5.5 (lines 20, 42, 70, 95).
- GPL-3.0 rows (Husky, sheilan102/C2M, Greyhound, IWXMVM) → R§3.2, §5.7, §4.10
  (lines 54, 97, 85).
- No-LICENCE rows (C2Mv3, C2UE, C2MConverter, UECast, T6GR-Maya-importer,
  T5-Demo-Ripper) → R§3.3, §3.13–3.14, §3.17, §5.5, §4.3 (lines 55, 65–66, 69,
  95, 78).
- Private-use-only / never-commit rule → R§(c) line 180.
- VAC ban risk; single-player/offline consequence → R§(c) line 182, R§(d).11
  (line 270).
- C2M live-memory mechanism, admin note, first-match process → R§3.8 (line 60).
- C2M exports no textures; `_images` side-folder; Greyhound does textures →
  R§3.9 (line 61), R§(b) line 157.
- C2UE drop-in `Plugins/` zip; UE 4.27, 5.1–5.6 → R§3.14 (line 66).
- OPEN section (AGRPLUGIN distribution, polito relationship, which AGR reading,
  Vesper, "multiplayer working") → R§4.7–4.10 (lines 83–85), R§(d) (lines 262–270).
- Discord-distributed / no-public-repo as a real constraint → R§3.3, §3.14,
  §3.17, §4.4 combined with R§(d).2.

## Assertions that are my own reasoning, not the research file's

1. The `description` trigger phrasing ("import a game's map into Unreal", "game
   recording to cinematic", "extract a level", "COD importer", with the
   not-for-ordinary-Unreal/Three.js exclusion) — composed to meet the brief's
   firing rule; no retrieval behaviour was measured.
2. Splitting references into exactly three files (agr-format / c2m-format /
   licences) — structural choice to satisfy "SKILL.md under 180 lines".
3. Front-matter shape (keys, `platforms: [windows]`, tag set, related-skills) —
   copied from the neighbouring `threejs-webgpu-water` and `blender-gauntlet-loop`
   skills per the brief, not derived from research.
4. GPL operational advice in `references/licences.md` ("keep at arm's length
   from shipped code", "use as a tool") — standard GPL-3.0 hygiene applied by
   me; the research file states the licences but gives no handling advice.
5. "Install closed tools into ignored scratch space" — my recommendation
   extending the research file's never-commit rule.
6. Route-table wording that T6GR applies to "BO2 on the Redacted modded client"
   compresses R§5.3; the PoC's deliberate exclusion of T6GR/Redacted follows
   R§(c) "deliberately does not attempt" (lines 252–256).

## Verified versus not verified

Verified: all four files exist at the owned paths; byte counts above from
`wc -c`; `SKILL.md` is 154 lines (< 180); front-matter keys match the two
neighbour skills read; a grep for American spellings
(`behavior|color[^s_]|organize|centraliz|normaliz`) across the new directory
returns nothing; no secret, key, token, or credential string appears in any
file (all tooling is public releases plus a personally owned Steam copy); no
third-party source is pasted — both format references are restatements, and
the only code-adjacent content is the documented `struct`-reader approach
described, not copied; no git write command and no process signal was issued.

Not verified: the Tier 1 and Tier 2 PoCs were not executed (no UE 5.6 / BO2 /
C2M run from this lane); the header offsets and version pins are inherited
from the research pass, whose LICENCE reads and commit pins I did not
re-fetch; the skill was not test-driven cold by an independent agent, so the
`description` firing behaviour is asserted, not measured; the approximate
byte count of this report itself is self-referential (see table note).
