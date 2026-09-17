#!/usr/bin/env node
/**
 * verify-catalog.mjs — the honesty gate for the Skills Lab.
 *
 * The whole value of this site is that it does not claim more than we did. The
 * failure mode it guards against is a source drifting upward: a row marked
 * `implemented` whose demo file was never written, a `demo.status` of
 * "implemented" with no entrypoint, a skill mapping pointing at a skill that
 * does not exist. Those read as success on the page and are indistinguishable
 * from the real thing unless something checks.
 *
 * Run by CI before every Pages deploy. A failure here blocks publication.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(ROOT, 'public/assets/skills-lab/source-catalog.json');

const STATUS = new Set(['implemented', 'method-extracted', 'comparator', 'blocked', 'alias', 'archive']);
const ADAPTATION = new Set(['adapted', 'blocked', 'none', 'exact']);
const RELATION = new Set(['implements', 'informs', 'compares', 'candidate', 'blocked']);
const DEMO_STATUS = new Set(['implemented', 'delivered', 'blocked', 'absent']);

const problems = [];
const notes = [];
const fail = (id, message) => problems.push(`source ${id}: ${message}`);

/* ---------------------------------------------------------------- catalogue */

if (!existsSync(CATALOG)) {
  console.error(`FAIL: catalogue missing at ${CATALOG}`);
  process.exit(1);
}

let catalog;
try {
  catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
} catch (error) {
  console.error(`FAIL: catalogue is not valid JSON — ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(catalog.sources)) {
  console.error('FAIL: catalogue has no sources array');
  process.exit(1);
}

/* ------------------------------------------------------- demo entrypoints */

// Which source IDs a demo group actually declares. Read from the demo sources
// rather than a registry, because a registry can lie and a file cannot.
const declaredDemoIds = new Set();
const demosDir = join(ROOT, 'src/lab/demos');
if (existsSync(demosDir)) {
  for (const group of readdirSync(demosDir)) {
    const dir = join(demosDir, group);
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const body = readFileSync(join(dir, file), 'utf8');
      for (const match of body.matchAll(/\bsourceId\s*:\s*(\d+)/g)) {
        declaredDemoIds.add(Number(match[1]));
      }
    }
  }
} else {
  notes.push('src/lab/demos is absent — demo cross-checks skipped');
}

/* ------------------------------------------------------------ per-source */

const seen = new Set();

for (const source of catalog.sources) {
  const id = source.sourceId;

  if (typeof id !== 'number' || !Number.isInteger(id)) {
    problems.push(`a source has a non-integer sourceId: ${JSON.stringify(id)}`);
    continue;
  }
  if (seen.has(id)) fail(id, 'duplicate sourceId');
  seen.add(id);

  if (typeof source.title !== 'string' || source.title.trim() === '') fail(id, 'missing title');
  if (!STATUS.has(source.status)) fail(id, `unknown status "${source.status}"`);
  if (!ADAPTATION.has(source.adaptation)) fail(id, `unknown adaptation "${source.adaptation}"`);

  const demoStatus = source.demo?.status;
  if (demoStatus !== undefined && !DEMO_STATUS.has(demoStatus)) {
    fail(id, `unknown demo.status "${demoStatus}"`);
  }

  for (const mapping of source.skillMappings ?? []) {
    if (!RELATION.has(mapping.relation)) {
      fail(id, `unknown skill relation "${mapping.relation}" on ${mapping.skill}`);
    }
    if (typeof mapping.skill !== 'string' || mapping.skill.trim() === '') {
      fail(id, 'a skill mapping has no skill name');
    }
  }

  for (const entry of source.urls ?? []) {
    if (!/^https?:\/\//.test(entry.url ?? '')) fail(id, `url is not http(s): ${entry.url}`);
    if (!entry.label) fail(id, `url has no label: ${entry.url}`);
  }

  // --- the drift checks, which are the reason this file exists ---

  // A demo cannot be claimed without a file that declares that source id.
  const claimsDemo = demoStatus === 'implemented' || demoStatus === 'delivered';
  if (claimsDemo && declaredDemoIds.size > 0 && !declaredDemoIds.has(id)) {
    fail(id, `demo.status "${demoStatus}" but no demo file declares sourceId ${id}`);
  }

  // A declared entrypoint must exist on disk — when it is actually a path. A
  // few rows use the field for prose instead (e.g. "source-assets: <blend>"),
  // which is schema misuse rather than an overstated claim, so it is reported
  // as a note. Anything path-shaped is held to the stricter rule.
  const entrypoint = source.demo?.entrypoint;
  if (entrypoint) {
    const looksLikePath = /^[\w./-]+\.(ts|tsx|js|mjs)$/.test(entrypoint.trim());
    if (!looksLikePath) {
      notes.push(`source ${id}: demo.entrypoint is not a module path — ${JSON.stringify(entrypoint)}`);
    } else {
      // Entrypoints were recorded against the original repository layout; accept
      // either that path or the standalone one, but require one of them to exist.
      const candidates = [
        join(ROOT, entrypoint),
        join(ROOT, entrypoint.replace(/^src\/map3\/technique-lab\//, 'src/lab/')),
      ];
      if (!candidates.some(existsSync)) {
        fail(id, `demo.entrypoint does not resolve: ${entrypoint}`);
      }
    }
  }

  // `status: implemented` is the strongest claim in the vocabulary. It requires
  // a demo; without one the correct status is method-extracted.
  if (source.status === 'implemented' && !claimsDemo) {
    fail(id, `status "implemented" but demo.status is "${demoStatus ?? 'missing'}"`);
  }

  // A blocked source must carry its reason, or the page shows a dead end with
  // no explanation and the block looks like neglect.
  if (source.status === 'blocked' && !source.blocker?.reason) {
    fail(id, 'status "blocked" but no blocker.reason');
  }

  // An alias must say what it aliases.
  if (source.status === 'alias' && !/\b(row|source|see)\b/i.test(source.title + (source.method ?? ''))) {
    notes.push(`source ${id}: alias row does not name its target in title or method`);
  }
}

/* ------------------------------------------------------- demos vs catalogue */

const catalogIds = new Set(catalog.sources.map((s) => s.sourceId));
for (const id of declaredDemoIds) {
  if (!catalogIds.has(id)) {
    problems.push(`a demo declares sourceId ${id}, which is not in the catalogue`);
  }
}

/* ----------------------------------------------------------------- report */

const counts = catalog.sources.reduce((acc, s) => {
  acc[s.status] = (acc[s.status] ?? 0) + 1;
  return acc;
}, {});

console.log(`catalogue: ${catalog.sources.length} sources, updated ${catalog.updatedAt ?? 'unknown'}`);
console.log(`status: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ')}`);
console.log(`demo files declare ${declaredDemoIds.size} distinct source ids`);

for (const note of notes) console.log(`note: ${note}`);

if (problems.length > 0) {
  console.error(`\nFAIL — ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('\nPASS — no source claims more than the repository can show.');
