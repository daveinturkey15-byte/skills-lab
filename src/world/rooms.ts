/**
 * src/world/rooms.ts — assemble the door list.
 *
 * Three sources, in order of precedence:
 *
 *  1. Hand-authored rooms under `./rooms/`, one file per skill. This is where
 *     build lanes work, and a room here always wins.
 *  2. The existing lab demos. Each is already a `THREE.Group` with `update` and
 *     `dispose`, which is the room contract almost exactly, so they adapt for
 *     nearly free and the world has doors from day one instead of from week one.
 *  3. The catalogue, for everything with no demo at all — which becomes either
 *     an `external` room with a launcher, or an honest `stub`.
 *
 * A door that opens onto a room saying "not built yet" is worth more than no
 * door: it makes the gap walkable, which is the whole point of putting the
 * catalogue in a world rather than in a table.
 */
import type { RoomContext, RoomDefinition, RoomInstance } from './contract';
import { venueFor } from './venue';

interface DemoManifestEntry {
  sourceId: number;
  title: string;
  method?: string;
  limitation?: string;
  createDemo?: (ctx: { THREE: typeof import('three'); seed: number }) => {
    root: import('three').Group;
    update?: (t: number, dt: number) => void;
    dispose: () => void;
  };
}

interface SkillEntry {
  name: string;
  category: string;
  description: string;
  lines: number;
  references: number;
}

/**
 * Skill doors are numbered from here so they can never collide with a catalogue
 * source, and so an id in a report is instantly recognisable as a skill rather
 * than a source.
 */
const SKILL_DOOR_BASE = 900;

interface CatalogSource {
  sourceId: number;
  title: string;
  status: string;
  method?: string;
  limitations?: string[];
  blocker?: { reason?: string } | null;
  skillMappings?: Array<{ skill: string; relation: string }>;
}

/**
 * Techniques that genuinely do not run in a browser. Each gets a real door and
 * a launcher rather than being quietly dropped, because "we can't show that
 * here" is information and silence is not.
 */
const EXTERNAL: Record<number, { label: string; script: string; note: string }> = {
  61: {
    label: 'Open the UE5 game-recording import notes',
    script: 'scripts/launchers/ue5-game-recording.cmd',
    note: 'Unreal Engine 5 plus a C2M-class extractor, on this machine only. Nothing is fetched or installed by the launcher; it opens the prepared notes and checks whether the prerequisites are present.',
  },
  62: {
    label: 'Open the UE5 game-recording import notes',
    script: 'scripts/launchers/ue5-game-recording.cmd',
    note: 'Same pipeline as the neighbouring door. Extracted commercial game assets are private-use only and are never redistributed.',
  },
  45: {
    label: 'Open the ComfyUI Trellis image-to-3D lane',
    script: 'scripts/launchers/comfyui-trellis.cmd',
    note: 'ComfyUI 0.35.0 on this machine already ships the built-in Trellis.2 nodes; only the checkpoint is missing. The launcher reports what is present rather than downloading anything.',
  },
  36: {
    label: 'Open the Blender remesh and bake lane',
    script: 'scripts/launchers/blender-remesh-bake.cmd',
    note: 'Blender 5.1 with Rigify, local. The in-browser room beside this one shows the resulting LODs; this launcher is how they were produced.',
  },
};

function slugSkill(source: CatalogSource | undefined): string {
  const mapped = source?.skillMappings?.find((m) => m.relation === 'implements')
    ?? source?.skillMappings?.find((m) => m.relation === 'informs')
    ?? source?.skillMappings?.[0];
  return mapped?.skill ?? 'unmapped';
}

function firstSentence(text: string | undefined, fallback: string): string {
  if (!text) return fallback;
  const cut = text.replace(/\s+/g, ' ').trim();
  const stop = cut.search(/\.\s/);
  const out = stop > 20 ? cut.slice(0, stop + 1) : cut;
  return out.length > 180 ? `${out.slice(0, 177)}…` : out;
}

export async function collectRooms(baseUrl: string): Promise<RoomDefinition[]> {
  /* ---------------------------------------------------------- catalogue */
  let sources: CatalogSource[] = [];
  try {
    const res = await fetch(`${baseUrl}assets/skills-lab/source-catalog.json`, { cache: 'no-store' });
    if (res.ok) sources = ((await res.json()) as { sources: CatalogSource[] }).sources ?? [];
  } catch { /* the world still builds from demos alone */ }
  const byId = new Map(sources.map((s) => [s.sourceId, s]));

  const rooms = new Map<number, RoomDefinition>();

  /* ------------------------------------------------- 2. existing demos */
  const groupLoaders = import.meta.glob<{ manifest?: DemoManifestEntry[] }>('../lab/demos/group-*/index.ts');
  for (const load of Object.values(groupLoaders)) {
    let mod: { manifest?: DemoManifestEntry[] };
    try {
      mod = await load();
    } catch (error) {
      console.error('demo group failed to load:', error);
      continue;
    }
    for (const entry of mod.manifest ?? []) {
      if (!entry?.createDemo || rooms.has(entry.sourceId)) continue;
      const src = byId.get(entry.sourceId);
      const make = entry.createDemo;
      rooms.set(entry.sourceId, {
        sourceId: entry.sourceId,
        skill: slugSkill(src),
        title: entry.title,
        summary: firstSentence(entry.method ?? src?.method, entry.title),
        kind: 'webgpu',
        limitation: entry.limitation ?? src?.limitations?.[0],
        create: (ctx: RoomContext): RoomInstance => {
          const demo = make({ THREE: ctx.THREE, seed: ctx.seed });
          return {
            root: demo.root,
            update: demo.update ? (t, dt) => demo.update!(t, dt) : undefined,
            dispose: () => demo.dispose(),
          };
        },
      });
    }
  }

  /* ------------------------- 1. hand-authored rooms override the above */
  const authored = import.meta.glob<{ room?: RoomDefinition }>('./rooms/*.ts');
  for (const load of Object.values(authored)) {
    try {
      const mod = await load();
      if (mod.room?.sourceId != null) rooms.set(mod.room.sourceId, mod.room);
    } catch (error) {
      console.error('authored room failed to load:', error);
    }
  }

  /* ------------------------------ 3. catalogue entries with no demo yet */
  for (const src of sources) {
    if (rooms.has(src.sourceId) || src.status === 'alias') continue;
    const ext = EXTERNAL[src.sourceId];
    rooms.set(src.sourceId, {
      sourceId: src.sourceId,
      skill: slugSkill(src),
      title: src.title.length > 46 ? `${src.title.slice(0, 44)}…` : src.title,
      summary: firstSentence(src.method, 'No method has been extracted from this source yet.'),
      kind: ext ? 'external' : 'stub',
      launcher: ext,
      limitation: src.blocker?.reason ?? src.limitations?.[0],
    });
  }

  /* ------------------ 4. skills with no source of their own ------------- */
  //
  // The world was keyed by catalogue source, so a skill only got a door if some
  // external post happened to map to it. Measured: 11 of 22 game-development
  // skills had none - including every skill written from this workspace's own
  // failures, which are the most valuable ones we have. A showcase that only
  // represents what other people published is not a showcase of what we know.
  try {
    const res = await fetch(`${baseUrl}assets/skills-lab/skills.json`, { cache: 'no-store' });
    if (res.ok) {
      const { skills = [] } = (await res.json()) as { skills: SkillEntry[] };
      const covered = new Set<string>();
      for (const s of sources) for (const m of s.skillMappings ?? []) covered.add(m.skill);

      let n = 0;
      for (const skill of skills) {
        if (skill.category !== 'game-development' || covered.has(skill.name)) continue;
        const id = SKILL_DOOR_BASE + n;
        n += 1;
        if (rooms.has(id)) continue;
        rooms.set(id, {
          sourceId: id,
          skill: skill.name,
          title: skill.name.replace(/-/g, ' '),
          summary: skill.description || `The ${skill.name} skill.`,
          kind: 'stub',
          venue: 'world',
          limitation:
            `Skill door: ${skill.lines} lines, ${skill.references} reference file(s). `
            + 'No external source maps to this one - it was written from our own work, '
            + 'so there is no third-party demo to adapt and the room must be built.',
        });
      }
    }
  } catch { /* no manifest: the world is still the catalogue's, just smaller */ }

  // Venue is decided in one place from the catalogue, not per room: a hand
  // authored file cannot then forget to set it and silently become a world
  // room when what it holds is a document.
  for (const room of rooms.values()) {
    const src = byId.get(room.sourceId);
    // A skill door has no catalogue row; it keeps the venue it was given.
    if (src) room.venue = venueFor(src).venue;
  }

  // Stable order so a door does not move between visits.
  return [...rooms.values()].sort((a, b) => a.sourceId - b.sourceId);
}
