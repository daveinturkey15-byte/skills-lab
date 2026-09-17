# Overnight run contract — 2026-09-17 → 2026-09-18

Frozen before the run starts. **Nothing in this file may be edited mid-run to obtain a pass**
(AKP long-horizon rule R2/LH-1). If a gate turns out to be wrong, the run records that it was
wrong and stops — it does not quietly loosen it.

## The goal

Build out as many catalogue sources as possible into **high-quality live demos** in the Skills
Lab, and make every remaining gap explicit rather than absent.

"High quality" is not a vibe here. It is the acceptance gate in §3.

## 1. What changed tonight, and why it changes everything

Until this evening no demo in this repository had ever been seen on a WebGPU adapter. Every lane
that built one had no GPU and no browser, and honestly reported "acceptance OPEN". That is why
several demos are wrong.

`qa/capture.mjs` now closes the loop. It drives a **real WebGPU adapter** (nvidia / blackwell,
headless), mounts each demo, screenshots the stage and measures the frame. **Every build lane
must run it and must iterate against it.** A lane that reports "I could not verify, no browser"
is now simply wrong — it has one.

Two facts it is built on, both measured:

- Playwright's own `chromium.launch({channel:'chrome'})` strips `navigator.gpu` entirely. The
  harness spawns Chrome itself and attaches over CDP. Do not "simplify" this back.
- The Claude desktop browser pane has **no WebGPU adapter**. It falls back to WebGL2 at ~1 fps,
  which looks like a broken demo. Never accept or reject a demo from that pane.

## 2. Budgets and stop conditions (R4 — declared up front, not negotiable mid-run)

| Budget | Value |
|---|---|
| Concurrent lanes | **6** maximum (each spark ≈ 3 GB; this machine has 63.6 GB and the owner uses it) |
| Model | `muse-spark-1.3-contributor` at `--thinking xhigh`, or `zai/glm-5.3-flash` for research/prose. **Never** a bare `muse-spark-1.3` id — ~20× cost, and `spark.py` raises on it |
| Capture-fix cycles per demo | **3**. On the third failure, stop, keep the best attempt, and record the failure honestly |
| Wall clock | Stop at **07:00**. A lane still running at 07:00 finishes its current demo and reports |
| Per-lane max-time | 75 minutes |

**Budget exhaustion means stop-and-report.** Silently continuing, or granting yourself more
attempts, is prohibited. If a lane burns its 3 cycles on one demo it moves to the next one and
says so — it does not keep grinding.

## 3. Acceptance gate — frozen

A demo is **accepted** only when all of these hold:

1. `npx tsc --noEmit` is clean.
2. `node scripts/verify-catalog.mjs` passes.
3. `node qa/capture.mjs --only <sourceId>` returns a **non-blocking** verdict for that demo —
   `DREW SOMETHING` or `LOOSE`. See the tier table below. The harness exits non-zero only on a
   blocking tier.
4. The demo's `metadata` is truthful — `adaptation`, `sources` and a `limitation` that states
   what the demo does **not** prove.

**A `DREW SOMETHING` verdict is necessary, not sufficient.** It says pixels varied and the
subject occupies the frame. It does not say the technique is correct, and no lane may claim it
does. The owner's eye is the final gate in the morning.

### The three tiers

| tier | meaning | blocking? |
|---|---|---|
| `DREW SOMETHING` | modal tone ≤ 60% — the subject owns the frame | passes |
| `LOOSE` | subject reads, but >60% of the frame is empty | **advisory only** |
| `UNFRAMED` | >85% flat tone, or >60% with under 4% edge density — a backdrop, not a subject | blocking |
| `FLAT` / `BLANK` / `BLACK` | nothing resolvable | blocking |

Spend the budget on blocking tiers. Do not spend it tightening a `LOOSE` frame while anything is
still `BLANK`.

### Why the gate is shaped like this

Its first version counted distinct colours and passed four demos that were obviously wrong at a
glance — a 30 px cloud in an empty stage, with all the colour coming from a smooth sky gradient.
Measured on those frames: modal tone share 77–85%, edge density 1.8–7.9%. So the gate is now a
**framing** gate as much as a content gate, deliberately. A technique demo whose subject is 30 px
in the middle of an empty stage has failed either way.

## 4. Rules every lane inherits

Everything in `CONTEXT.md` still applies. Additionally:

- **Fix locally, never regenerate** (LH-7). If a demo fails the gate, repair the specific cause.
  Do not delete it and write a new one — that destroys the provenance and the fixes already in it.
- **Feed the observed output back** (LH-8). After a failed capture, read the verdict and the
  numbers, form a specific hypothesis about *why* the frame looks like that, and fix that. A
  second blind attempt is not an iteration.
- **Never weaken a gate to pass.** Not the capture thresholds, not the catalogue verifier, not
  `tsc`. Report a gate you believe is wrong; do not edit it.
- **Never edit another lane's files.** Disjoint sets are assigned per brief.
- **`three` is pinned to 0.185.1.** Confirm any API exists in `node_modules/three` before using it.
- **Provenance on everything** (LH-9). A demo derived from a source keeps that source's id, URLs
  and a truthful adaptation level.

## 5. The most common failure, named in advance

The four group-d demos all failed the same way: **the subject was tiny and the camera was too far
back**, so the frame was mostly empty backdrop. Before writing any scene maths, decide the framing
— what fills the stage, at what distance, at what scale — and check it with a capture early rather
than at the end. Most of tonight's likely failures are framing and scale, not shader maths.

## 6. What "gap" means

A gap is recorded, never hidden. Three kinds, and each is a legitimate outcome:

- **No demo possible** — the source is a comparator with nothing to extract, or is licence-blocked.
  Record why, with the blocker.
- **Demo possible, not built** — say so plainly and leave the host rendering
  "Missing / not delivered".
- **Demo built, gate failed** — keep the demo, record the verdict and the numbers, and mark
  acceptance failed. Do **not** delete it and do not claim it passed.

The Atlas must be able to show all three.


## 7. Calibration record (pre-run, 2026-09-17)

The gate was tuned twice before this contract froze, both times against frames a human looked at:

1. **Colour-count version** — passed all four source-51 demos. Inspection: a 30 px cloud in an
   empty stage. All the colour came from a smooth sky gradient. Rejected.
2. **Single threshold, modal ≤ 60%** — failed **49 of 54**. Inspection showed that was wrong in
   the other direction: source 42 (modal 48%) is two procedural buildings filling the frame and
   is good, but source 18 (modal 78%) is a working grass-and-terrain demo that merely sits in
   some empty space. Sending a lane to "fix" that would have spent the night on cosmetics.
3. **Three tiers, adding edge density** — accepted. Edge density is what separates loose framing
   from an absent subject: source 18 has 7.4%, source 51's cloud has 2.4% at almost the same
   modal share.

Baseline at freeze, re-scored across all 54 captured demos:
**7 pass · 10 loose · 36 unframed · 1 blank → 37 blocking.**

That baseline is the number the morning is measured against. It is not edited.