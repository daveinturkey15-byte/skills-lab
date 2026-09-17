# Lane G report — likeness-to-game-character skill

## Files written (bytes from `wc -c` on disk)

| File | Bytes |
|---|---|
| `Skills/game-development/likeness-to-game-character/SKILL.md` | 10350 |
| `Skills/game-development/likeness-to-game-character/references/route-comparison.md` | 6868 |
| `Skills/game-development/likeness-to-game-character/references/licence-readings.md` | 6156 |
| `Skills/game-development/likeness-to-game-character/references/blender-to-threejs.md` | 6072 |

`SKILL.md` is 162 lines including front matter (brief limit: under 180). No other
files touched. No git write commands run. No processes touched.

## Claim trace (skill claim → research source)

Sources: `research/faces-into-games.md` = F with claim table #1–#67 and §§2–7;
`research/mixamo-rigging-addendum.md` = M with §§1–7.

- Dead services (RPM shut 31 Jan 2026 after Netflix acquisition; Meshcapade into Epic,
  closed 18 Apr 2026; Union Avatars closed 2025; Wolf3D same company) → F #15, #16,
  #17, §3 "Dead".
- Alive-example/dead-service trap (`webgpu_animation_retargeting_readyplayer.html`
  works from bundled GLB) → F #29, §3 "Dead"; brief § findings-1.
- Character Creator + Headshot trap (§6.3 proprietary formats, §2.1.C.5, ~$500,
  no native glTF) → F #18, #19, §3 Rank 5.
- FLAME: 2023 Open CC BY 4.0; older binding clause No Distribution (use licensed,
  publishing breach); no derivative-works bullet; UVs in academic `head_template.obj`;
  expression-basis change; bundled `.pkl` illegitimate; no hobbyist tier → F #52–#57,
  §3 "FLAME family" points 1–7.
- Hunyuan3D UK exclusion (Territory, §5(c) output ban) → F #59, §3 "Hunyuan3D".
- DERMIS record (MIT, fixed CC0 MakeHuman head, no image input, one `blink` channel,
  "not a scan" quote, 73,369 verts / 146,496 tris) → F #1–#6, §2; kept out of the
  likeness ranking deliberately.
- Primary (FaceBuilder: 51 shapes, local/offline, pricing, GPL shim + proprietary
  engine, output-ownership wording) → F #20–#24, §3 Rank 1; brief recommendation.
- Fallback (MPFB2 CC0 + live-project status; ICT-FaceKit MIT incl. data, 26,719 verts,
  `_L`/`_R` spelling; MediaPipe Apache-2.0, 52 coefficients) → F #11–#14, #41, #47–#51,
  §3 Ranks 2/2=.
- `rig.mixamo.json` skip-the-rigger + Standard-rig panel → F #13, #41, §4 "Mixamo
  question"; M reconciliation note below.
- Mixamo games permission (FAQ "Create video games", no format clause, 2021-09-14
  stamp, browser-past-403) → F #42–#46, §4 "Mixamo question".
- No-redistribution-clause settlement (FAQ text, 404 + no legal entry, 961 KB bundle
  grep) + low-residual-risk verdict + CMU-safe-default recommendation → M §1.
- Animation-source table (CMU, 100STYLE/Zenodo 8127870, Kenney, ACCAD, MPFB, Quaternius
  QAL 2026-08-28 warning, AMASS, LAFAN1, UE-Only, Truebones ?) → M §1 table.
- `facecap.glb` 20-minute first test → F §5 "first thing to test".
- 8-morph folklore dead (r133, `DataArrayTexture`, glTF floor-not-ceiling, VRAM
  numbers, decimate 5–15k, skip shape-key normals, 4096 `maxTextureSize` TODO) → F #25,
  #28, §4 "What Three.js needs"; M §4.
- ARKit spelling split (`browDownLeft` vs `browDown_L`, silent
  `morphTargetInfluences[undefined] = x`, per-source table, FACS≠ARKit) → F #26, #27,
  #31, #32, §4 "naming trap"; M §4.
- Authoritative ARKit 52 group counts (14/27/10/1) → M §4 "ARKit 52".
- `extras.targetNames` chain + length-mismatch warning + glTF-Transform repair → F #26,
  #27; M §4 "naming chain".
- Structural decision (separate SkinnedMesh, `DetachedBindMode`, Without Skin,
  `retargetClip`, VRAM 2.5× table, `hip` option, `clone()`) → M §3.
- Mixamo rig facts (65 joints / 25–65 LOD, zero facial bones, facial-toggle OPEN,
  FBX/Collada only, shape-key destruction, floating-head rejection) → M §2.
- Join options, colon loss, `.01` scale, tone match, traversal-not-index → F §4
  "Attaching a head"; M §3.
- 14 failure modes verbatim → M §5 (SKILL.md condenses; full text in
  `blender-to-threejs.md`).
- VRM paragraph (3.5.5, MIT, 55 bones incl. eyes/jaw, stylised set, `VRMC` vendor
  prefix, in-file licence block) → M §6.
- Photogrammetry (tools, no-rig warning, bald-cap study, desktop licences incl. AGPL
  avoidance, SIFT expiry) → F #33, #36, #63–#66, §3 Rank 3.
- Avaturn / Polycam terms → F #34, #35, §3 Rank 4 / Rank 3.
- Split-licence trap (FaceLift, OpenLRM, 3DDFA_V2/Deep3DFaceRecon, Skullptor,
  Stable Fast 3D) → F #67, §3 "meta-lesson".
- Single-photo and splat traps (permissive licences but wrong artefact; INRIA
  research-only, `gsplat`/DN-Splatter escapes) → F #60–#62, §3 "traps".
- Gaussian/splat and TRELLIS detail (ComfyUI ≥0.34 native nodes) → F §3 traps.
- Privacy (local steps, cloud substitutes, *Lindqvist* household exemption, ICO
  biometric purpose test, written yes, GLB scrapability, photos out of git) → F #37,
  #38, §6.
- Reconciliation (skip-rigger vs use-rigger-for-rigging + SkinTokens/UniRig MIT
  third option) → F §4–§5 vs M §1 ("use Mixamo for the auto-rigger if at all",
  "UniRig … strongest open alternative, but emits its own bone names"); brief §26–31.
  Skill position: default skip, rigger only for non-standard proportions, UniRig /
  SkinTokens as licence-clean alternative with rename pass.
- three.js pin note (research read r186; lab pins 0.185.1) → honesty note; re-check
  ordered in skill rather than assumed.

## Explicitly OPEN (kept open in the skill)

1. MetaHuman EULA cross-engine wording — licence URL redirects to Epic login, EULA
   mirror 403s (F #39, §7). **Not characterised either way**, per brief.
2. FaceBuilder's missing 52nd shape — `tongueOut` omission inferred, confirm in trial
   (F #32, §7).
3. Whether Mixamo's opt-in "Facial Blendshapes" output uses ARKit names (M §2, §7).
4. Truebones licence terms (M §1 table, §7).
5. Whether Mixamo reliability degraded after the June 2025 auth outage — claimed only
   by Mixamo-alternative vendors (M §7).
6. KIRI Engine ToS — URL 404s; read in-app terms before shipping (F §7).
7. MPI position on whether a fitted output mesh counts as licensed "Data & Software"
   (F §7); commercial FLAME/SMPL-X pricing (F §7; desks differ, Meshcapade pages 403).
8. `flame2023_Open.pkl` login wall vs CC BY 4.0 redistributability; no public mirror
   checked via Hugging Face API name variants (F §7).
9. MediaPipe 52-coefficient output — documented, not run here (F #51, §7).
10. ICT-FaceKit topology/region detail — README-sourced; licence and in-repo data
    verified by listing (F #49, §7).
11. FaceBuilder likeness quality — vendor-sourced, untested; the `facecap.glb` test
    converts the runtime half to fact (F §7).
12. makehumancommunity.org reachability was a same-day observation, not a standing
    claim (F #40); GitHub repos healthy.

## Verified vs not verified

Verified: both research files read in full (F all 654 lines incl. §§2–7 claim table;
M all 175 lines); two neighbouring skills opened and front-matter/heading conventions
copied (`game-animation-asset-pipeline`, `blender-gauntlet-loop`, plus
`threejs-webgpu-water` and one references sample); the four written files exist at
the brief-owned paths only; `wc -l -c` counts above; SKILL.md line count 162 against
the 180 limit; no secrets, no third-party paste, no dependency change; British
spelling in prose; description carries all four trigger phrases.

Not verified: nothing upstream re-fetched (all licence/price/status claims rest on the
2026-09-17 research lane, not fresh reads); Blender/three.js steps not executed; no
`facecap.glb` load test run; no renders, screenshots, or performance numbers taken;
no licence PDFs re-read (Reallusion, Tencent, MPI, Avaturn, Polycam, KIRI); MetaHuman
position deliberately unconfirmed; installed `three` tree not inspected (flagged in
the skill as a re-check).
