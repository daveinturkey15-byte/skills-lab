#!/usr/bin/env node
/**
 * qa/capture.mjs — the WebGPU capture harness.
 *
 * Every demo in this repository was authored by an agent with no GPU and no
 * browser, so the honest status of all of them was "acceptance OPEN". This is
 * the instrument that closes that: it drives a real WebGPU adapter, mounts each
 * demo, screenshots the stage, and measures whether anything was actually drawn.
 *
 * Two findings it is built on, both measured on dave-gaming-pc 2026-09-17:
 *
 *  1. Playwright's own `chromium.launch({channel:'chrome'})` removes
 *     `navigator.gpu` ENTIRELY — hasGpu:false even headed with every WebGPU
 *     flag set. You must spawn Chrome yourself and attach with
 *     `connectOverCDP`. Then the adapter is there (nvidia / blackwell),
 *     headless included.
 *  2. The Claude desktop browser pane has no WebGPU adapter at all, so it
 *     cannot be used to accept a WebGPU demo. It silently falls back to WebGL2
 *     at ~1 fps, which looks like a broken demo rather than a missing adapter.
 *
 * Headless by default so QA windows never appear on the owner's screens. With
 * --headed it opens on monitor 2 (x=2560), never the primary.
 *
 * Usage:
 *   node qa/capture.mjs --base http://localhost:5183            # all demos
 *   node qa/capture.mjs --only 51 --headed                      # one source
 *   node qa/capture.mjs --base https://<user>.github.io/skills-lab/
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const require_ = createRequire(import.meta.url);

const CHROME = process.env.QA_CHROME
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/* ------------------------------------------------------------------- args */

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const BASE = (arg('base') ?? 'http://localhost:5183').replace(/\/?$/, '/');
const OUT = arg('out') ?? join(ROOT, 'qa', 'captures');
const ONLY = arg('only');
const HEADED = flag('headed');
const PORT = Number(arg('port', '9412'));
const SETTLE_MS = Number(arg('settle', '4000'));

/* ------------------------------------------------------------- blankness */

/**
 * Is this frame actually showing something?
 *
 * A blank stage and a working-but-dark stage are both "mostly dark", so a mean
 * brightness test cannot tell them apart — which is exactly the trap recorded
 * in this workspace's blind-measurement-station gotcha. Distinct quantised
 * colours separates them: a cleared buffer has 1-2, a gradient backdrop with
 * nothing in it has a handful in a single hue, and a real scene has dozens
 * across several hues.
 */
function frameStats(png) {
  const { width, height, data } = png;
  const colours = new Set();
  const hues = new Set();
  const modeHist = new Map();
  const luma = (x, y) => {
    const i = (y * width + x) * 4;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  };
  let sum = 0;
  let max = 0;
  let n = 0;
  let edges = 0;
  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Quantise to 5 bits/channel so sensor-style noise does not inflate the count.
      colours.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
      // Coarser 4-bit bucket for the modal-tone share.
      const coarse = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      modeHist.set(coarse, (modeHist.get(coarse) ?? 0) + 1);
      const v = (r + g + b) / 3;
      sum += v; n += 1;
      if (v > max) max = v;
      // Sobel-ish central difference. Smooth gradient quads score near zero;
      // real subject matter (foliage, volume, rain, wave detail) does not.
      if (Math.abs(luma(x + 2, y) - luma(x - 2, y)) + Math.abs(luma(x, y + 2) - luma(x, y - 2)) > 10) edges += 1;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn > 12) {
        let h = 0;
        if (mx === r) h = ((g - b) / (mx - mn)) % 6;
        else if (mx === g) h = (b - r) / (mx - mn) + 2;
        else h = (r - g) / (mx - mn) + 4;
        hues.add(Math.round(((h * 60) + 360) % 360 / 15));
      }
    }
  }
  return {
    distinctColours: colours.size,
    distinctHueBuckets: hues.size,
    meanLuma: Number((sum / n).toFixed(2)),
    maxLuma: Number(max.toFixed(1)),
    edgeDensity: Number((edges / n).toFixed(4)),
    modalToneShare: Number((Math.max(...modeHist.values()) / n).toFixed(3)),
  };
}

/**
 * The verdict can only ever say a frame FAILED; it never certifies correctness.
 *
 * The first version of this gate passed four demos that a human immediately saw
 * were wrong, because it counted distinct colours and a smooth sky-gradient
 * backdrop supplies plenty of those. Measured on those four frames: modal tone
 * share 77-85% and edge density 1.8-7.9%, i.e. four-fifths of every frame was a
 * single flat tone with almost no structure in the rest. So the gate now tests
 * for a subject that actually occupies and structures the frame. This is a
 * FRAMING gate as much as a content gate, which is correct — a technique demo
 * whose subject is 30 px in the middle of an empty stage has failed either way.
 */
const MODAL_TONE_CEILING = 0.60;
const EDGE_DENSITY_FLOOR = 0.03;

function verdictFor(stats) {
  if (stats.distinctColours <= 2) return 'BLANK — cleared buffer only';
  if (stats.maxLuma < 24) return 'BLACK — nothing above noise floor';
  if (stats.distinctColours < 12 && stats.distinctHueBuckets <= 1) return 'NEAR-BLANK — backdrop only, no discernible subject';
  if (stats.modalToneShare > MODAL_TONE_CEILING) {
    return `UNFRAMED — ${(stats.modalToneShare * 100).toFixed(0)}% of the frame is one flat tone (ceiling ${MODAL_TONE_CEILING * 100}%)`;
  }
  if (stats.edgeDensity < EDGE_DENSITY_FLOOR) {
    return `FLAT — edge density ${(stats.edgeDensity * 100).toFixed(2)}% below the ${EDGE_DENSITY_FLOOR * 100}% floor`;
  }
  return 'DREW SOMETHING';
}

/* ----------------------------------------------------------------- chrome */

async function launchChrome(chromium) {
  const profile = join(OUT, '.chrome-profile');
  mkdirSync(profile, { recursive: true });
  const args = [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check',
    // Without these the adapter is absent even on a discrete NVIDIA GPU.
    '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--enable-gpu',
    '--autoplay-policy=no-user-gesture-required',
    HEADED ? '--window-position=2560,0' : '--headless=new',
    '--window-size=1600,1000',
    'about:blank',
  ];
  const child = spawn(CHROME, args, { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();

  for (let i = 0; i < 60; i += 1) {
    try {
      return { browser: await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`, { timeout: 2000 }), child };
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Chrome CDP never came up on ${PORT}`);
}

/* ------------------------------------------------------------------- main */

let chromium;
let PNG;
try {
  ({ chromium } = await import('playwright-core'));
  ({ PNG } = require_('pngjs'));
} catch {
  console.error('qa deps missing. Run:  npm --prefix qa install');
  process.exit(2);
}

mkdirSync(OUT, { recursive: true });

const catalogPath = join(ROOT, 'public/assets/skills-lab/source-catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

const { browser, child } = await launchChrome(chromium);
const ctx = browser.contexts()[0] ?? (await browser.newContext());
const page = await ctx.newPage();
page.setDefaultTimeout(45000);

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 300)}`));

await page.goto(`${BASE}?view=lab`, { waitUntil: 'networkidle' });

const adapter = await page.evaluate(`(async () => {
  if (!navigator.gpu) return { hasGpu: false };
  const a = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }).catch(() => null);
  return { hasGpu: true, adapter: !!a, vendor: a?.info?.vendor ?? null, architecture: a?.info?.architecture ?? null };
})()`);

if (!adapter.adapter) {
  console.error('\nNO WEBGPU ADAPTER — refusing to record acceptance from a fallback backend.');
  console.error(JSON.stringify(adapter));
  await browser.close().catch(() => {});
  try { process.kill(child.pid); } catch {}
  process.exit(3);
}
console.log(`WebGPU adapter: ${adapter.vendor} / ${adapter.architecture}  (headless=${!HEADED})\n`);

// The host exposes every mounted demo; read the list from the page rather than
// guessing it from the catalogue, so a demo that failed to register is visible
// as missing rather than silently skipped.
const demos = await page.evaluate(`(() => {
  const out = [];
  for (const b of document.querySelectorAll('button')) {
    const m = (b.getAttribute('aria-label') || b.textContent || '').match(/^\\s*Source\\s+(\\d+)\\s*,\\s*(.+?)\\s*$/);
    if (m) out.push({ sourceId: Number(m[1]), title: m[2] });
  }
  return out;
})()`);

const wanted = ONLY ? demos.filter((d) => String(d.sourceId) === String(ONLY)) : demos;
console.log(`${demos.length} demos exposed by the host; capturing ${wanted.length}\n`);

const results = [];
for (const demo of wanted) {
  consoleErrors.length = 0;
  const slug = `${demo.sourceId}-${demo.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}`;
  try {
    await page.evaluate(`(() => {
      for (const b of document.querySelectorAll('button')) {
        const t = (b.getAttribute('aria-label') || b.textContent || '');
        if (t.includes(${JSON.stringify(demo.title)})) { b.click(); return true; }
      }
      return false;
    })()`);
    await page.waitForTimeout(SETTLE_MS);

    const canvas = page.locator('canvas').first();
    const buf = await canvas.screenshot({ timeout: 20000 });
    writeFileSync(join(OUT, `${slug}.png`), buf);
    const stats = frameStats(PNG.sync.read(buf));

    const readout = await page.evaluate(`(() => {
      const t = document.body.innerText;
      const m = t.match(/(WebGPU|WebGL[^\\n]{0,24})[^\\n]{0,80}/);
      return m ? m[0].trim() : null;
    })()`);

    const row = { ...demo, slug, ...stats, verdict: verdictFor(stats), readout, consoleErrors: [...consoleErrors] };
    results.push(row);
    const mark = row.verdict === 'DREW SOMETHING' ? ' ok ' : 'FAIL';
    console.log(`[${mark}] ${String(demo.sourceId).padStart(2)} ${demo.title.slice(0, 58).padEnd(58)} modal=${String((stats.modalToneShare*100).toFixed(0)).padStart(3)}% edges=${String((stats.edgeDensity*100).toFixed(2)).padStart(5)}% ${row.verdict}`);
  } catch (error) {
    results.push({ ...demo, slug, verdict: `ERROR — ${error.message.split('\n')[0]}`, consoleErrors: [...consoleErrors] });
    console.log(`[ERR ] ${demo.sourceId} ${demo.title.slice(0, 58)} — ${error.message.split('\n')[0]}`);
  }
}

const drew = results.filter((r) => r.verdict === 'DREW SOMETHING').length;
const report = {
  capturedAt: new Date().toISOString(),
  base: BASE,
  adapter,
  headless: !HEADED,
  demoCount: demos.length,
  captured: results.length,
  drewSomething: drew,
  // The catalogue is carried so a later reader can align verdicts to claims.
  catalogueSources: catalog.sources.length,
  results,
};
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1));

console.log(`\n${drew}/${results.length} drew something. PNGs + report.json in ${OUT}`);
console.log('A "DREW SOMETHING" verdict means pixels varied — NOT that the demo is correct.');

await browser.close().catch(() => {});
try { process.kill(child.pid); } catch {}
process.exit(drew === results.length ? 0 : 1);
