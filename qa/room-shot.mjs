#!/usr/bin/env node
/**
 * qa/room-shot.mjs — stand in a room and photograph what a visitor would see.
 *
 * This is the gate for the walkable world, and it replaces the flat-stage gate
 * entirely. Framing is no longer the author's job — the player's camera does the
 * framing — so the question changed from "does the subject fill a fixed frame"
 * to "walk in and look: is the technique actually there, at the right size, in
 * a room you can read".
 *
 * Two viewpoints per room, because one is not enough to catch the two failures
 * that matter here: a subject scaled for a small stage looks fine from close up
 * and disappears from the doorway, and a room that leaks into its neighbour is
 * only visible from the doorway.
 *
 *   node qa/room-shot.mjs --base http://localhost:5199/skills-lab/ --source 3
 *   node qa/room-shot.mjs --base ... --all
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { launchChrome, killTree } from './chrome-lifecycle.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const require_ = createRequire(import.meta.url);
const { chromium } = await import('playwright-core');
const { PNG } = require_('pngjs');

const argv = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const BASE = (arg('base') ?? 'http://localhost:5199/skills-lab/').replace(/\/?$/, '/');
const ONLY = arg('source');
const OUT = arg('out') ?? join(ROOT, 'qa', 'rooms');
const ALL = argv.includes('--all');
mkdirSync(OUT, { recursive: true });

async function freePort() {
  const { createServer } = await import('node:net');
  return new Promise((res) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
  });
}
const PORT = await freePort();
const RUN = `${process.pid}-${Date.now().toString(36)}`;

const chromePid = launchChrome({
  port: PORT,
  profile: join(OUT, `.profile-${RUN}`),
});

let browser;
for (let i = 0; i < 60; i += 1) {
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`, { timeout: 2000 }); break; }
  catch { await new Promise((r) => setTimeout(r, 500)); }
}
if (!browser) { console.error('Chrome CDP never came up'); process.exit(3); }

const page = await (browser.contexts()[0] ?? await browser.newContext()).newPage();
page.setDefaultTimeout(120000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

await page.goto(`${BASE}?view=world`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction('!!window.__worldRooms', null, { timeout: 120000 });
await page.waitForTimeout(3000);

const adapter = await page.evaluate(`(async () => {
  const a = navigator.gpu ? await navigator.gpu.requestAdapter().catch(() => null) : null;
  return { adapter: !!a, vendor: a?.info?.vendor ?? null };
})()`);
if (!adapter.adapter) {
  console.error('NO WEBGPU ADAPTER — refusing to judge a room from a fallback backend.');
  await browser.close().catch(() => {}); killTree(chromePid);
  process.exit(3);
}

const rooms = await page.evaluate('window.__worldRooms');
const wanted = ALL ? rooms : rooms.filter((r) => String(r.sourceId) === String(ONLY));
if (wanted.length === 0) { console.error(`no room for source ${ONLY}`); process.exit(2); }
console.log(`adapter ${adapter.vendor} · ${wanted.length} room(s)\n`);

/**
 * Coverage, colour and detail in one pass.
 *
 * Coverage alone cannot tell a good room from a bad one, and I have the pair
 * that proves it: source 48 (a lit interior with dust, grime and a lit/unlit
 * split) and source 51 (a pale water plane under a black sky, no cloud, no rain)
 * both passed a coverage-only gate. What separates them is that 48 has colour
 * variety and fine detail and 51 has neither.
 */
function frameStats(png) {
  const { width, height, data } = png;
  const hist = new Map();
  const hues = new Set();
  let n = 0;
  let edges = 0;
  const luma = (x, y) => {
    const i = (y * width + x) * 4;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  };
  for (let y = 3; y < height - 3; y += 3) {
    for (let x = 3; x < width - 3; x += 3) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      hist.set(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4), (hist.get(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)) ?? 0) + 1);
      n += 1;
      if (Math.abs(luma(x + 3, y) - luma(x - 3, y)) + Math.abs(luma(x, y + 3) - luma(x, y - 3)) > 12) edges += 1;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn > 18) {
        let h = 0;
        if (mx === r) h = ((g - b) / (mx - mn)) % 6;
        else if (mx === g) h = (b - r) / (mx - mn) + 2;
        else h = (r - g) / (mx - mn) + 4;
        hues.add(Math.round(((h * 60) + 360) % 360 / 20));
      }
    }
  }
  const top = [...hist.values()].sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0);
  return {
    coverage: Number(((n - top) / n).toFixed(3)),
    detail: Number((edges / n).toFixed(3)),
    hues: hues.size,
  };
}

/** Fraction of sampled pixels that changed between two frames of the same view. */
function motionBetween(a, b) {
  const { width, height, data: d1 } = a;
  const d2 = b.data;
  let moved = 0;
  let n = 0;
  for (let y = 3; y < height - 3; y += 4) {
    for (let x = 3; x < width - 3; x += 4) {
      const i = (y * width + x) * 4;
      if (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]) > 14) moved += 1;
      n += 1;
    }
  }
  return Number((moved / n).toFixed(3));
}


/**
 * THE RATCHET.
 *
 * A fixed threshold stops driving improvement the moment everything clears it,
 * and the owner's instruction was explicitly that things must keep improving
 * rather than be "integrated basically". So the target is stored beside the
 * report and steps up whenever the world's median quality overtakes it.
 *
 * It only ever rises, and it rises from measured median quality rather than
 * from a number I chose — a gate I could lower is not a gate. Raising a bar is
 * the opposite of the forbidden move, which is loosening one to obtain a pass.
 */
const TARGET_FILE = join(OUT, 'target.json');
const TARGET_FLOOR = 0.35;
const TARGET_STEP = 0.03;

function readTarget() {
  try { return Number(JSON.parse(readFileSync(TARGET_FILE, 'utf8')).target) || TARGET_FLOOR; }
  catch { return TARGET_FLOOR; }
}
const TARGET = readTarget();

const results = [];
for (const r of wanted) {
  const shot = async (name, x, z) => {
    await page.evaluate(`window.__worldTeleport(${x}, ${z}, ${r.facing})`);
    await page.waitForTimeout(1600);
    const buf = await page.locator('canvas').first().screenshot();
    writeFileSync(join(OUT, `${r.sourceId}-${name}.png`), buf);
    return PNG.sync.read(buf);
  };

  const door = await shot('doorway', r.spawn.x, r.spawn.z);
  // Second frame from the same spot, a beat later. A room whose update() does
  // nothing is a photograph, and a photograph of a technique is not a
  // demonstration of it.
  await page.waitForTimeout(1300);
  const doorAgain = PNG.sync.read(await page.locator('canvas').first().screenshot());
  const inside = await shot('inside', r.room.x, r.room.z);

  const d = frameStats(door);
  const i = frameStats(inside);
  const motion = motionBetween(door, doorAgain);

  /**
   * One score, so the loop has something to raise rather than a threshold to
   * scrape past. Coverage dominates because a subject you cannot see fails
   * regardless; detail and colour separate a real exhibit from a flat plane;
   * motion is capped because not every technique should move — a shape grammar
   * is legitimately still, and should not be punished for it.
   */
  const quality = Number((
    Math.min(d.coverage, 0.6) / 0.6 * 0.45
    + Math.min(d.detail, 0.14) / 0.14 * 0.25
    + Math.min(d.hues, 7) / 7 * 0.15
    + Math.min(motion, 0.10) / 0.10 * 0.15
  ).toFixed(3));

  const verdict = d.coverage < 0.06 ? 'EMPTY FROM THE DOOR — subject is not readable on entry'
    : d.coverage < 0.12 ? 'THIN — subject is there but too small to read'
      : quality < TARGET ? `BELOW BAR — quality ${quality.toFixed(2)} under the ${TARGET.toFixed(2)} target`
        : 'PRESENT';

  results.push({
    ...r,
    doorway: d.coverage, inside: i.coverage,
    detail: d.detail, hues: d.hues, motion, quality, target: TARGET,
    verdict,
  });
  const mark = verdict === 'PRESENT' ? ' ok ' : verdict.startsWith('BELOW') ? 'bar ' : 'FAIL';
  console.log(`[${mark}] ${String(r.sourceId).padStart(2)} ${r.title.slice(0, 40).padEnd(40)} q=${quality.toFixed(2)} cov=${(d.coverage * 100).toFixed(0)}% det=${(d.detail * 100).toFixed(0)}% hue=${d.hues} mot=${(motion * 100).toFixed(0)}%`);
}

writeFileSync(join(OUT, ONLY ? `report-${ONLY}.json` : 'report.json'),
  JSON.stringify({
    capturedAt: new Date().toISOString(), adapter, base: BASE, target: TARGET,
    results, errors: [...new Set(errors)],
  }, null, 1));

const ok = results.filter((x) => x.verdict === 'PRESENT').length;
const med = results.length
  ? [...results].map((x) => x.quality).sort((a, b) => a - b)[Math.floor(results.length / 2)]
  : 0;
console.log(`\n${ok}/${results.length} rooms at or above the ${TARGET.toFixed(2)} quality target. Median quality ${med.toFixed(2)}.`);
console.log('Quality is coverage, detail, colour variety and motion. It is a floor, not a judgement:');
console.log('a room can clear it and still be wrong, which is why every frame is published.');
if (errors.length) console.log(`console errors: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);

if (ALL && med > TARGET) {
  const next = Number(Math.min(med, TARGET + TARGET_STEP).toFixed(3));
  writeFileSync(TARGET_FILE, JSON.stringify({ target: next, raisedFrom: TARGET, median: med, at: new Date().toISOString() }, null, 1));
  console.log(`target raised ${TARGET.toFixed(2)} -> ${next.toFixed(2)} (median beat it).`);
}

await browser.close().catch(() => {});
killTree(chromePid);
process.exit(ok === results.length ? 0 : 1);

