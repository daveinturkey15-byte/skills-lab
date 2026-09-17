# Lane H report — generated-asset-rigging

## Files written

| File | Bytes on disk |
|---|---|
| `Skills/game-development/generated-asset-rigging/SKILL.md` | 7441 |
| `Skills/game-development/generated-asset-rigging/references/routes-and-licences.md` | 6813 |
| `skills-lab/docs/lane-H-report.md` (this file) | 4066 |

`SKILL.md` is 102 lines (limit 180). Front matter and heading conventions copied
from `comfyui-3d-native-pipeline/SKILL.md` and
`game-animation-asset-pipeline/SKILL.md`. No other files touched; no git commands
run; no processes killed; no dependencies installed.

## Install claims — each confirmed by looking

- **ComfyUI Trellis.2 node present, no custom pack needed.** Ran
  `Get-Item .../ComfyUI/comfy_extras/nodes_trellis2.py` → 41,942 bytes, and
  `Get-Content .../ComfyUI/comfyui_version.py` → `__version__ = "0.35.0"`.
  `comfy/ldm/trellis2/` exists. Checkpoint gap confirmed: recursive search for
  `*trellis*` under `models/` returned nothing.
- **Mesh post-process chain present.** `Get-Item .../nodes_mesh_postprocess.py` →
  154,778 bytes.
- **Blender 5.1.2 with Rigify and glTF I/O.** `"blender.exe" --version` → Blender
  5.1.2; `addons_core/rigify` (metarigs, rigs, operators) and
  `addons_core/io_scene_gltf2` both present. (First probe used the wrong path
  `scripts/addons`; correct layout is `scripts/addons_core`.)
- **Checkpoint required:** `trellis_2_int8_convrot.safetensors` from the
  `Comfy-Org/TRELLIS.2` repack, under `models/` — per research, the practical
  low-VRAM path.

## Claim traces (research file → skill)

Research files read in full:
`skills-lab-intake-20260917/research/repos-and-assets.md` (873 lines),
`skills-lab-intake-20260917/research/mixamo-rigging-addendum.md` (175 lines).

- SkinTokens/UniRig MIT code + MIT weights, lead-with-SkinTokens → R §6, verdict table.
- Mixamo probably-fine-but-ambiguous (no live redistribution clause; forum folklore;
  §3.6/§4.1/§4.2 unresolved) → A §1, R §6.
- RigAnything cautionary case (NOASSERTION, `LICENSE.md`, revocable noncommercial;
  HF no badge) → R §6.
- RigNet `LICENSE-GPLv3.txt` + list-the-root correction → R §6 and verdict summary.
- Tripo free-tier §5.2.1 ownership transfer, paid-tier grant, plans/table, Smart Mesh
  P2, rig endpoints and `spec: mixamo` → R §4.
- Tripo-geometry-to-Mixamo inconsistency sentence → R §4 (@DilumSanjaya post).
- Animation-source table, redistribution-governs rule, Quaternius QAL 2026-08-28 +
  dated-copy rule → A §1.
- Mesh preconditions, 65-joint/LOD/zero-facial-bones/FBX-only facts → A §2, R §6.
- Verification (4 influences, `JOINTS_1` zero hits, extremes) and export contract →
  A §4–§5.
- Five rigging anti-patterns → A §5 (face/morph items deliberately excluded — lane G).

## What remains OPEN (kept open, per brief)

- Tripo per-task tariff: the brief's figures ($0.25 rig, $0.10 retarget, ~$1.40 P2
  character) are carried as brief-supplied — the research pass found only
  illustrative doc examples and records the tariff as OPEN (R §"What I could not
  establish"). Re-check prices before spending.
- Whether Mixamo "Facial Blendshapes" use ARKit names; Truebones licence terms;
  whether Mixamo reliability degraded after June 2025 (A §7).
- Measured SkinTokens/UniRig quality on actual TRELLIS/Tripo output — nothing was
  run locally; all quality claims are the authors' benchmarks (R §"What I could not
  establish").
- Whether `nvdiffrast` terms constrain commercial use of TRELLIS.2 output; minimum
  VRAM for the ComfyUI int8 path (R §"What I could not establish").

## Not verified

- Skill not exercised end-to-end: no checkpoint downloaded, no mesh generated, no
  rig run, no GLB exported or loaded in three.js. No Blender or ComfyUI process was
  launched (read-only filesystem checks only).
- No licence text re-read independently — all licence findings rest on the research
  pass's pinned reads, not fresh fetches.
