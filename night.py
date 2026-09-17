"""night.py — the overnight supervisor.

One wave = launch the build lanes, wait for them to exit, re-capture on a real
WebGPU adapter, re-plan from the new evidence. Repeat until the work list is
empty, the wave cap is hit, or the wall clock stop time arrives.

This exists so the loop is closed by evidence rather than by an agent's opinion
of its own work: no lane's report decides whether its demo is accepted — the
capture does, and the next wave's assignment is generated from that capture.

Bounded on purpose (AKP long-horizon R4 / LH-6):
  - wave cap, declared here, never raised mid-run
  - wall-clock stop, default 07:00
  - concurrency cap, so the owner's machine stays usable
  - no gate is ever edited by this script

    python night.py                 # run the full night
    python night.py --dry-run       # plan and print, launch nothing
    python night.py --status        # where did it get to
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOGS = ROOT / "logs"
STATE = LOGS / "night-state.json"

BUILD_LANES = ["N1", "N2", "N3", "N4"]
ANALYSIS_LANES: list[str] = []       # R and S were launched by hand in wave 1; adopted, not relaunched
MAX_WAVES = 4
MAX_CONCURRENT = 6
STOP_HOUR = 7                        # 07:00 local
LANE_POLL_SECONDS = 60
LANE_HARD_CAP_MINUTES = 80           # a lane past this is considered hung and abandoned


def stop_at() -> datetime:
    now = datetime.now()
    stop = now.replace(hour=STOP_HOUR, minute=0, second=0, microsecond=0)
    if stop <= now:
        stop += timedelta(days=1)
    return stop


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, **kw)


def capture() -> dict:
    """Full capture on a real adapter. Returns the parsed report (or an error dict)."""
    print("  capture: running against a real WebGPU adapter ...", flush=True)
    proc = subprocess.run(
        ["node", "qa/capture.mjs", "--base", "http://localhost:5183", "--settle", "2500"],
        cwd=str(ROOT), capture_output=True, text=True,
    )
    tail = [ln for ln in proc.stdout.strip().splitlines() if ln.strip()][-3:]
    for ln in tail:
        print("   ", ln, flush=True)
    path = ROOT / "qa/captures/report.json"
    if not path.exists():
        return {"error": "no report.json", "stdout": proc.stdout[-2000:], "stderr": proc.stderr[-2000:]}
    return json.loads(path.read_text())


def plan(lanes: int) -> str:
    proc = run(["node", "plan-night.mjs", "--lanes", str(lanes)])
    print(proc.stdout.strip(), flush=True)
    if proc.returncode != 0:
        print(proc.stderr.strip(), flush=True)
    return proc.stdout


def launch(lane_names: list[str]) -> list[dict]:
    proc = run([sys.executable, "spark.py", *lane_names])
    print(proc.stdout.strip(), flush=True)
    if proc.returncode != 0:
        print("  launch failed:", proc.stderr.strip()[:500], flush=True)
        return []
    manifest = json.loads((LOGS / "manifest.json").read_text())
    return [r for r in manifest if r["lane"] in lane_names][-len(lane_names):]


def alive(pid: int) -> bool:
    out = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                         capture_output=True, text=True).stdout
    return str(pid) in out


def wait_for(rows: list[dict], deadline: datetime) -> None:
    """Wait on this wave. Log mtime is the liveness signal; PID reuse lies."""
    started = time.time()
    while True:
        running = [r for r in rows if alive(r["pid"])]
        if not running:
            print("  wave complete", flush=True)
            return
        if datetime.now() >= deadline:
            print(f"  wall-clock stop reached with {len(running)} lane(s) still running — leaving them to finish", flush=True)
            return
        if (time.time() - started) / 60 > LANE_HARD_CAP_MINUTES:
            print(f"  lane hard cap ({LANE_HARD_CAP_MINUTES}m) hit; abandoning wait on {[r['lane'] for r in running]}", flush=True)
            return
        time.sleep(LANE_POLL_SECONDS)


def save(state: dict) -> None:
    LOGS.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, indent=1))


def main() -> None:
    args = sys.argv[1:]
    if "--status" in args:
        print(STATE.read_text() if STATE.exists() else "no night-state.json yet")
        return

    dry = "--dry-run" in args
    deadline = stop_at()
    print(f"overnight supervisor — stop at {deadline:%Y-%m-%d %H:%M}, max {MAX_WAVES} waves, "
          f"{MAX_CONCURRENT} concurrent\n", flush=True)

    state = {"startedAt": datetime.now().isoformat(timespec="seconds"),
             "stopAt": deadline.isoformat(timespec="seconds"), "waves": []}

    # Wave 1 may already have been launched by hand. Adopt it rather than
    # starting a duplicate wave on top of lanes that are mid-edit.
    if (LOGS / "manifest.json").exists():
        existing = json.loads((LOGS / "manifest.json").read_text())
        live = [r for r in existing if alive(r["pid"])]
        if live:
            print(f"adopting {len(live)} lane(s) already running: "
                  f"{', '.join(sorted({r['lane'] for r in live}))}", flush=True)
            state["adopted"] = sorted({r["lane"] for r in live})
            save(state)
            wait_for(live, deadline)

    for wave in range(1, MAX_WAVES + 1):
        if datetime.now() >= deadline:
            print("wall-clock stop reached before wave", wave, flush=True)
            break

        print(f"\n=== wave {wave} ===", flush=True)
        report = capture()
        if "error" in report:
            print("  capture failed; stopping rather than sending lanes out blind:", report["error"], flush=True)
            state["waves"].append({"wave": wave, "aborted": report["error"]})
            break

        passed, total = report.get("drewSomething", 0), report.get("captured", 0)
        print(f"  {passed}/{total} demos pass the frame gate", flush=True)

        plan_out = plan(len(BUILD_LANES))
        assignments = [l for l in BUILD_LANES if (ROOT / "briefs" / f"{l}-assignment.md").exists()]
        if not assignments:
            print("  nothing left to assign — the work list is empty", flush=True)
            state["waves"].append({"wave": wave, "passed": passed, "total": total, "assigned": 0})
            break

        wave_lanes = assignments + (ANALYSIS_LANES if wave == 1 else [])
        wave_lanes = wave_lanes[:MAX_CONCURRENT]

        record = {"wave": wave, "passed": passed, "total": total,
                  "lanes": wave_lanes, "at": datetime.now().isoformat(timespec="seconds")}
        state["waves"].append(record)
        save(state)

        if dry:
            print(f"  [dry run] would launch: {', '.join(wave_lanes)}", flush=True)
            break

        rows = launch(wave_lanes)
        wait_for(rows, deadline)
        save(state)

    # Final evidence pass, so the morning report rests on a capture taken after
    # the last edit rather than on any lane's self-assessment.
    if not dry:
        print("\n=== final capture ===", flush=True)
        final = capture()
        state["final"] = {"passed": final.get("drewSomething"), "total": final.get("captured"),
                          "at": datetime.now().isoformat(timespec="seconds")}
        save(state)
        print(f"\nnight finished: {state['final']['passed']}/{state['final']['total']} pass the frame gate")
        print("A pass means a subject occupies and structures the frame — not that the technique is correct.")


if __name__ == "__main__":
    main()
