/**
 * Source 27 - Three.js game skill pack (majidmanzarpour/threejs-game-skills).
 *
 * Primary source, re-read at the pinned revision on 2026-09-12 (cached outside the
 * repository, sha256 in SOURCE_RESEARCH.json):
 *   https://github.com/majidmanzarpour/threejs-game-skills @ 7221c1f4a6d2ae189a4d85d058d24f3228499d46
 *   skills/threejs-gameplay-systems/SKILL.md (5,970 B) and
 *   skills/threejs-game-director/SKILL.md (11,280 B), both read IN FULL this session; MIT
 *   LICENSE position re-confirmed by the prior lane.
 *
 * THE EXTRACTED METHOD, restated from the gameplay-systems body: step 7 tunes game feel
 * through hitstop, impact feedback and cooldowns; step 8 demands "hot paths allocation-light
 * and update order explicit"; the skill's core loop contract (verb, objective, pressure,
 * reward, fail/retry) and its failure mode "state changes do not drive UI/audio/VFX" are the
 * concrete things a scene can demonstrate. THE SCENE therefore implements the feel loop
 * itself: a striker hits a target, HITSTOP freezes the response clock for a few frames,
 * impact feedback (flash + knockback + decaying shake) is driven by the frozen clock, and a
 * cooldown gates the next hit - allocation-light (pooled flash) with an explicit update
 * order: cooldown -> hitstop -> physics -> feedback decay.
 *
 * The register's decision for this row is COMPARISON against our own library, not import;
 * the coverage comparison is the row's artifact (docs/technique-lab/group-b/
 * skill-pack-comparisons.md) and this scene is the extracted-method proof, NOT an adoption
 * of the pack.
 */

import { createRng } from './rng';
import { disposeGroup, type Demo, type DemoContext } from './types';

const HIT_INTERVAL_S = 1.4;
const HITSTOP_S = 0.12;
const SHAKE_DECAY = 5.5;

export function createDemo(context: DemoContext): Demo {
  const { THREE } = context;
  const root = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const rng = createRng(context.seed ^ 0x27beef);

  // Layout fills its own bounding sphere: a compact dummy and striker at close
  // quarters over a ground strip, so the feel loop reads instead of rattling
  // in an empty stage. Timing constants below are untouched — only spacing is.
  const DUMMY_X = 0.45;
  const DUMMY_Y = 1.0;
  const STRIKER_Y = 0.95;
  const STRIKER_END_X = -1.15;
  // Target dummy (shakes on hit) and striker (pooled flash on impact).
  const dummyGeometry = new THREE.CapsuleGeometry(0.48, 0.95, 4, 12);
  const dummyMaterial = new THREE.MeshStandardMaterial({ color: 0x7a8f5a, metalness: 0.05, roughness: 0.6 });
  const dummy = new THREE.Mesh(dummyGeometry, dummyMaterial);
  dummy.position.set(DUMMY_X, DUMMY_Y, 0);
  root.add(dummy);
  disposables.push(dummyGeometry, dummyMaterial);

  const strikerGeometry = new THREE.BoxGeometry(0.56, 0.56, 0.56);
  const strikerMaterial = new THREE.MeshStandardMaterial({ color: 0xc4763a, metalness: 0.2, roughness: 0.5 });
  const striker = new THREE.Mesh(strikerGeometry, strikerMaterial);
  striker.position.set(STRIKER_END_X, STRIKER_Y, 0);
  root.add(striker);
  disposables.push(strikerGeometry, strikerMaterial);

  const flashGeometry = new THREE.SphereGeometry(0.36, 12, 10);
  const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.visible = false;
  root.add(flash);
  disposables.push(flashGeometry, flashMaterial);

  // Ground strip: contact read and frame area. Neutral stage, not the technique.
  const groundGeometry = new THREE.BoxGeometry(2.3, 0.12, 1.4);
  // Light slate, distinct from the host backdrop: the strip must read as stage,
  // not merge with the background into one modal bucket.
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x525b66, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(-0.15, -0.06, 0);
  ground.name = 'ground-strip';
  root.add(ground);
  disposables.push(groundGeometry, groundMaterial);
  // Scorch ring where the striker lands: a permanent impact mark, pooled like
  // the flash (allocated once, never per frame).
  const scorchGeometry = new THREE.RingGeometry(0.5, 0.72, 28);
  const scorchMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1e24, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const scorch = new THREE.Mesh(scorchGeometry, scorchMaterial);
  scorch.position.set(0.1, 0.005, 0);
  scorch.rotation.x = -Math.PI / 2;
  scorch.name = 'impact-scorch';
  root.add(scorch);
  disposables.push(scorchGeometry, scorchMaterial);

  const stats = {
    hits: 0,
    hitstopFramesConsumed: 0,
    lastShakeAmplitude: 0,
    cooldownsGated: 0,
  };

  let cooldown = 0;
  let hitstopRemaining = 0;
  let flashLife = 0;
  let shake = 0;

  const update = (_timeS: number, dt: number): void => {
    // Explicit update order: cooldown -> hitstop -> striker physics -> feedback decay.
    cooldown = Math.max(0, cooldown - dt);


    const striking = striker.position.x >= 0.2;
    if (!striking && cooldown <= 0) {
      // Wind up: the striker lunges across the gap.
      striker.position.x = DUMMY_X;
      striker.position.y = STRIKER_Y;
      cooldown = HIT_INTERVAL_S;
    } else if (!striking) {
      stats.cooldownsGated += 1;
    }
    if (striking && hitstopRemaining <= 0) {
      if (striker.position.x < STRIKER_END_X) striker.position.x = STRIKER_END_X;
      else striker.position.x -= dt * 6;
    }

    // Contact: apply hitstop BEFORE feedback so the whole response reads as one beat.
    if (striker.position.x <= 0.2 && striker.position.x > -0.15 && hitstopRemaining <= 0 && flashLife <= 0) {
      hitstopRemaining = HITSTOP_S;
      shake = 1;
      flashLife = 0.18;
      flash.position.copy(dummy.position);
      flash.visible = true;
      stats.hits += 1;
      stats.lastShakeAmplitude = shake;
    }

    if (hitstopRemaining > 0) {
      hitstopRemaining -= dt;
      stats.hitstopFramesConsumed += 1;
    } else {
      // Feedback decays only on the unfrozen clock - the point of hitstop.
      shake = Math.max(0, shake - SHAKE_DECAY * dt);
      if (shake > 0) {
        dummy.position.x = DUMMY_X + shake * 0.2 * (rng() > 0.5 ? 1 : -1);
        dummy.rotation.z = shake * 0.15 * (rng() > 0.5 ? 1 : -1);
      } else {
        dummy.position.x = DUMMY_X;
        dummy.rotation.z = 0;
      }
    }
    if (flashLife > 0) {
      flashLife -= dt;
      flashMaterial.opacity = Math.max(0, flashLife / 0.18);
      if (flashLife <= 0) flash.visible = false;
    }
    // Knockback eases the dummy back along its base - eased per the feel guidance.
    if (stats.hits > 0 && shake === 0 && Math.abs(dummy.position.x - DUMMY_X) > 0.001) {
      dummy.position.x += (DUMMY_X - dummy.position.x) * Math.min(1, dt * 8);
    }
  };

  const dispose = (): void => {
    for (const entry of disposables) entry.dispose();
    disposables.length = 0;
    disposeGroup(root);
  };

  root.userData.stats = stats;
  // The host camera sits on the +x+z diagonal, down the striker's travel
  // axis: mid-lunge frames hid the striker inside the dummy (capture: modal
  // 84%, edges 2.0%). Turn the travel axis across the view so striker, dummy,
  // flash and scorch read in every phase. Timing and update order untouched.
  root.rotation.y = Math.PI / 4;
  return {
    root,
    update,
    dispose,
    metadata: {
      sourceId: 27,
      title: 'Three.js game skill pack (majidmanzarpour)',
      method:
        'Game-feel loop from the gameplay-systems skill: hitstop freezing the response clock, '
        + 'pooled impact flash, decaying positional shake and a gating cooldown, run in an '
        + 'explicit cooldown -> hitstop -> physics -> feedback update order.',
      adaptation: 'adapted',
      sources: ['https://github.com/majidmanzarpour/threejs-game-skills'],
      limitation:
        'MIT pack whose register decision is COMPARISON, not import: this scene demonstrates the '
        + 'extracted feel-loop method only - no scaffold generator, reference ledgers, AAA '
        + 'graphics builder, UI designer or QA-release pipeline. Coverage comparison lives in '
        + 'docs/technique-lab/group-b/skill-pack-comparisons.md.',
    },
  };
}

export default createDemo;
