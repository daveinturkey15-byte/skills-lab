#!/usr/bin/env node
/**
 * plan-night.mjs — turn a capture run into overnight lane assignments.
 *
 * Assignment is data-driven rather than hand-written so that the work actually
 * sent to lanes is exactly what the evidence says is broken or missing, and so
 * re-planning after a wave costs one command instead of an editing session.
 *
 * Ownership is partitioned by SOURCE ID, because the demo files are named per
 * source: each demo file is named for the source it shows. Two lanes never
 * touch one file.
 *
 *   node plan-night.mjs --lanes 4
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const LANES = Number((argv[argv.indexOf('--lanes') + 1]) || 4);

const catalog = JSON.parse(readFileSync(join(ROOT, 'public/assets/skills-lab/source-catalog.json'), 'utf8'));
const reportPath = join(ROOT, 'qa/captures/report.json');
if (!existsSync(reportPath)) {
  console.error('No qa/captures/report.json — run `node qa/capture.mjs` first.');
  process.exit(2);
}
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

/* --------------------------------------------- what each source actually has */

const demoDir = join(ROOT, 'src/lab/demos');
const filesBySource = new Map();
for (const group of readdirSync(demoDir)) {
  for (const file of readdirSync(join(demoDir, group)).filter((f) => f.endsWith('.ts'))) {
    const body = readFileSync(join(demoDir, group, file), 'utf8');
    const hasFactory = /createDemo\s*[:(]/.test(body);
    for (const m of body.matchAll(/sourceId\s*:\s*(\d+)/g)) {
      const id = Number(m[1]);
      if (!filesBySource.has(id)) filesBySource.set(id, { files: new Set(), hasFactory: false });
      filesBySource.get(id).files.add(`src/lab/demos/${group}/${file}`);
      if (hasFactory) filesBySource.get(id).hasFactory = true;
    }
  }
}

/**
 * Recompute the tier from the raw stats rather than trusting the verdict string
 * in the report, which may have been written by an older scoring pass. Only
 * BLOCKING tiers become work; LOOSE framing is advisory and must not consume a
 * lane's budget while things are still BLANK.
 */
function tier(s) {
  const m = s.modalToneShare ?? 0;
  const e = s.edgeDensity ?? 0;
  if ((s.distinctColours ?? 0) <= 2) return 'BLANK';
  if ((s.maxLuma ?? 0) < 24) return 'BLACK';
  if (m > 0.85) return 'UNFRAMED';
  if (m > 0.60 && e < 0.04) return 'UNFRAMED';
  if (e < 0.02) return 'FLAT';
  if (m > 0.60) return 'LOOSE';
  return 'OK';
}
const BLOCKING = new Set(['BLANK', 'BLACK', 'UNFRAMED', 'FLAT']);

const tiers = new Map();
for (const r of report.results) {
  if (r.sourceId == null) continue;
  const t = tier(r);
  // A source with several demos takes its worst tier.
  const rank = ['OK', 'LOOSE', 'FLAT', 'UNFRAMED', 'BLACK', 'BLANK'];
  const prev = tiers.get(r.sourceId);
  if (!prev || rank.indexOf(t) > rank.indexOf(prev)) tiers.set(r.sourceId, t);
}
const failedIds = new Set([...tiers].filter(([, t]) => BLOCKING.has(t)).map(([id]) => id));

/* ------------------------------------------------------------- the worklist */

const work = [];
for (const source of catalog.sources) {
  const id = source.sourceId;
  const entry = filesBySource.get(id);
  const blocked = Boolean(source.blocker?.reason);

  if (failedIds.has(id)) {
    work.push({ id, kind: 'FIX', tier: tiers.get(id), title: source.title, status: source.status, blocked,
                files: [...(entry?.files ?? [])] });
  } else if (!entry?.hasFactory && !blocked && source.status !== 'alias') {
    work.push({ id, kind: 'BUILD', title: source.title, status: source.status, blocked,
                files: [...(entry?.files ?? [])] });
  }
}

// Fixes first: a broken exhibit on a published page is worse than a missing one.
work.sort((a, b) => (a.kind === b.kind ? a.id - b.id : a.kind === 'FIX' ? -1 : 1));

/* ------------------------------------------------------------- partitioning */

const lanes = Array.from({ length: LANES }, () => []);
work.forEach((item, i) => lanes[i % LANES].push(item));

const NAMES = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'];
const written = [];

lanes.forEach((items, i) => {
  if (items.length === 0) return;
  const lane = NAMES[i];
  const owned = [...new Set(items.flatMap((it) => it.files))];
  const newFiles = items.filter((it) => it.files.length === 0);

  const body = `# Lane ${lane} — overnight build and repair

**Read \`CONTEXT.md\`, then \`OVERNIGHT.md\`, then \`briefs/N-build-common.md\` in full before
touching anything.** \`OVERNIGHT.md\` is the frozen run contract: budgets, the acceptance gate,
and the rule that you may never weaken a gate to pass it. \`N-build-common.md\` explains the
capture harness you now have and how to iterate against it.

## Your assignment

${items.map((it) => `- **${it.kind} source ${it.id}**${it.tier ? ` _(captured: ${it.tier})_` : ''} — ${it.title}${it.blocked ? '  _(catalogue records a blocker — read it before assuming you can build this)_' : ''}`).join('\n')}

## Files you own

${owned.length ? owned.map((f) => `- \`${f}\``).join('\n') : '_(none existing yet)_'}
${newFiles.length ? `
You will also create new demo files for: ${newFiles.map((it) => `source ${it.id}`).join(', ')}.
Put them in \`src/lab/demos/group-d/\` following the existing naming
(\`source-NN-<short-name>.ts\`) and register them in that group's \`index.ts\`. **\`index.ts\` is
shared with other lanes — append your rows, never rewrite the file.** If you find a conflict,
re-read the file and re-apply your addition rather than overwriting.
` : ''}
**Touch nothing else.** ${LANES - 1} other build lanes are working in this same directory on
different sources right now.

## The loop

For each assigned source, in the order listed:

1. Read the catalogue entry — \`method\`, \`limitations\`, \`urls\`, \`blocker\` — in
   \`public/assets/skills-lab/source-catalog.json\`. The method is already stated in our own
   words; your job is to make it visible, not to re-research it.
2. Decide the framing first (see the failure named in \`N-build-common.md\`).
3. Build or repair.
4. \`node qa/capture.mjs --only ${items[0].id}\` (substituting each id) and read the verdict.
5. Repair the specific cause. **Three cycles maximum per source**, then move on and record it.

A source whose catalogue \`blocker\` says the artifact is unavailable or licence-blocked may be
un-buildable. That is a legitimate outcome: say so, leave the host rendering
"Missing / not delivered", and move to the next one. Do not invent a demo to fill the slot.

## Finish by

The four steps in \`N-build-common.md\`, writing your report to \`docs/lane-${lane}-report.md\`.
`;
  const path = join(ROOT, 'briefs', `${lane}-assignment.md`);
  writeFileSync(path, body);
  written.push({ lane, count: items.length, fixes: items.filter((i) => i.kind === 'FIX').length, path });
});

console.log(`worklist: ${work.length} sources (${work.filter((w) => w.kind === 'FIX').length} FIX, ${work.filter((w) => w.kind === 'BUILD').length} BUILD)`);
for (const w of written) console.log(`  ${w.lane}: ${w.count} sources (${w.fixes} fixes) → briefs/${w.lane}-assignment.md`);
console.log(`\ncapture run: ${report.drewSomething}/${report.captured} passed, adapter ${report.adapter?.vendor}/${report.adapter?.architecture}`);
