# Lane J — three factual corrections: report

Scope: surgical text corrections only. No maths, no redesign.

## Evidence read before editing

- `skills-lab-intake-20260917/research/weather-clouds-grade.md` §1.0 (frames 02/04/06
  inspected; frame 04 is a cumulus congestus turret-stack with no anvil spread; the
  anvil-flare height gradient is called out as wrong for this reference).
- `skills-lab-intake-20260917/research/ue5-agr-c2m.md` §§(a)–(b) (AGR = AdvancedFX Game
  Recording, `advancedfx/advancedfx` MIT pin `79886f03747efe78e0038c3cf5cbf7e7eb4ce597`;
  hooks cover GoldSrc/Source 1/Source 2 only; T6GR analogue; "AGR TechSupport" Discord;
  first-14-bytes falsifier).
- `LICENSE` at `SamG-Coder/dermis-cuda@6c7c598` — read as raw text, MIT,
  "Copyright (c) 2026 SamG-Coder and CUDA WebShader contributors". Verified by this lane.
- `LICENSE` at `advancedfx/advancedfx@79886f0…` — read as raw text, MIT,
  "Copyright (c) 2021 advancedfx.org". Verified by this lane.
- The remaining DERMIS details (no image input path, framebuffer-PNG button, fixed CC0
  MakeHuman male sha256-pinned in `provenance.json`, 73,369 verts, one `blink` channel,
  README "not a scan or a claim of photorealism") are taken from the brief, not
  independently re-inspected by this lane. The catalogue evidence entry records the pin
  so the next reader can check.

## Correction 1 — the cloud is not an anvil

Files: `src/lab/demos/group-d/source-51-cloud.ts` (metadata strings only),
`src/lab/demos/group-d/index.ts` (first manifest entry only).

### `source-51-cloud.ts` — title

Before:

> Anvil cumulonimbus: CPU-baked raymarch with light march and HG rim

After:

> Cumulus congestus turret-stack: CPU-baked raymarch with light march and HG rim

### `source-51-cloud.ts` — method

Before:

> Layered value/Worley density written for this demo, eroded flat at the anvil cap,
> marched front-to-back with Beer-Lambert extinction, a {lightSteps}-step light march
> toward a low warm sun at each occupied sample, and a Henyey-Greenstein phase term that
> silvers thin forward-lit edges. The bake is shown as a billboard inside a wire frame of
> the exact marched box, with the sun disc drawn where the march assumed it.

After:

> Layered value/Worley density written for this demo, marched front-to-back with
> Beer-Lambert extinction, a {lightSteps}-step light march toward a low warm sun at each
> occupied sample, and a Henyey-Greenstein phase term that silvers thin forward-lit
> edges. The bake is shown as a billboard inside a wire frame of the exact marched box,
> with the sun disc drawn where the march assumed it.

(Only change: the "eroded flat at the anvil cap" clause removed.)

### `source-51-cloud.ts` — limitation

Before (ending):

> … A live fragment version holds 60fps only at a reduced step count this lane could not
> measure, so no such claim is made here.

After (same text, plus this appended):

> … so no such claim is made here. Shaping mismatch owned: the density field still flares
> to a flat anvil cap (column radius more than triples above y≈4.4 with a flat top cut)
> while the reference frames show a cumulus congestus turret-stack of roughly constant
> width with no anvil spread — the silhouette reads as an anvil, not the referenced stack.

### `group-d/index.ts` — manifest entry (sourceId 51, first entry)

Title: same before/after as above.

Method before:

> Layered value/Worley density written for this demo, eroded flat at the anvil cap,
> marched front-to-back with Beer-Lambert extinction, a 5-step light march toward a low
> warm sun at each occupied sample, and a Henyey-Greenstein phase term for thin
> forward-lit edges.

Method after:

> Layered value/Worley density written for this demo, marched front-to-back with
> Beer-Lambert extinction, a 5-step light march toward a low warm sun at each occupied
> sample, and a Henyey-Greenstein phase term for thin forward-lit edges.

Limitation before:

> CPU bake at 96x128 texels and 32 view steps, not a live GPU raymarch; motion is
> whole-tower advection of the static bake. Step count and density are construction
> constants, not live controls.

Limitation after (same text, plus this appended):

> … not live controls. Shaping mismatch owned: the field still flares to a flat anvil cap
> while the reference is a cumulus congestus turret-stack with no anvil spread.

### Deliberately untouched (outside the owned strings)

- `densityAt` / `bakeCloud` maths in `cloud-field.ts` — not read for editing, not changed.
- The file header comment, `root.name` (`source-51-raymarched-anvil`), the
  `anvil-billboard` mesh name, and the comparison line "Raymarched anvil inside the same
  volume" in `source-51-cloud.ts` still say "anvil". The brief limited this lane to the
  `title` / `method` / `limitation` strings, so these were left alone. A follow-up may
  wish to rename them.

## Correction 2 — DERMIS has a public repository (catalogue row 58)

### `urls[]` — appended one entry

> { "kind": "repo", "label": "dermis-cuda @ 6c7c598 (MIT, licence file read at pin)",
>   "url": "https://github.com/SamG-Coder/dermis-cuda" }

### `evidence[]` — appended one entry (`inspectedAt`: 2026-09-17)

> dermis-cuda @ 6c7c598 (MIT — LICENSE read at pin: "Copyright (c) 2026 SamG-Coder and
> CUDA WebShader contributors"). Its README states the work is "not a scan or a claim of
> photorealism". Source read finds no image input path: the only "capture" is a button
> writing the framebuffer out to PNG. The head is one fixed CC0 MakeHuman male,
> sha256-pinned in provenance.json, subdivided to 73,369 verts, with exactly one
> blendshape channel (blink). This supports, rather than weakens, the NOT-a-likeness
> finding.

### `limitations[0]` — strengthened

Before:

> EXPLICITLY NOT A FACE-CAPTURE OR LIKENESS ROUTE: a procedural human renderer on a
> MakeHuman base. Must not be re-read as identity capture.

After:

> EXPLICITLY NOT A FACE-CAPTURE OR LIKENESS ROUTE: a procedural human renderer on a fixed
> MakeHuman base. Must not be re-read as identity capture. Confirmed by the located
> repository: no image input path, one fixed base head, a single blink channel — there is
> nothing here that could take a likeness.

### `limitations[1]` — replaced (it was no longer true)

Before:

> No DERMIS repository or write-up located; pipeline claims (100,000 scalp strands,
> CUDA-authored) come from the post.

After:

> Repository located since first record: SamG-Coder/dermis-cuda @ 6c7c598 (MIT, licence
> file read at pin). Pipeline claims now pinned to a source read (framebuffer-PNG capture
> only; 73,369-vert subdivided MakeHuman male; one blink channel), not just the post.

`limitations[2]` (MakeHuman base-mesh licence unverified) unchanged.

## Correction 3 — what "AGR" abbreviates (catalogue row 62)

### `urls[]` — appended one entry

> { "kind": "repo", "label": "advancedfx @ 79886f0 (MIT, licence file read at pin)",
>   "url": "https://github.com/advancedfx/advancedfx" }

### `method` — appended (existing sentence kept verbatim)

> On "AGR": the format reading is AdvancedFX Game Recording (advancedfx/advancedfx @
> 79886f0, MIT, licence file read at pin) — but its hook DLLs cover GoldSrc, Source 1 and
> Source 2 only, not Call of Duty, whose scene built its own analogue T6GR ("T6 Game
> Recording", T6 = Black Ops 2); the C2M support Discord is itself named "AGR
> TechSupport". So the "AGR" in AGRPLUGIN stays ambiguous between the format and the
> community. Falsifier: the first 14 bytes of whatever it ingests, afxGameRecord\0 or not.

### `limitations[2]` — replaced

Before:

> What "AGR" abbreviates is not established from the frames.

After:

> "AGR" is now partly established and deliberately left OPEN: "AdvancedFX Game Recording"
> (advancedfx/advancedfx) names a real format, but that repo's hook DLLs cover GoldSrc,
> Source 1 and Source 2 only — not Call of Duty — while the CoD scene built its own
> analogue T6GR ("T6 Game Recording", T6 = Black Ops 2) and the C2M support Discord is
> itself named "AGR TechSupport". The name may mean the format or the community; not
> resolved here.

Ambiguity kept open as instructed; no resolution claimed. `blocker`, `evidence`,
`skillMappings`, `status`, `title` on row 62 untouched.

## Confirmation of non-interference

- `git status --short` shows exactly three modified files: `source-51-cloud.ts`,
  `group-d/index.ts`, `source-catalog.json` (plus this new report file, untracked).
- Catalogue diff touches rows 58 and 62 only: no `sourceId` line added or removed, and
  `git diff --stat` on `cloud-field.ts` is empty — no maths changed.
- Source count still 62 (see verification below).

## Verification (exact outputs)

1. `node scripts/verify-catalog.mjs`:

```text
catalogue: 62 sources, updated 2026-09-17 (wave 3)
status: implemented=22 comparator=16 blocked=9 method-extracted=13 alias=1 archive=1
demo files declare 51 distinct source ids
note: source 36: demo.entrypoint is not a module path — "source-assets: docs/technique-lab/group-c/blender/source-36-remesh.blend"

PASS — no source claims more than the repository can show.
```

2. `npx tsc --noEmit`: no output (clean).

3. `node -e "const c=require('./public/assets/skills-lab/source-catalog.json');console.log(c.sources.length)"`:
   `62`.

## Not verified by this lane

- The DERMIS source-read details beyond the licence (no image input path, 73,369 verts,
  single `blink` channel, `provenance.json` pin, README wording) were recorded from the
  brief, not re-inspected file-by-file by this lane.
- No browser/GPU run: the cloud rename was not visually checked (no screenshot, no
  side-by-side against frame 04). The limitation admits the silhouette gap on the basis
  of the maths read, not a fresh render.
- The AGR research claims (hook coverage, T6GR, Discord name, magic bytes) were read in
  the intake research file, not re-fetched from primary sources by this lane — except the
  AdvancedFX MIT licence, which was read at pin.
