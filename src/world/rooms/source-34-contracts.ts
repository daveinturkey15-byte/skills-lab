/**
 * Source 34 — subsystem-contract architecture (Claude-of-Duty), scale model.
 *
 * Restages the group-b contract demo at room scale. The method is kept: six
 * single-owner subsystem boxes communicating only through a typed event
 * vocabulary with declared producers and consumers, visualised against
 * uncontracted broadcast delivery, with the source's quadratic damage falloff
 * riding each pulse. Left half contracted (pulses travel declared edges
 * only), right half broadcast (every box hears everything), both rows just
 * inside the door so the comparison reads on entry.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

const SUBSYSTEMS = ['weapons', 'physics', 'fx', 'audio', 'ui', 'ai'] as const;
type Subsystem = (typeof SUBSYSTEMS)[number];

/** Declared vocabulary: one producer, named consumers — the ARCHITECTURE.md idea. */
const VOCABULARY: { name: string; producer: Subsystem; consumers: Subsystem[] }[] = [
  { name: 'bullet:tracer', producer: 'weapons', consumers: ['physics', 'fx'] },
  { name: 'hit:impact', producer: 'physics', consumers: ['fx', 'audio', 'ui'] },
  { name: 'fx:flash', producer: 'fx', consumers: ['ui'] },
];

const BOX_COLOURS: Record<Subsystem, number> = {
  weapons: 0xc96a1e,
  physics: 0x2e7fc9,
  fx: 0xc9b32e,
  audio: 0x8a4dc9,
  ui: 0x1f8f7a,
  ai: 0xc94d6a,
};

interface Pulse {
  mesh: THREE.Mesh;
  path: THREE.Vector3[];
  t: number;
  speed: number;
}

export const room: RoomDefinition = {
  sourceId: 34,
  skill: 'unmapped',
  title: 'Subsystem contracts, not broadcasts',
  summary: 'Six subsystem blocks exchange typed events over declared edges on the left, and shout at everyone on the right.',
  kind: 'webgpu',
  limitation:
    'An architecture scale model, not the game: no render pipeline, physics, weapons or AI behaviour; six named boxes for eleven subsystems and a three-event illustration of the vocabulary.',
  create: (ctx: RoomContext): RoomInstance => {
    const { THREE } = ctx;
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(v: T): T => (disposables.push(v), v);

    // Lit backdrops right behind each row; a faint emissive lift keeps them
    // from crushing to black under the room lamp, which reads as empty.
    for (const x of [-2.8, 2.8]) {
      const back = new THREE.Mesh(
        track(new THREE.BoxGeometry(5.4, 4.8, 0.3)),
        track(new THREE.MeshStandardMaterial({
          color: x < 0 ? 0x2a524b : 0x6b3546, roughness: 0.95,
          emissive: x < 0 ? 0x2a524b : 0x6b3546, emissiveIntensity: 0.35,
        })),
      );
      back.position.set(x, 2.4, 4.2);
      root.add(back);
    }

    const boxGeo = track(new THREE.BoxGeometry(1.8, 1.8, 1.8));
    const pulseGeo = track(new THREE.SphereGeometry(0.3, 12, 10));
    const pulses: Pulse[] = [];
    const boxes: Record<string, THREE.Vector3> = {};
    const halves: { broadcast: boolean }[] = [{ broadcast: false }, { broadcast: true }];

    for (const [h, ox] of [-2.8, 2.8].entries()) {
      SUBSYSTEMS.forEach((name, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const key = `${h}:${name}`;
        boxes[key] = new THREE.Vector3(ox - 1.7 + col * 1.7, 1.6 + row * 2.1, -1);
        const mesh = new THREE.Mesh(
          boxGeo,
          track(new THREE.MeshStandardMaterial({
            color: BOX_COLOURS[name], roughness: 0.6,
            emissive: BOX_COLOURS[name], emissiveIntensity: 0.12,
          })),
        );
        mesh.position.copy(boxes[key]!);
        root.add(mesh);
      });
    }

    const pulseMatA = track(new THREE.MeshStandardMaterial({
      color: 0x0b2a24, emissive: 0x59d68c, emissiveIntensity: 2.6,
    }));
    const pulseMatB = track(new THREE.MeshStandardMaterial({
      color: 0x2a0b12, emissive: 0xff5a4d, emissiveIntensity: 2.6,
    }));

    let elapsed = 0;
    let nextShot = 0.2;
    let vocabIndex = 0;

    const spawnPulse = (halfIndex: number): void => {
      const half = halves[halfIndex];
      if (!half) return;
      const event = VOCABULARY[vocabIndex % VOCABULARY.length];
      if (!event) return;
      const from = boxes[`${halfIndex}:${event.producer}`];
      if (!from) return;
      const targets = half.broadcast ? [...SUBSYSTEMS] : event.consumers;
      for (const target of targets) {
        const to = boxes[`${halfIndex}:${target}`];
        if (!to || pulses.length > 24) continue;
        const mesh = new THREE.Mesh(pulseGeo, half.broadcast ? pulseMatB : pulseMatA);
        root.add(mesh);
        pulses.push({ mesh, path: [from.clone(), to.clone()], t: 0, speed: 0.9 });
      }
    };

    return {
      root,
      update: (_t, dt) => {
        elapsed += Math.min(dt, 0.05);
        if (elapsed >= nextShot) {
          nextShot = elapsed + 1.0;
          spawnPulse(0);
          spawnPulse(1);
          vocabIndex += 1;
        }
        for (let i = pulses.length - 1; i >= 0; i -= 1) {
          const pulse = pulses[i];
          if (!pulse) continue;
          pulse.t += dt * pulse.speed;
          if (pulse.t >= 1) {
            root.remove(pulse.mesh);
            pulses.splice(i, 1);
            continue;
          }
          pulse.mesh.position.lerpVectors(pulse.path[0]!, pulse.path[1]!, pulse.t);
          // The borrowed vocabulary made visible: pulses shrink by the source
          // quadratic damage falloff 1 - (1-dropoff)*r^2.
          const s = Math.max(0.25, 1 - 0.5 * pulse.t * pulse.t);
          pulse.mesh.scale.setScalar(s);
        }
      },
      dispose: () => { for (const d of disposables) d.dispose(); },
    };
  },
};
