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
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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

const child = spawn(process.env.QA_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(OUT, `.profile-${RUN}`)}`,
  '--no-first-run', '--no-default-browser-check',
  '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--enable-gpu',
  '--headless=new', '--window-size=1600,900', 'about:blank',
], { detached: true, stdio: 'ignore', windowsHide: true });
child.unref();

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
  await browser.close().catch(() => {}); try { process.kill(child.pid); } catch {}
  process.exit(3);
}

const rooms = await page.evaluate('window.__worldRooms');
const wanted = ALL ? rooms : rooms.filter((r) => String(r.sourceId) === String(ONLY));
if (wanted.length === 0) { console.error(`no room for source ${ONLY}`); process.exit(2); }
console.log(`adapter ${adapter.vendor} · ${wanted.length} room(s)\n`);

/** Coverage of the frame by anything that is not wall, floor or ceiling. */
function subjectShare(png) {
  const { width, height, data } = png;
  const hist = new Map();
  let n = 0;
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      hist.set(k, (hist.get(k) ?? 0) + 1);
      n += 1;
    }
  }
  // The shell is a handful of flat greys; whatever is not in the top three
  // buckets is, near enough, the thing the room is for.
  const top = [...hist.values()].sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0);
  return Number(((n - top) / n).toFixed(3));
}

const results = [];
for (const r of wanted) {
  const shots = {};
  for (const [name, x, z] of [
    ['doorway', r.spawn.x, r.spawn.z],
    ['inside', r.room.x, r.room.z],
  ]) {
    await page.evaluate(`window.__worldTeleport(${x}, ${z}, ${r.facing})`);
    await page.waitForTimeout(1800);
    const buf = await page.locator('canvas').first().screenshot();
    const slug = `${r.sourceId}-${name}`;
    writeFileSync(join(OUT, `${slug}.png`), buf);
    shots[name] = subjectShare(PNG.sync.read(buf));
  }
  // From the doorway the technique must be visible at all; inside it must be
  // substantial. An empty room scores near zero from both.
  // Calibrated against a frame a human looked at, not against a guess. Source 1
  // (the mocap room) reads as "small but visible" from the doorway and scores
  // 14.6%; rooms at 2-3% are effectively empty from the door even though
  // something is technically drawn there. The first thresholds called 59 of 62
  // PRESENT, which flattered exactly the defect I had already seen with my own
  // eyes — the adapted demos are stage-scaled and tiny.
  //
  // Doorway coverage is the number that matters. Inside coverage barely moves
  // between a good room and a bad one, because wall shading fills the frame
  // either way.
  const verdict = shots.doorway < 0.06 ? 'EMPTY FROM THE DOOR — subject is not readable on entry'
    : shots.doorway < 0.12 ? 'THIN — subject is there but too small to read'
      : 'PRESENT';
  results.push({ ...r, ...shots, verdict });
  console.log(`[${verdict === 'PRESENT' ? ' ok ' : 'FAIL'}] ${String(r.sourceId).padStart(2)} ${r.title.slice(0, 44).padEnd(44)} door=${(shots.doorway * 100).toFixed(1)}% inside=${(shots.inside * 100).toFixed(1)}%  ${verdict}`);
}

writeFileSync(join(OUT, ONLY ? `report-${ONLY}.json` : 'report.json'),
  JSON.stringify({ capturedAt: new Date().toISOString(), adapter, base: BASE, results, errors: [...new Set(errors)] }, null, 1));

const ok = results.filter((r) => r.verdict === 'PRESENT').length;
console.log(`\n${ok}/${results.length} rooms have the technique present.`);
console.log('PRESENT means something is there and it is big enough to see. It is not a claim that the technique is correct.');
if (errors.length) console.log(`console errors: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);

await browser.close().catch(() => {});
try { process.kill(child.pid); } catch {}
process.exit(ok === results.length ? 0 : 1);
