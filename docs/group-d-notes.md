# Lane E report — group D: sailing-game weather as four live demos

Lane E, 2026-09-17. Four demos in `src/lab/demos/group-d/` on source 51
(the sailing game), plus this report. All adaptation claims are `adapted`:
every noise, march, grade and driver below was written for this lane, not
ported. No third-party source was vendored, copied or pasted.

## Files written (lane E owns only these)

- `src/lab/demos/group-d/shared.ts` — CPU noise (value 2D/3D, domain-rotated
  fbm, single-octave cellular detail), exact sRGB encode/decode,
  lift/gamma/gain + saturation + contrast grade, panel rig, dispose helper.
- `src/lab/demos/group-d/cloud-field.ts` — the one coverage field behind D1
  and D2, the anvil density profile, HG phase, and the CPU raymarch bake.
  Zero three.js imports, so Node times the exact loop the demo runs.
- `src/lab/demos/group-d/source-51-cloud.ts` (D1), `source-51-shadow.ts`
  (D2), `source-51-grade.ts` (D3), `source-51-storm.ts` (D4).
- `src/lab/demos/group-d/index.ts` — manifest, four rows, all `sourceId: 51`.
- `docs/group-d-notes.md` — this file.

## Read this first: three host conflicts this lane cannot resolve

1. **`sourceId: 51` is out of range for the host as read.** `validId` in
   `src/lab/runtime.ts` accepts 1–50 only, and `refreshGroups` dedupes rows
   by `sourceId`, keeping the first and ignoring the rest with an error.
   Four rows sharing 51 therefore mount at most one until the host learns
   multi-demo rows (or a wider id range). Built as briefed anyway; the
   conflict is recorded here, not worked around.
2. **The catalogue still ends at 50.** Lane D is extending it to 62 in
   parallel; at the time of writing the only source-51 identity available is
   the intake table row (`x.com/zackontopx/status/2100183743436890237` —
   Three.js sailing game: boat, open water, weather state machine). All four
   manifest rows and all four `metadata.sources` carry that one URL in
   `https://` form, matching the existing catalogue convention. If lane D
   adds further URLs for 51, these rows should gain them.
3. **Step counts, densities, grades and taus are construction constants, not
   live dials.** The host offers no per-demo parameter surface, so "exposed
   parameters" means exported constants (`CLOUD_PARAMS`, `SHADOW_PARAMS`,
   `GRADE`, `STORM_TAUS`, `STORM_PERIOD`) plus in-scene meters for D4. Each
   demo's limitation says this.

## D1 — raymarched storm cloud

A single anvil cumulonimbus marched inside a wire frame of the exact marched
box: layered value/Worley density with cellular erosion confined to the cap
(flat top, not cauliflower), Beer-Lambert extinction on the view ray, a
5-step light march toward a low warm sun at each occupied sample, and a
Henyey-Greenstein phase (`g = 0.35`) that silvers thin forward-lit edges. The
sun disc is drawn where the march assumed it. The exhibit is the CPU bake on
a billboard; motion is whole-tower advection of the static bake.

Parameters: `CLOUD_PARAMS` — 32 view steps, 5 light steps, density 1.0,
coverage 0.55; bake 96×128. Cost, measured in Node on this machine with the
throwaway harness (`/tmp/gd/harness.cjs`, not in the repo): **67–73 ms wall
for the full bake** (12,288 rays × 32 steps; `densityAt` ≈ 350–465 ns/eval).
`update()` is O(1) per frame. Honest photometry: peak billboard alpha is
164/255 with ~6% of texels above quarter opacity — a slender core in broad
thin skirts, i.e. a distant storm cell, not a frame-filling monster. A live
fragment version holds 60fps only at a reduced step count this lane could not
measure, so no such claim is made.

## D2 — cloud shadows that agree with the sky

One coverage field drives both sides: the overhead deck re-samples the field
into alpha every frame, and each shadowed ground vertex multiplies its sun
term by one minus the same field at its own world position, same clock, same
wind vector. The control panel keeps identical albedo and blocking forms
under flat sun, so the shadow is the only variable; the manifest carries the
`comparison` entry the host legend reads. Agreement is structural, not tuned.

Parameters: `SHADOW_PARAMS` — 9-unit panels at 36 segments, field scale 0.09,
shadow strength 0.82, ambient floor 0.30, deck 128×64 re-sampled per frame.
Cost, estimated from harness micros (`coverageField` ≈ 45–75 ns/eval):
≈ 9,600 evals/frame (deck + ground) ≈ **0.5–0.7 ms CPU** plus a 32 KB texture
upload — an estimate, not a measurement; no frame was ever observed. The
projection is vertical (a high-sun approximation): a low sun would slant
shadows away from their clouds, unmodelled. The shadow lives in ground vertex
colours only; the blocking forms are host-lit and neither cast nor catch it.

## D3 — colour correction and the missing output conversion

Seven fixed linear chips (deep shadow, dark, mid, light, an HDR specular at
3.0, saturated red and blue) take a lift/gamma/gain + saturation + contrast
grade. Both halves show the graded scene; the left bakes the known trap —
raw-shader emission with no output conversion, darker — and the right bakes
the identical grade with the sRGB encode restored, with an ungraded reference
strip in frame. The host was read, not assumed: `initRenderer` sets neither
`toneMapping` nor `outputColorSpace`, so the renderer keeps three's defaults
(`NoToneMapping`, `Renderer.js:192`; `SRGBColorSpace` output,
`Renderer.js:184`) — on this host the trap is purely the missing encode, and
the method names that. No live shader runs here, so the darker half is the
exact displayed colour a conversion-less shader would produce, pre-distorted
(`V = decode(D)`) so the converting path shows it.

Parameters: exported `GRADE` (lift 0.015/0.015/0.02, gamma 1.12, gain
1.06/1.00/0.94 warm, saturation 1.3, contrast 1.1 about pivot 0.18) and
`SCENE_CHIPS`. Cost: zero per frame — static chart, no `update`. Harness
asserts: neutral grade is identity to 1e-9, sRGB round-trip within 2e-5, and
the mid chip reads 0.237 raw versus 0.524 corrected by Rec.709 luminance.

## D4 — one storminess value driving everything

Storminess loops calm–storm–calm over `STORM_PERIOD` = 80 s; sun colour and
intensity, cloud coverage and density, rain rate (quadratic, so calm stays
dry), sea amplitude and roughness, haze and an emulated exposure each chase
it with time constants 2.5–18 s (`STORM_TAUS`), so channels lag differently
and states blend. Water is the frozen spectrum via `sampleOcean` — never a
second wave model — at 0.35–2.0× reference amplitude; eight meter bars and a
live `root.userData['storm-state']` readout show the value and every channel.
True renderer exposure is host-owned and untouched; the exposure channel is a
stated emulation on sky colours. Foam is a height-threshold tint, not the
water demo's breaking field; sea normals are recomputed per frame on the CPU.

Cost, estimated from harness micros (`coverageField` ≈ 60 ns,
`sampleOcean` ≈ 160 ns): deck 4,608 + sea 729 evals ≈ **0.4 ms CPU/frame**
excluding three's internal normal recomputation — an estimate, unobserved.
Storminess runs on mount age: two mounts match only at equal age.

## TSL APIs checked at three 0.185.1 (grep over `node_modules/three/build/three.tsl.js`)

Present as exports: `Fn`, `float`, `vec3`, `mix`, `smoothstep`, `sub`, `mul`,
`add`, `div`, `pow`, `saturate`, `sRGBTransferEOTF`, `gain`, `mx_contrast`.
Not found as an export: `linearToOutputTexel`. Used by these demos: **none**
— everything is CPU-baked per the source-46 precedent, so only presence was
checked, never call signatures or runtime semantics.

## Verification log

- `npx tsc --noEmit` from the repo root: **no output, exit 0** (whole repo,
  including the seven new group-d files). Exact output is the absence of any.
- Throwaway Node harness (`/tmp/gd/harness.cjs` + compiled pure modules in
  `/tmp/gd`, both outside the repo and deleted with it): **24 asserts pass**,
  covering sRGB round-trip, grade identity, trap direction (0.237 < 0.524),
  coverage range/determinism/cloud fraction (0.67 at coverage 0.55), density
  bounds and in-tower presence, sun-factor bounds, storm endpoint targets,
  bake determinism/shape/presence, ocean finiteness, plus wall timings
  (bake 67–73 ms) and per-eval micros above. The harness caught two real
  defects before they shipped: a shaping threshold that starved the tower
  (empty bake) and a thin extinction that left peak alpha at 57/255.
- Determinism: seeded field plus mount-age clocks; the bake is bit-identical
  across runs (asserted, not claimed).

## What was not verified — plainly

No GPU and no browser exist in this lane, so nothing here was seen rendering:
no frame rate, no appearance, no WebGPU-versus-fallback behaviour, and no
actual host mount of group D (glob discovery, gallery, detail panel, legend —
all code-read only). Host behaviours cited above (`validId`, dedupe,
defaults) are read from source, not observed. `ShaderMaterial` under
`WebGPURenderer` was deliberately not exercised, which is why D3 bakes the
trap's appearance instead of staging a live failing shader. TSL was grep-confirmed,
never executed. The single source-51 URL awaits lane D's catalogue pass.
Per-frame CPU figures are arithmetic over Node micros, not profiles.
