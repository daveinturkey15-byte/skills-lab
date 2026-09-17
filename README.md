# Skills Lab

A browsable atlas and live WebGPU exhibit hall for the game-development
techniques this workspace has studied, adapted or rejected.

- **The Atlas** (this page, the default view) indexes
  `public/assets/skills-lab/source-catalog.json`: 50 studied sources, what
  each one is, which skills it feeds, and how far up the adoption ladder it
  actually got. Four views: **Skills**, **Sources**, **Ladder**, **About**.
- **The Lab** (`?view=lab`) is a live WebGPU exhibit hall of runnable
  Three.js demos, one per studied technique, each carrying provenance
  metadata the host UI must display.

## Honesty contract

This repository does not overstate what has been done. A source with no demo
renders as absent — never a placeholder scene. A blocked source shows its
blocker reason. A `candidate` skill relation means *not verified* and is
visually distinct from `implements`. Missing fields render as unknown; content
is never invented.

## Develop

```sh
npm install
npm run dev        # Atlas at http://localhost:5183/, Lab at ?view=lab
npm run check      # tsc --noEmit, must be clean
npm run build      # typecheck + production build for GitHub Pages
npm run build:nocheck  # Vite build only, for isolating pre-existing errors
npm run verify     # catalogue integrity checks
```

The site serves from `/skills-lab/` on GitHub Pages; override with the
`SKILLS_LAB_BASE` env var when hosting elsewhere. The Atlas fetches the
catalogue relative to `import.meta.env.BASE_URL` and loads no three.js on
first paint — the Lab chunk is fetched only on `?view=lab`.

## Layout

- `index.html`, `src/main.ts` — shell and view router.
- `src/atlas/` — Atlas UI. `catalog.ts` is the frozen data layer
  (types, `loadCatalog()`, `ladderOf()`, `buildSkillGraph()`); `atlas.ts` is
  the tab host; `views/` holds the four views.
- `src/lab/` — Technique Lab host, demos and styles.
- `public/assets/skills-lab/source-catalog.json` — the 50-source catalogue.

Stack: `three` 0.185.1, Vite 8.1.3, TypeScript 6.0.3, no UI framework.
