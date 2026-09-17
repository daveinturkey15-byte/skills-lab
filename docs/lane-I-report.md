# Lane I report — one source carrying several demos

Lane I, 2026-09-17. The host keyed demos by `sourceId` alone and capped ids at 50,
so the four group-D demos sharing source 51 could mount at most one. Both defects
are fixed in the host; no demo metadata was reworded and no honesty guard was
weakened.

## Files changed (bytes on disk at write time)

- `src/lab/runtime.ts` — 104008 bytes.
- `src/lab/types.ts` — 6055 bytes.
- `src/lab/lab.css` — 14558 bytes.
- `docs/lane-I-report.md` — this file (size measured after writing; see repo).

No other file was created or edited. In particular `src/lab/demos/**`,
`src/lab/gallery/**`, `src/lab/manifest.ts`, `src/atlas/**`, `public/**`,
`index.html`, `vite.config.ts`, `scripts/**` and `.github/**` were only read.

## Identity and grouping

- A demo's identity is now `sourceId` + slug. The slug derives deterministically
  from the demo title: lowercase, NFKD with diacritics stripped, every
  non-alphanumeric run collapsed to one hyphen, edge hyphens trimmed, empty
  result becoming `demo`. Collisions within one source gain `-2`, `-3` in
  manifest order (`slugifyDemoTitle` / `uniqueDemoSlug` in `src/lab/types.ts`).
  The four group-D titles yield four distinct URL-safe slugs (verified below).
- `ResolvedRecord` holds `variants: DemoVariant[]` (`slug`, `entry`, `group`).
  Provenance (method, adaptation, limitation, sources, comparison, demo group)
  stays per variant and is never hoisted: the detail panel renders the selected
  variant's block, and the comparison legend reads the selected variant only.
- A `sourceId` with no public row gains a synthetic record titled from its first
  demo, flagged with a notice (`No public record … catalogue row needed`), with
  group URLs as the union of variant URLs. Nothing is invented as public.
- Duplicate detection is now by exact title within a source, not by sourceId:
  a repeated title is kept-first with an error, while distinct titles sharing a
  source all mount.
- Gallery: sources with more than one demo render a group header (number, group
  title, `N demos`, aggregate badge, evidence date) plus one button per demo
  (demo title, per-variant badge). Zero/one-variant rows render exactly one
  button as before, so the existing 50 rows are visually unchanged. The detail
  panel shows `demo X of N` plus a variant picker when grouped.
- Badges: flat rows keep the old semantics including alerts. Group headers show
  `error` when the source has alerts, `blocked` only when every variant is
  blocked, `loaded` when any variant has a factory. Variant buttons show entry
  state only, so one failing demo does not redden its siblings; the failing
  variant is named (`Source N/slug`) in the problem list.
- Count line now reads `Showing X of Y demos across Z sources`, counting
  selectable demos rather than source rows.
- `validId` is now a syntactic check (positive integer, no ceiling). Whether an
  id selects anything is decided by the loaded records. The same `> 50` ceiling
  in `absorbResearchRow` was removed as the identical pattern; research rows for
  51+ now absorb instead of counting as unkeyed. The catalogue on disk already
  has 62 sources.
- Teardown is unchanged in behaviour (every selection change removes the old
  root and disposes it); messages are now keyed (`Source N/slug`), so switches
  between two demos of one source dispose exactly as cross-source switches.
- UI copy no longer hard-codes 50 (`Gallery`, `Numbered public sources`, dynamic
  empty-groups notice).

## Deep links

- `#source-<N>` still works and selects the first demo of that source.
- `#source-<N>/<slug>` addresses a specific demo. The hash stays in sync: for
  multi-demo sources the host writes the slugged form on every selection
  (including the first, so the visible demo is explicit); single-demo and
  pending rows keep the short form. Legacy `?source=<N>` still selects first.
- An unknown slug falls back to the first demo of that source, never throws.
  An unknown id is ignored (startup falls back to the first record).
- After group discovery the host re-reads the URL, so a deep link to a
  demo-only id (e.g. 51, absent from the initial public rows) resolves once the
  demo that declares it has loaded.

## Verification log (exact)

- `npx tsc --noEmit` from the repo root: no output, exit 0.
- `node scripts/verify-catalog.mjs` from the repo root, exact output:

  ```text
  catalogue: 62 sources, updated 2026-09-17 (wave 3)
  status: implemented=22 comparator=16 blocked=9 method-extracted=13 alias=1 archive=1
  demo files declare 51 distinct source ids
  note: source 36: demo.entrypoint is not a module path — "source-assets: docs/technique-lab/group-c/blender/source-36-remesh.blend"

  PASS — no source claims more than the repository can show.
  ```

  No catalogue edit was made; source 51 is present in the catalogue (lane D's
  extension to 62 is on disk), so there was nothing to work around.
- Slug smoke test against the compiled repo code (`types.ts` compiled to
  `/tmp`, outside the repo, deleted with it): the four group-D titles produce
  `anvil-cumulonimbus-cpu-baked-raymarch-with-light-march-and-hg-rim`,
  `cloud-shadows-that-agree-with-the-cloud-deck-sun-coverage`,
  `lift-gamma-gain-saturation-contrast-and-the-missing-output-conversion`,
  `one-storminess-value-driving-sun-cloud-rain-sea-and-exposure` — four
  distinct `[a-z0-9-]` slugs — and `Hello, World!` sanitises to `hello-world`.

## What was not verified — plainly

No browser and no GPU exist in this lane, so nothing was seen rendering: no
gallery grouping appearance, no selection behaviour by click, no deep-link
navigation, no stage pixels, no frame rate, no WebGPU-versus-fallback label,
and no actual mount of group D (glob discovery, gallery, detail, legend are
code-read plus typecheck only). The 1280px/390px readability of the new group
CSS was not observed. `vite build` was not run; verification is `tsc` plus the
catalogue gate plus the slug harness above, per the brief. `src/lab/README.md`
still documents only `#source-<id>` deep links; it is not owned by this lane
and was left untouched.
