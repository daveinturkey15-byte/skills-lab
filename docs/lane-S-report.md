# Lane S report — evidence and gaps in the Atlas (2026-09-17)

## Provenance of this report

The six files below already existed in the working tree when this session
started (written ~6 minutes earlier, untracked, byte-identical to the sizes
listed). This session reviewed every owned line against the brief, changed
nothing, and re-ran the full finish gate itself. All verification claims
below are from this session's own runs, not carried over.

## Files owned (created or edited by this lane; no other files touched)

| File | Bytes | Change |
|---|---|---|
| `src/atlas/capture.ts` | 3549 | new — loaders for `captures/report.json` and `gaps.json`, both 404-tolerant, both honouring `BASE_URL` |
| `src/atlas/views/evidence.ts` | 4789 | new — capture gallery |
| `src/atlas/views/gaps.ts` | 6943 | new — gap inventory |
| `src/atlas/atlas.ts` | 7520 total | edited — two tab registrations, two render branches, arrow-key order only; no existing view touched (diff reviewed: +12/−2 lines, all tab wiring) |
| `src/atlas/atlas.css` | 18410 total | edited — 158 added lines, 0 deleted: appended Evidence/Gaps section plus one 900px media block; no existing rule touched |
| `package.json` | 1184 total | edited — added `qa:publish` script only (diff reviewed: one line) |
| `docs/lane-S-report.md` | this file | new — this report |

`src/atlas/catalog.ts`, the four existing views, `src/lab/`,
`qa/capture.mjs`, `public/assets/skills-lab/source-catalog.json`,
`scripts/` and `.github/` were not touched. No git command beyond
read-only `status`/`log`/`diff` was run. The PNGs under
`public/assets/skills-lab/captures/` are untracked working-tree files for
the orchestrator to commit, not a commit by this lane.

## Behaviour when a data file is missing

- **Evidence, `captures/report.json` absent** (fresh clone, no capture run,
  or `qa:publish` never run): the view renders "No capture run has been
  published." plus the recovery command (`node qa/capture.mjs`, then
  `npm run qa:publish`, then rebuild). No empty grid is ever rendered.
- **Gaps, `gaps.json` absent** (current state — confirmed absent from
  `public/assets/skills-lab/` this session): the view renders "No gap
  analysis has been published yet." plus an honest note that the file is a
  hand-written analysis product with no generator command. This wording is
  deliberate: `scripts/` contains only `verify-catalog.mjs` and
  `package.json` has no `gaps:*` script, so naming a command would invent
  one. The brief's "command that generates it" assumes a generator that
  does not exist; the honesty contract (never invent content) outranks it.
- **Either file malformed** (valid fetch, wrong shape): a plain error box
  naming the file and the failure, never a blank panel.

## Finish gate (this session's own runs)

1. `npx tsc --noEmit` — clean, no output.
2. `npm run build` — succeeds: `vite v8.1.3`, 96 modules transformed.
   Atlas chunk `atlas-CPOPxZN4.js` 27.79 kB (gzip 8.80 kB),
   `atlas-xXlV5VHw.css` 14.02 kB. Built in 335ms.
3. `node scripts/verify-catalog.mjs` — PASS:
   `catalogue: 62 sources, updated 2026-09-17 (wave 3)`,
   `status: implemented=22 comparator=16 blocked=9 method-extracted=13 alias=1 archive=1`,
   `demo files declare 51 distinct source ids`, one pre-existing note on
   source 36 (demo entrypoint is a `.blend` path, not a module — not this
   lane's file), `PASS — no source claims more than the repository can
   show.`
4. `npm run qa:publish` — publishes 59 files (report.json + 58 PNGs) into
   `public/assets/skills-lab/captures/`. Four of the PNGs are stale `51-*`
   duplicates of the current captures from an earlier harness run:
   unreferenced by report.json, harmless, left alone (deleting another
   lane's harness output is not this lane's call).

## Shape check (this session)

The published `report.json` matches the loader: 54 results,
`capturedAt` 2026-09-17T18:25:59, adapter nvidia/blackwell, headless true,
`drewSomething` 5. Verdict split: 5 `DREW SOMETHING`, 46 `UNFRAMED`,
2 `FLAT`, 1 `BLANK`. Only the exact string `DREW SOMETHING` counts as
passing; suffixed verdicts render verbatim with fail styling. Rows without
framing numbers render as "unknown" by construction.

## What was verified versus what was not

Verified: `tsc`, `vite build`, `verify-catalog`, `qa:publish`
present-branch (59 files copied), `report.json` shape against the loader,
atlas.css diff purely additive, owned files free of American spellings,
and every brief requirement traced to a line (provenance block, passing
sentence, verbatim verdicts, lazy images, `BASE_URL` on all fetches and
image `src`, kind/severity filters, always-visible evidence strings,
`#source-<id>` / `#skill-<name>` cross-links).

NOT verified — this lane has no browser, and the brief forbids claiming
renders:

- Neither the Evidence nor the Gaps view has been seen rendered. The
  populated Gaps branch has never executed against a real `gaps.json` at
  all (the file does not exist yet); its grouping, severity ordering and
  filters are type-checked logic only.
- The `qa:publish` absent-branch (no `qa/captures/report.json`) was not
  executed, only inspected — the guard is a plain `existsSync` with
  `exit 0`.
- Cross-link clicks from the new views, arrow-key travel across six tabs,
  `:focus-visible` outlines, `loading="lazy"` behaviour, and layout at
  1280 / 900 / 390 px are all unexercised.

## What a human should check

1. Serve `dist/` (or dev) and open the Atlas: Evidence and Gaps tabs appear
   between Ladder and About.
2. Evidence: provenance block shows `2026-09-17T18:25:59`, nvidia /
   blackwell, headless true; the passing-verdict sentence is on the page;
   exactly 5 cards read `DREW SOMETHING` and the rest are
   vermillion-bordered with verbatim verdicts; images lazy-load.
3. Gaps today: the missing-file message reads correctly. Once `gaps.json`
   lands, re-check: groups ordered high→low, kind/severity selects filter,
   every gap shows its evidence string without opening anything,
   source/skill links jump views.
4. Temporarily rename the published `report.json` and confirm the missing
   message (then restore and rebuild) — the cheapest way to cover the
   branch this lane could not execute.
5. Narrow to 390 px: evidence grid single-column, provenance definition
   list stacks, no horizontal scroll.
