import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 11 — scaffold in code, generate the hero asset. Re-staged from
 * `src/lab/demos/group-a/source-11.ts`: the same world contract (1.7 m
 * character, ground contact plane, -Z verb axis), the same deliberately
 * mis-authored hero (wrong units, centroid pivot, +X forward), and the same
 * measured harmonisation (bounds → scale, pivot → plane, facing → verb axis).
 * What changed is address: the demo's 2 m stages become two 7 m scaffolded
 * plots with walk-between ground, grid-finished and propped, so the doorway
 * view gets the joke at once — the left hero sunk to the knees facing the
 * wall, the right hero standing on the plane facing the mark.
 */

const CHARACTER_HEIGHT = 1.7;

function makeRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export const room: RoomDefinition = {
  sourceId: 11,
  skill: 'ai-3d-asset-generation-loop',
  title: 'Scaffold first, generate the hero',
  summary:
    'The world is scaffolded in code first; the generated hero is then measured, rescaled, re-seated on the contact plane and faced onto the verb axis.',
  kind: 'webgpu',
  limitation:
    'Opinion post, no repository or licence; no generator invoked and no GLB produced — the hero is locally authored with deliberately wrong scale, pivot and facing. The before half shares the measured scale so the pair fits one frame; its pivot and facing stay as generated.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const root = new T.Group();
    root.name = 'source-11-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    const halfX = 3.4;
    const halfZ = 1.4;

    const heroMat = track(new T.MeshStandardMaterial({ color: 0xb46a3f, roughness: 0.6 }));
    const groundMat = track(new T.MeshStandardMaterial({ color: 0x53614a, roughness: 0.95 }));
    const propMat = track(new T.MeshStandardMaterial({ color: 0x6d5b46, roughness: 0.9 }));
    const verbMat = track(new T.MeshBasicMaterial({ color: 0xe0c15a, side: T.DoubleSide, toneMapped: false }));

    const bodyGeo = track(new T.BoxGeometry(0.55, 1.35, 0.37));
    const headGeo = track(new T.SphereGeometry(0.28, 10, 8));
    const noseGeo = track(new T.ConeGeometry(0.12, 0.3, 8));
    const groundGeo = track(new T.PlaneGeometry(6.4, 8));
    groundGeo.rotateX(-Math.PI / 2);
    const propGeo = track(new T.BoxGeometry(0.37, 0.62, 0.37));
    const verbGeo = track(new T.RingGeometry(0.5, 0.62, 20));
    verbGeo.rotateX(-Math.PI / 2);

    // The "generated hero": deliberately mis-authored in the three usual ways
    // — centimetre-scale units, pivot at its centroid, facing +X.
    function buildHero(): THREE.Group {
      const hero = new T.Group();
      const body = new T.Mesh(bodyGeo, heroMat);
      hero.add(body);
      const head = new T.Mesh(headGeo, heroMat);
      head.position.y = 0.92;
      hero.add(head);
      const nose = new T.Mesh(noseGeo, heroMat);
      nose.rotation.z = -Math.PI / 2;
      nose.position.set(0.37, 0.92, 0);
      nose.name = 'hero-forward-marker';
      hero.add(nose);
      // Authored ~30x too large, like a centimetre asset in a metre world.
      hero.scale.setScalar(30);
      return hero;
    }

    function buildPlot(seed: number): THREE.Group {
      const plot = new T.Group();
      const ground = new T.Mesh(groundGeo, groundMat);
      ground.name = 'code-scaffolded-ground';
      plot.add(ground);
      const rng = makeRng(seed);
      for (let i = 0; i < 5; i += 1) {
        const prop = new T.Mesh(propGeo, propMat);
        prop.position.set((rng() - 0.5) * 4.8, 0.31, (rng() - 0.5) * 6.4);
        prop.rotation.y = rng() * Math.PI;
        plot.add(prop);
      }
      // The verb: a marked interaction volume the hero must face and reach.
      const mark = new T.Mesh(verbGeo, verbMat);
      mark.position.set(0, 0.02, -1.7);
      mark.name = 'verb:interact-here';
      plot.add(mark);
      return plot;
    }

    const naivePlot = buildPlot(ctx.seed);
    naivePlot.position.set(-halfX, 0, halfZ);
    const fixedPlot = buildPlot(ctx.seed);
    fixedPlot.position.set(halfX, 0, halfZ);
    root.add(naivePlot, fixedPlot);
    const naiveHero = buildHero();
    naivePlot.add(naiveHero);
    // Framing honesty: the as-generated hero is ~30x too tall and would collapse
    // any shared frame onto one half. Normalise ONLY its scale by the same
    // measured factor the full pass applies, so both halves read; pivot and
    // facing stay exactly as generated (sunk and sideways).
    const naiveBounds = new T.Box3().setFromObject(naiveHero);
    const naiveSize = new T.Vector3();
    naiveBounds.getSize(naiveSize);
    naiveHero.scale.setScalar(CHARACTER_HEIGHT / Math.max(1e-6, naiveSize.y));
    naiveHero.updateMatrixWorld(true);

    const fixedHero = buildHero();
    fixedPlot.add(fixedHero);
    // The harmonisation the post skips: measure, scale, re-seat, face.
    const bounds = new T.Box3().setFromObject(fixedHero);
    const size = new T.Vector3();
    bounds.getSize(size);
    fixedHero.scale.setScalar(CHARACTER_HEIGHT / Math.max(1e-6, size.y));
    fixedHero.updateMatrixWorld(true);
    const scaled = new T.Box3().setFromObject(fixedHero);
    fixedHero.position.y -= scaled.min.y;
    // Face the asset's +X nose onto the plot's -Z verb mark (+PI/2 carries +X
    // to -Z). The demo's -PI/2 claims the same alignment but lands the nose on
    // +Z; here the mark sits door-side, so the sign matters.
    fixedHero.rotation.y = Math.PI / 2;

    return {
      root,
      update: (time: number) => {
        // Both heroes walk toward their verb mark. Only the harmonised one
        // arrives standing on the ground and facing it.
        const t = (Math.sin(time * 0.6) + 1) / 2;
        naiveHero.position.z = -t * 1.5;
        fixedHero.position.z = -t * 1.5;
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
