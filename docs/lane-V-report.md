# Lane V report — venue routing: put each technique where it is most itself

## The rule, in plain English

A source routes to `browser` when what it actually carries is a document rather
than something with geometry, light or motion. The check reads the source's own
properties — `status` and the wording of `method` — in this order, first match wins:

1. `status` is `alias`: a pointer, not a technique.
2. `method` is exactly `Not established.`: an unretrievable article or an
   unverified release claim; there is nothing spatial to stage.
3. `method` offers only targets, a rubric, or a bar (`quality targets only`,
   `comparator rubric`, `owner's judgement`, `one-line comparators`): a comparison
   with no portable method. Comparators that still name a spatial atom (weather
   states, strands, tracks) do not match and stay in the world.
4. `method` says the reusable object is an index, a hub, or a brief template
   (`reusable object is the FORMAT`, `hub of self-contained sketches`,
   `shelf index`, `one-page brief`): a catalogue or format document.
5. `method` reports an honest finding of no separable technique: the build is a
   bar the loop must clear, not a method.
6. `method` opens with `Decision split:`: a licence finding, restatable physics
   versus an out-of-bounds commercial product.
7. `method` opens with `Transferable principle`: a decision rule about keeping
   lighting parametric.
8. `method` describes a mechanical world-QA harness (`passability sweep`): a gate
   over the world, not an exhibit inside it.

Anything unmatched routes to `world` with the reason `spatial or temporal
technique`. No id list appears anywhere, so source 63 cannot fall through a stale
roster; a new catalogue entry is classified by what its method says.

## Browser-venue sources: 14 of 62

| id | title | reason |
|----|-------|--------|
| 14 | Modern Claudefare | comparison without a portable method: comparator rubric only |
| 17 | Environment-art quality bar (Cadle) | comparison without a portable method: owner's judgement bar |
| 21 | Classic ray tracing as a shipped option | alias pointer: carries no technique of its own |
| 22 | Environment-art comparators, 2026-08-24 batch | comparison without a portable method: quality targets only |
| 35 | gas-station-highway one-page brief | catalogue/format document: the reusable object is a brief template |
| 41 | The technique-demo hub | catalogue/format document: the reusable object is a sketch hub |
| 42 | The vibe-stack shelf | catalogue document: a shelf index of tools |
| 43 | Image to engine-native editable scene (Lumera) | decision principle: keep lighting parametric |
| 44 | Thin comparators, 2026-08-31 sweep | comparison without a portable method: one-line comparators |
| 46 | Physically-based FFT ocean (Three.js Water Pro) | licence decision: restatable physics versus an out-of-bounds product |
| 47 | GTA-style open-world city art | finding, not a method: the build is a bar for the loop |
| 50 | fable51-worlds world QA harness | process document: a mechanical QA harness |
| 55 | Project Aether | no retrievable body: release claim unverified |
| 59 | Graalitoo X article | no retrievable body: article not retrievable |

Deliberately still `world`: comparators whose method names a spatial atom despite
having no portable implementation — 3 (water comparator list), 51 (weather state
machine), 52 (NPC schedules), 54 (Blender truck modelling), 56 (smart-mesh
retopology), 58 (procedural human strands), 61 (LiveLink camera), 62 (Sequencer
tracks) — plus the blocked spatial techniques (24, 25, 30, 32, 36), whose rooms
stay honest stubs/launchers rather than documents.

## Overlap with room lanes, flagged not fixed

Authored rooms already exist for three browser-venue sources: 14 (claudefare),
43 (lumera) and 50 (qa-harness). Setting their `venue` does not delete that work;
it re-presents it (see below). Restaging those rooms as wall-scale artifacts is
their lanes' call, not this lane's — room files were not touched.

## The one-line change `world.ts` needs

`venue.ts` exports everything required (`venueFor`, `atlasDeepLink`, `venueCard`).
In `src/world/world.ts`, in the wall-card block after the stub line:

```ts
if (def.venue === 'browser') cardLines.push(`Authoritative in the Atlas (${atlasDeepLink(def.sourceId)}): this room presents the artifact at wall scale.`);
```

plus `import { atlasDeepLink } from './venue';` at the top. The `venue` field
itself must be set where definitions are built (`collectRooms` in `rooms.ts`, a
later lane's file): `venue: venueCard(src).venue` or equivalent. Not applied here.

## The browser door, specified not built

Each `browser` door keeps its skill plate and opens onto an honest document room:
the artifact at wall scale (the brief text, rubric, decision split, or index —
large enough to read from the doorway), the limitation on the wall, and a pointer
to the interactive version (`?view=atlas#source-<id>`, the Techniques tab). No 3D
prop standing in for the document: a comparison gets its targets as text, a
licence finding gets its decision split, a catalogue gets its entries. Suggested
budget: one wall, under 12 draw calls, same as any room.

## Checks

- `npx tsc --noEmit`: clean, no output, exit 0. (One self-caught fault during the
  lane: an edit dropped the `count` element in `renderTechniques`; the typecheck
  found it, the element was restored, the check re-ran clean.)
- `npm run build`: succeeds — `tsc --noEmit && vite build`, 171 modules, built in
  433 ms.
- Rule evaluated against the live `source-catalog.json` (62 sources): exactly the
  14 above route to `browser`; 48 to `world`.
- Built bundle check: the production `atlas-*.js` chunk contains the `Techniques`
  tab label and the `technique-` row ids.

## What was not verified

- The Techniques tab was never rendered: no browser exists in this lane, so no
  screenshot, no search typing, no expand/collapse, no 1280 px or 390 px reading
  was observed. The tab compiles and ships; it is not proven legible.
- The `room-shot.mjs` gate was not run: this lane owns no rooms and the gate
  belongs to the room lanes.
- Catalogue drift: the 14/62 count holds for today's catalogue. If the catalogue
  gains sources, re-evaluate `venueFor` over it before trusting the count.
- World wiring is specified, not applied or tested: `world.ts` and `rooms.ts`
  were deliberately left untouched.
