/**
 * qa/chrome-lifecycle.mjs — spawn a headless Chrome and guarantee it dies.
 *
 * WHY THIS EXISTS, measured rather than assumed.
 *
 * Both capture harnesses spawned Chrome with `detached: true` + `unref()` and
 * ended it with `process.kill(child.pid)`. That kills only the launcher process.
 * Chrome immediately forks 8-10 children — GPU process, network service,
 * renderers, utility — and because the tree is detached they are reparented and
 * survive. A peer session watched orphaned Chromes climb 1 -> 5 over twenty
 * minutes of my runs; I confirmed it independently afterwards: five orphaned
 * real-Chrome processes, every one carrying `skills-lab` in its command line,
 * 265 MB, dating from two capture runs hours earlier.
 *
 * The same mechanism reportedly produced ~600 orphaned Chromes one night and
 * made this machine unusable for fifteen hours. It is worth more than the
 * twenty lines it takes to fix.
 *
 * Two things are needed and neither alone is enough:
 *
 *  1. `taskkill /PID <pid> /T /F` — the /T is the whole point: it takes the
 *     tree, not the process.
 *  2. Handlers on exit, SIGINT, SIGTERM and uncaughtException. The old code
 *     cleaned up at three explicit exit paths, so any throw outside those three
 *     leaked the entire tree — and a capture harness throws for a living.
 */
import { spawn, spawnSync } from 'node:child_process';

/** pid -> the profile directory that run owns. */
const tracked = new Map();
let wired = false;

/**
 * Kill every process still holding a profile directory.
 *
 * Chrome re-parents itself, so the pid we spawned is frequently dead while the
 * real browser and its renderers live on under a different parent. Measured:
 * after a taskkill /T on the spawned pid reported success and the pid had no
 * children, four processes were still holding that run's --user-data-dir.
 */
function killByProfile(profile) {
  if (!profile) return;
  // WMI escaping: backslashes are doubled inside a LIKE literal, and quotes
  // would terminate it.
  const needle = String(profile).replace(/\\/g, '\\\\').replace(/'/g, "''");
  // Sweep twice. A Chrome killed seconds after launch is still spawning
  // renderers, so a single pass reaps what exists at that instant and the
  // stragglers appear immediately after: measured 16 -> 4 with one pass, 0 with
  // two. Both passes are inside one synchronous call so this stays safe in an
  // exit handler.
  const sweep = "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*"
    + needle + "*' } | ForEach-Object { taskkill /PID $($_.ProcessId) /T /F 2>$null }";
  const ps = `${sweep}; Start-Sleep -Milliseconds 900; ${sweep}`;
  try {
    spawnSync('powershell', ['-NoProfile', '-Command', ps],
      { stdio: 'ignore', windowsHide: true });
  } catch { /* already gone is the success case */ }
}

/** Kill a process tree. Idempotent, never throws, safe in an exit handler. */
export function killTree(pid) {
  if (!pid || !tracked.has(pid)) return;
  const profile = tracked.get(pid);
  tracked.delete(pid);
  try {
    if (process.platform === 'win32') {
      // Synchronous: an async kill started in an 'exit' handler never runs.
      // windowsHide, or taskkill itself flashes a console on every capture -
      // which violates the owner's standing no-flash rule from the cleanup
      // code meant to be invisible.
      spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'],
        { stdio: 'ignore', windowsHide: true });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch { /* already gone is the outcome we wanted */ }
  // The pid kill is not enough on its own; this is what actually clears the run.
  if (process.platform === 'win32') killByProfile(profile);
}

function killAll() {
  // .keys(): `tracked` is a Map now, and spreading it yields [pid, profile]
  // pairs - which killTree silently ignored, so nothing was ever reaped.
  for (const pid of [...tracked.keys()]) killTree(pid);
}

function wire() {
  if (wired) return;
  wired = true;
  process.on('exit', killAll);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    process.on(sig, () => { killAll(); process.exit(130); });
  }
  process.on('uncaughtException', (error) => {
    killAll();
    console.error('capture failed:', error);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    killAll();
    console.error('capture failed (unhandled rejection):', reason);
    process.exit(1);
  });
}

/**
 * Launch headless Chrome with a WebGPU adapter. Returns the pid; the caller
 * passes it to killTree() when done, and every abnormal exit is already covered.
 *
 * Playwright's own launch strips navigator.gpu entirely, which is why this
 * spawns Chrome itself and the caller attaches over CDP.
 */
export function launchChrome({ port, profile, headed = false, width = 1600, height = 900, chrome }) {
  wire();
  const exe = chrome ?? process.env.QA_CHROME
    ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const child = spawn(exe, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check',
    // Without these there is no adapter even on a discrete NVIDIA GPU.
    '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--enable-gpu',
    '--autoplay-policy=no-user-gesture-required',
    // Monitor 2 starts at x=2560; QA windows never open on the primary screen.
    headed ? '--window-position=2560,0' : '--headless=new',
    `--window-size=${width},${height}`,
    'about:blank',
  ], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  tracked.set(child.pid, profile);
  return child.pid;
}
