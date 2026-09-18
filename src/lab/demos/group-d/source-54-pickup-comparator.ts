/**
 * Source 54 — DeepSeek V4.1 Flash authoring a pickup truck in Blender (comparator).
 *
 * The catalogue row is a comparator: the poster claims a model authored a
 * mechanically detailed truck in Blender, but no prompt log, session recording
 * or source exists to build from, so the claim itself is unverified. Frames
 * verify only that a Blender truck scene with underbody detail exists.
 *
 * What this exhibit does is make the COMPARATOR mechanical with our own
 * geometry: the atoms the catalogue names as the hard part — a many-part
 * hierarchy and a modelled underbody (exhaust, suspension, driveshaft,
 * chassis rails, tyred wheels). A rolling chassis (frame and running gear,
 * no shell) stands beside the same chassis dressed with a body, the way the
 * smart-mesh ladder stages two densities. Named groups throughout, the way a
 * generated scene's outliner would list them. Nothing here is vendor output.
 */

import type {
  DemoContext,
  DemoInstance,
} from '../../types';
import type * as THREE_NS from 'three';
import { disposeTree } from './shared';

export const SOURCE_URLS = [
  'https://x.com/victormustar/status/2099226451568435605',
  'https://www.deepseek.com/news/deepseek-v4-1-flash/',
] as const;

type Three = DemoContext['THREE'];

const paint = (THREE: Three) =>
  new THREE.MeshStandardMaterial({ color: 0x7d2a24, roughness: 0.35, metalness: 0.15 });
const steelDark = (THREE: Three) =>
  new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.7, metalness: 0.4 });
const steel = (THREE: Three) =>
  new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.8 });
const rubber = (THREE: Three) =>
  new THREE.MeshStandardMaterial({ color: 0x1d1f21, roughness: 0.95, metalness: 0 });
const glass = (THREE: Three) =>
  new THREE.MeshStandardMaterial({ color: 0x9fc4d4, roughness: 0.12, metalness: 0.85 });
const lamp = (THREE: Three) =>
  new THREE.MeshBasicMaterial({ color: 0xffe9b0, toneMapped: false });

function box(
  THREE: Three,
  parent: THREE_NS.Object3D,
  material: THREE_NS.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  name: string,
): THREE_NS.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function tube(
  THREE: Three,
  parent: THREE_NS.Object3D,
  material: THREE_NS.Material,
  radius: number,
  length: number,
  segments: number,
  x: number,
  y: number,
  z: number,
  name: string,
  axis: 'x' | 'z' = 'x',
): THREE_NS.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, segments),
    material,
  );
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

/** Frame rails, axles, running gear and underbody. No shell: the hard part, inspectable. */
function buildRollingChassis(
  THREE: Three,
  paintMat: THREE_NS.Material,
  darkMat: THREE_NS.Material,
  steelMat: THREE_NS.Material,
  rubberMat: THREE_NS.Material,
): { group: THREE_NS.Group; wheels: THREE_NS.Object3D[] } {
  const chassis = new THREE.Group();
  chassis.name = 'chassis';
  void paintMat;

  const frame = new THREE.Group();
  frame.name = 'frame';
  chassis.add(frame);
  box(THREE, frame, darkMat, 3.6, 0.18, 0.12, 0, 0.75, 0.42, 'frame-rail-L');
  box(THREE, frame, darkMat, 3.6, 0.18, 0.12, 0, 0.75, -0.42, 'frame-rail-R');
  for (let i = 0; i < 3; i += 1) {
    box(THREE, frame, darkMat, 0.12, 0.12, 0.9, -1.2 + i * 1.2, 0.75, 0, `crossmember-${i}`);
  }

  const gear = new THREE.Group();
  gear.name = 'running-gear';
  chassis.add(gear);
  tube(THREE, gear, steelMat, 0.06, 1.7, 10, 1.25, 0.42, 0, 'front-axle', 'z');
  tube(THREE, gear, steelMat, 0.06, 1.7, 10, -1.25, 0.42, 0, 'rear-axle', 'z');
  tube(THREE, gear, steelMat, 0.05, 1.9, 10, 0, 0.55, 0.15, 'driveshaft');
  const diff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), darkMat);
  diff.position.set(-1.25, 0.42, 0);
  diff.name = 'rear-differential';
  gear.add(diff);

  const exhaust = new THREE.Group();
  exhaust.name = 'exhaust';
  gear.add(exhaust);
  tube(THREE, exhaust, steelMat, 0.045, 1.2, 8, 0.6, 0.5, -0.25, 'downpipe');
  box(THREE, exhaust, steelMat, 0.55, 0.22, 0.24, -0.5, 0.48, -0.25, 'muffler');
  tube(THREE, exhaust, steelMat, 0.04, 0.7, 8, -1.2, 0.48, -0.25, 'tailpipe');

  for (const [sx, sz, tag] of [[1.25, 0.5, 'FL'], [1.25, -0.5, 'FR'], [-1.25, 0.5, 'RL'], [-1.25, -0.5, 'RR']] as const) {
    box(THREE, gear, darkMat, 0.5, 0.07, 0.12, sx, 0.62, sz * 0.82, `suspension-arm-${tag}`);
  }
  box(THREE, gear, darkMat, 0.7, 0.3, 0.5, -0.4, 0.62, 0.45, 'fuel-tank');
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 16), rubberMat);
  spare.rotation.x = Math.PI / 2;
  spare.position.set(-1.7, 0.55, 0);
  spare.name = 'spare-tyre';
  gear.add(spare);

  const wheels: THREE_NS.Object3D[] = [];
  for (const [wx, wz, tag] of [[1.25, 0.85, 'FL'], [1.25, -0.85, 'FR'], [-1.25, 0.85, 'RL'], [-1.25, -0.85, 'RR']] as const) {
    const pivot = new THREE.Group();
    pivot.name = `wheel-${tag}`;
    pivot.position.set(wx, 0.42, wz);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18), rubberMat);
    tyre.rotation.x = Math.PI / 2;
    tyre.name = `tyre-${tag}`;
    pivot.add(tyre);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12), steelMat);
    hub.rotation.x = Math.PI / 2;
    hub.name = `hub-${tag}`;
    pivot.add(hub);
    gear.add(pivot);
    wheels.push(pivot);
  }
  return { group: chassis, wheels };
}

/** Shell over a chassis: hood, cab, bed, glass, trim. The easy recognisable half. */
function dressTruck(
  THREE: Three,
  chassis: THREE_NS.Group,
  paintMat: THREE_NS.Material,
  darkMat: THREE_NS.Material,
  glassMat: THREE_NS.Material,
  lampMat: THREE_NS.Material,
): void {
  const shell = new THREE.Group();
  shell.name = 'body-shell';
  chassis.add(shell);
  box(THREE, shell, paintMat, 0.95, 0.42, 1.5, 1.35, 1.15, 0, 'hood');
  box(THREE, shell, paintMat, 1.25, 0.85, 1.6, 0.25, 1.35, 0, 'cab');
  box(THREE, shell, paintMat, 1.1, 0.12, 1.7, 0.25, 1.82, 0, 'roof');
  box(THREE, shell, glassMat, 0.5, 0.5, 1.5, 0.95, 1.45, 0, 'windshield');
  box(THREE, shell, paintMat, 1.7, 0.5, 0.1, -1.05, 1.2, 0.8, 'bed-wall-L');
  box(THREE, shell, paintMat, 1.7, 0.5, 0.1, -1.05, 1.2, -0.8, 'bed-wall-R');
  box(THREE, shell, paintMat, 1.7, 0.08, 1.6, -1.05, 0.98, 0, 'bed-floor');
  box(THREE, shell, paintMat, 0.1, 0.5, 1.6, -1.95, 1.2, 0, 'tailgate');
  box(THREE, shell, darkMat, 0.25, 0.3, 1.5, 1.9, 0.85, 0, 'grille');
  box(THREE, shell, darkMat, 0.2, 0.22, 1.8, 1.95, 0.55, 0, 'bumper-F');
  box(THREE, shell, darkMat, 0.2, 0.22, 1.8, -2.0, 0.55, 0, 'bumper-R');
  box(THREE, shell, lampMat, 0.08, 0.16, 0.3, 1.92, 1.0, 0.55, 'headlight-L');
  box(THREE, shell, lampMat, 0.08, 0.16, 0.3, 1.92, 1.0, -0.55, 'headlight-R');
  for (const [fx, fz, tag] of [[1.25, 0.85, 'FL'], [1.25, -0.85, 'FR'], [-1.25, 0.85, 'RL'], [-1.25, -0.85, 'RR']] as const) {
    box(THREE, shell, paintMat, 1.0, 0.18, 0.42, fx, 0.95, fz, `fender-${tag}`);
  }
  box(THREE, shell, paintMat, 0.08, 0.12, 0.2, 0.75, 1.6, 0.9, 'mirror-L');
  box(THREE, shell, paintMat, 0.08, 0.12, 0.2, 0.75, 1.6, -0.9, 'mirror-R');
}

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-54-pickup-comparator';

  const paintMat = paint(THREE);
  const darkMat = steelDark(THREE);
  const steelMat = steel(THREE);
  const rubberMat = rubber(THREE);
  const glassMat = glass(THREE);
  const lampMat = lamp(THREE);

  const bare = buildRollingChassis(THREE, paintMat, darkMat, steelMat, rubberMat);
  bare.group.position.x = -2.4;
  bare.group.name = 'staging-rolling-chassis';
  const dressed = buildRollingChassis(THREE, paintMat, darkMat, steelMat, rubberMat);
  dressed.group.position.x = 2.4;
  dressed.group.name = 'staging-dressed-truck';
  dressTruck(THREE, dressed.group, paintMat, darkMat, glassMat, lampMat);

  const stage = new THREE.Mesh(
    new THREE.CircleGeometry(4.9, 48),
    new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.92 }),
  );
  stage.rotation.x = -Math.PI / 2;
  stage.position.y = 0.002;
  stage.name = 'stage-disc';

  root.add(bare.group, dressed.group, stage);

  let parts = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) parts += 1;
  });
  root.userData.partCounts = { meshes: parts, spinningWheels: bare.wheels.length };

  return {
    root,
    update: (_time: number, dt: number) => {
      // The running gear turns: the one motion a chassis owns standing still.
      const clamped = Math.min(Math.max(dt, 0), 0.1);
      for (const wheel of bare.wheels) wheel.rotation.z -= clamped * 0.8;
    },
    dispose: () => disposeTree(root),
    metadata: {
      sourceId: 54,
      title: 'Pickup truck in code: many-part hierarchy with a modelled underbody (comparator)',
      method:
        'Comparator atoms restated as an authored exhibit: a rolling chassis — frame rails, '
        + 'crossmembers, axles, driveshaft, differential, exhaust, tank, suspension arms, spare '
        + 'and four tyred wheels on spinning hubs — staged beside the same chassis dressed with '
        + 'a shell. Named groups throughout, the way a generated scene outliner would list them.',
      adaptation: 'adapted',
      sources: [...SOURCE_URLS],
      limitation:
        'Comparator only: no model call, no Blender session, no prompt log and no .blend exist '
        + 'here, so the poster claim (a model built it, mechanically accurate) is unverified — '
        + 'frames verify only that a truck scene with this underbody detail exists. Every part '
        + 'is a locally authored box, cylinder or sphere; the many-part hierarchy and the '
        + 'modelled underbody are the quality bar the Blender gauntlet loop is measured against, '
        + 'not vendor output. Mesh counts ride on root.userData.partCounts.',
    },
  };
}

export default createDemo;
