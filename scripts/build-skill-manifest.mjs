#!/usr/bin/env node
/**
 * scripts/build-skill-manifest.mjs — publish the skill list the world reads.
 *
 * WHY THIS EXISTS.
 *
 * The world was keyed by catalogue *source*, so a skill only got a door if some
 * external post happened to map to it. Measured: 11 of the 22 game-development
 * skills had no door at all — including every skill written from this
 * workspace's own failures, which are the most valuable ones in the set. A
 * showcase that only represents techniques somebody else published is not a
 * showcase of what we know.
 *
 * So skills become first-class: every skill gets a door, whether or not an
 * external source ever pointed at it.
 *
 * Reads the canonical store, writes name + description + category only. No skill
 * bodies are copied into a public repository — the manifest says a skill exists
 * and what it is for, and that is all a door needs.
 *
 *   node scripts/build-skill-manifest.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STORE = process.env.SKILLS_STORE
  ?? 'C:/Users/david/Documents/desky-bootstrap-clone/Skills';
const OUT = join(ROOT, 'public/assets/skills-lab/skills.json');

/** Front matter, without pulling in a YAML dependency for two fields. */
function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^(\w[\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[kv[1]] = v;
  }
  return out;
}

if (!existsSync(STORE)) {
  console.error(`skill store not found: ${STORE}`);
  console.error('Set SKILLS_STORE, or accept that the world will show no skill doors.');
  process.exit(2);
}

const skills = [];
for (const category of readdirSync(STORE, { withFileTypes: true })) {
  if (!category.isDirectory()) continue;
  const catDir = join(STORE, category.name);
  for (const entry of readdirSync(catDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(catDir, entry.name, 'SKILL.md');
    if (!existsSync(file)) continue;
    const body = readFileSync(file, 'utf8');
    const fm = frontMatter(body);
    skills.push({
      name: fm.name ?? entry.name,
      dir: entry.name,
      category: category.name,
      description: (fm.description ?? '').slice(0, 400),
      // Rough, but useful on a door plate: a skill with references is a deeper
      // one, and a reader can see at a glance which are one-pagers.
      lines: body.split(/\r?\n/).length,
      references: existsSync(join(catDir, entry.name, 'references'))
        ? readdirSync(join(catDir, entry.name, 'references')).filter((f) => f.endsWith('.md')).length
        : 0,
    });
  }
}

skills.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString().slice(0, 10),
  note: 'Name, description and shape only. Skill bodies are never copied into this repository.',
  skills,
}, null, 1));

const game = skills.filter((s) => s.category === 'game-development');
console.log(`${skills.length} skills across ${new Set(skills.map((s) => s.category)).size} categories`);
console.log(`  game-development: ${game.length}`);
console.log(`  written to ${OUT.replace(ROOT, '.')}`);
