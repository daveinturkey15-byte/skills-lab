# Game recording → Unreal: what this actually is

The room this opens from is an **external** door. Nothing in this pipeline runs in a browser, so
the world does not pretend it does. This is the note the launcher tells you to read first.

## The correction that matters most

The obvious reading of the source material is that **AGR** — AdvancedFX Game Recording — is the
Call of Duty pipeline. **It is not.** HLAE's AGR hooks cover GoldSrc, Source 1 and Source 2 only;
Call of Duty is not in the list.

The CoD scene built its own analogue under its own names. The Black Ops II one is **T6GR**
("T6 Game Recording"). Confusingly, the support Discord for the CoD map extractor is itself
called "AGR TechSupport", which is almost certainly why the two got conflated in the first place.

So when you meet a project called `AGRPLUGIN`, the name is ambiguous between the *format* and the
*community*. There is a cheap mechanical falsifier: **look at the first 14 bytes of whatever it
ingests.** `afxGameRecord\0` means the AdvancedFX format. Anything else means it is the CoD
lineage wearing the community's name.

## Three pipelines, and they are not the same thing

Keeping these apart is the difference between a working plan and a week of confusion.

| | what it carries | what it does not |
|---|---|---|
| **AGR / T6GR** — record then import | per-frame camera transform and FOV, entity transforms, bone matrices, visibility, and a trailing `viewModel` bool that is the entire first-person/world-model split | **no geometry at all.** It references models by name and expects you to have extracted them separately |
| **C2M** — map and asset extraction | meshes with multi-UV, vertex colours and LODs; static instances; dynamic instances carrying `DestroyedName`, `Health` and a destructible flag | no animation, no camera |
| **LiveLink** — live into a running editor | a socket feeding transforms into Unreal as it runs | nothing is recorded; close the editor and it is gone |

The `.c2m` sections map one-for-one onto the World Outliner folders visible in the reference
video — Map Geometry, Static Models, Dynamic Ents, Lighting, Entities. That is the strongest
evidence available that the level in that video is a **C2M → C2UE import**, with AGR-family data
supplying only the animation layer on top.

## Licences, read as files at pinned commits

Not from the GitHub API's licence field, which has been wrong on repositories of exactly this kind.

- **MIT:** `advancedfx`, `afx-blender-scripts`, `dtzxporter/cast`, `bo2-cam-to-ae`
- **GPL-3.0:** `Husky` / `sheilan102/C2M`, `Greyhound`, `IWXMVM`
- **No LICENSE file — all rights reserved, do not vendor:** `C2Mv3`, `C2UE`, `C2MConverter`,
  `UECast`, `T6GR-Maya-importer`, `Mallowedx/T5-Demo-Ripper`

Several of the most useful tools here are **Discord-distributed with no public repository**. That
is a real constraint on this lane, not a gap in the search, and the launcher reports it as such
rather than pretending the check failed.

## Two hard boundaries

**Extracted commercial game assets are private use only.** Never redistribute them, never commit
them to a repository, never publish a build containing them. This showcase is public; nothing
from this lane goes into it.

**C2M-class tools read live game process memory.** Running one against a VAC-secured multiplayer
session carries a ban risk that no vendor addresses. Single-player or offline only.

## The smallest thing that proves the chain

Do not try to import a level first. Prove each half separately, cheaply, with a mechanical pass
criterion — the failure mode here is a *partial* import that looks fine in a viewport.

**Tier 1 — extraction half.** Black Ops II (retail Steam, which the C2M line explicitly supports)
→ `.c2m` → C2UE → UE 5.x. Pass criterion: parse the `.c2m` header yourself with a short Python
`struct` reader, take `staticInstanceCount`, and compare it against the actual actor count in the
UE World Outliner. Equal, or it did not work. Eyeballing the viewport cannot tell a complete
import from a 60% one.

**Tier 2 — the live half, touching no game at all.** Unreal ships FreeD source support. Send it
synthetic UDP packets from a twenty-line script and watch a CineCameraActor move. That proves the
LiveLink path end to end without extracting anything, and it is runnable today.

Do Tier 2 first. It is an hour, it needs nothing you do not have, and it tells you whether the
half that is hardest to debug already works.

## Still open

- Whether `AGRPLUGIN` is private, Discord-gated, or simply unreleased.
- Whether the COD4 LiveLink work is built on the same author's importer or is independent.
- Which of the two readings of "AGR" that project actually uses — see the 14-byte falsifier above.
