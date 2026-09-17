/**
 * Source 51, D1 — raymarched storm cloud: one anvil cumulonimbus, warm low
 * sun, dark sky.
 *
 * The volume is marched on the CPU at construction (bakeCloud: layered
 * value/Worley noise written for this file, an erosion term that keeps the
 * anvil cap flat, Beer-Lambert extinction on the view ray, a short light
 * march toward the sun, Henyey-Greenstein phase for the rim). The exhibit is
 * the baked billboard inside a wire frame of the marched box, over a gradient
 * sky with the sun disc that lit the march placed where the march assumed it.
 * The shipping form is the same march per fragment in TSL; the bake is the
 * no-GPU substitution and the limitation owns it.
 */

import type {
  DemoComparison,
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import { CLOUD_PARAMS, bakeCloud } from './cloud-field';
import { disposeTree, paintVerticalGradient } from './shared';

export const SOURCE_URLS = [
  'https://x.com/zackontopx/status/2100183743436890237',
] as const;

/** Bake resolution; the construction-cost control next to step count. */
export const BAKE_WIDTH = 96;
export const BAKE_HEIGHT = 128;

/** Whole-tower advection in UV per second; the only motion in the demo. */
const TOWER_DRIFT = 0.004;

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-51-raymarched-anvil';

  const baked = bakeCloud(BAKE_WIDTH, BAKE_HEIGHT, CLOUD_PARAMS);
  const bytes = new Uint8Array(baked.buffer, baked.byteOffset, baked.byteLength);
  const cloudTexture = new THREE.DataTexture(
    bytes,
    BAKE_WIDTH,
    BAKE_HEIGHT,
    THREE.RGBAFormat,
  );
  cloudTexture.colorSpace = THREE.SRGBColorSpace;
  cloudTexture.minFilter = THREE.LinearFilter;
  cloudTexture.magFilter = THREE.LinearFilter;
  cloudTexture.needsUpdate = true;

  // Gradient sky, dark slate overhead warming toward the sun's horizon.
  const skyGeometry = new THREE.PlaneGeometry(36, 19);
  paintVerticalGradient(
    THREE,
    skyGeometry,
    [0.3, 0.19, 0.13],
    [0.045, 0.06, 0.1],
  );
  const sky = new THREE.Mesh(
    skyGeometry,
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  sky.name = 'storm-sky';
  sky.position.set(0, 6, -7);
  root.add(sky);

  // The marching sun, drawn where the bake assumed it: low, left, behind.
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.6, 0.33) }),
  );
  sun.name = 'low-sun';
  sun.position.set(-7.6, 2.4, -6.5);
  root.add(sun);

  // Dark water strip so the tower stands on a horizon, not on void.
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.06, 0.085) }),
  );
  sea.name = 'dark-water';
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.42, 3);
  root.add(sea);

  const cloud = new THREE.Mesh(
    new THREE.PlaneGeometry(6.9, 9.2),
    new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true }),
  );
  cloud.name = 'anvil-billboard';
  cloud.position.set(0, 4.1, 0);
  root.add(cloud);

  // The marched box, drawn so the billboard reads as a volume slice, not a poster.
  const volumeEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(6.8, 8.2, 5.2)),
    new THREE.LineBasicMaterial({
      color: new THREE.Color(0.42, 0.52, 0.62),
      transparent: true,
      opacity: 0.45,
    }),
  );
  volumeEdges.name = 'marched-volume';
  volumeEdges.position.set(0, 4.1, 0);
  root.add(volumeEdges);

  let elapsed = 0;
  const comparison: DemoComparison = {
    control: 'Empty volume (wire frame only)',
    technique: 'Raymarched anvil inside the same volume',
    controlPosition: 'left',
  };

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 51,
    title: 'Cumulus congestus turret-stack: CPU-baked raymarch with light march and HG rim',
    method:
      'Layered value/Worley density written for this demo, marched '
      + 'front-to-back with Beer-Lambert extinction, a '
      + `${CLOUD_PARAMS.lightSteps}-step light march toward a low warm sun at each occupied `
      + 'sample, and a Henyey-Greenstein phase term that silvers thin forward-lit '
      + 'edges. The bake is shown as a billboard inside a wire frame of the exact '
      + 'marched box, with the sun disc drawn where the march assumed it.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'CPU bake, not a live GPU raymarch: '
      + `${BAKE_WIDTH}x${BAKE_HEIGHT} texels at ${CLOUD_PARAMS.steps} view steps (see notes for the measured `
      + 'milliseconds) with no temporal reprojection and no animation beyond whole-tower '
      + 'advection of the static bake. Step count and density are construction constants '
      + '(exported CLOUD_PARAMS), not live controls — the host offers no per-demo parameter '
      + 'surface. A live fragment version holds 60fps only at a reduced step count this lane '
      + 'could not measure, so no such claim is made here. Shaping mismatch owned: the density '
      + 'field still flares to a flat anvil cap (column radius more than triples above y≈4.4 '
      + 'with a flat top cut) while the reference frames show a cumulus congestus turret-stack '
      + 'of roughly constant width with no anvil spread — the silhouette reads as an anvil, '
      + 'not the referenced stack.',
    comparison,
    counters: {
      bakeWidth: BAKE_WIDTH,
      bakeHeight: BAKE_HEIGHT,
      viewSteps: CLOUD_PARAMS.steps,
      lightSteps: CLOUD_PARAMS.lightSteps,
      meshes: 4,
      lines: 1,
    },
  };

  return {
    root,
    update: (_time: number, dt: number) => {
      // Advect the finished bake; nothing is re-marched after construction.
      elapsed += dt;
      cloudTexture.offset.x = (elapsed * TOWER_DRIFT) % 1;
    },
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
