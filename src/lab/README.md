# Skills Lab host (`src/lab`)

Standalone exhibit-hall host for the Skills Lab. Owns one renderer
(`THREE.WebGPURenderer` from `three/webgpu`), one RAF loop, one
OrbitControls and a small isolated scene with host-owned helper lights. Demo
groups under `./demos/group-*/index.ts` overlay manifest entries onto the 50
public records; nothing is fabricated for absent groups.

## What this build deliberately leaves out

- **Blender gallery.** The per-lane catalogues and their GLBs were not copied
  out of the game repository and are not coming, so the tab renders the
  explicit panel "Blender gallery not included in the standalone Skills Lab —
  the models live in the game repository" instead of a spinner, an empty grid
  or a console error. The `blenderCatalogLoaders` seam still accepts injected
  loaders for CPU tests. `BUILTIN_BLENDER_ASSETS` in
  `gallery/blender-catalog.ts` is kept as data only; the host does not seed
  its gallery from it because those GLBs are absent here.
- **Result testing.** `Result tested` stays open until a machine-checked test
  receipt matches the source in this lane; visual/FPS acceptance stays with
  the owner.

## Research records

One consolidated file, `src/research/public-research.json` (schemaVersion 1):
top-level `records[]`, one row per source, all 50 sourceIds present exactly
once. Every row carries its own `sourceId` and its own `group`
(17 group-a, 17 group-b, 16 group-c); attribution follows the row's own id,
never the filename. Field names differ per group schema (`pin` vs
`canonical`, `method` vs `methodExtracted`, `decision`, `methodConsumer`,
`carrierReadComplete`, `cpuCheck`, `pixelValidation`, `renderedAcceptance`),
all absorbed by `absorbResearchRow`. Rows without a usable sourceId are
counted in the host summary (honest unknown), never guessed.

## Deep links

Lane A links in as `?view=lab#source-<id>` (legacy `?source=<id>` still
honoured). The hash stays in sync with selection; an unknown id falls back to
the default selection without throwing.

## Backend label

Read from the real renderer flags after init: `WebGPU` only when
`backend.isWebGPUBackend === true`, otherwise `WebGL fallback` (three
0.185.1 `WebGLBackend` sets `isWebGLBackend`, never `isWebGPUBackend`), else
`unknown`. The label cannot claim WebGPU on a WebGL2 fallback.

## Copy rule

Host chrome reads as the Skills Lab. Demo `sourceId`, `title`, `method`,
`adaptation`, `sources` and `limitation` are evidence and are never reworded
here.

There is no test runner in this repository; do not add `.test.ts` files.
Verify host changes with `npx tsc --noEmit`. Pixels were not verified in this
lane (no GPU, no browser).
