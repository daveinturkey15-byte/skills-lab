import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 6 — image to procedural Three.js model: the contract, not the mesh.
 * Re-staged from `src/lab/demos/group-a/source-06.ts`: the same
 * ObjectSculptSpec shape (six components, three sockets, one collider
 * compound, two-plus destruction groups, declared budgets), the same
 * `sculptRuntime` hierarchy on `root.userData`, and the same action-ready
 * gate. What changed is address: the demo's half-metre pair becomes two
 * 5x jerry cans (~2.3 m) on plinths, with the declared sockets drawn as
 * brass markers, the collider as a wire volume, and the gate verdict as two
 * verdict bars — green PASS against red FAIL — tall enough to read from the
 * door. The reusable atom was never "a mesh from a picture"; it is the gate
 * that refuses a good-looking model a game cannot use.
 */

type ComponentSpec = {
  name: string;
  size: [number, number, number];
  at: [number, number, number];
  material: 'steel' | 'rubber' | 'paint';
  destructionGroup: string;
};

type SocketSpec = {
  name: string;
  at: [number, number, number];
  aim: [number, number, number];
};

const COMPONENTS: readonly ComponentSpec[] = [
  { name: 'body', size: [0.3, 0.38, 0.15], at: [0, 0.19, 0], material: 'paint', destructionGroup: 'shell' },
  { name: 'rib-left', size: [0.03, 0.3, 0.16], at: [-0.09, 0.2, 0], material: 'steel', destructionGroup: 'shell' },
  { name: 'rib-right', size: [0.03, 0.3, 0.16], at: [0.09, 0.2, 0], material: 'steel', destructionGroup: 'shell' },
  { name: 'spout', size: [0.07, 0.08, 0.07], at: [0.1, 0.42, 0], material: 'steel', destructionGroup: 'spout' },
  { name: 'handle-bar', size: [0.26, 0.03, 0.04], at: [0, 0.42, 0], material: 'steel', destructionGroup: 'handle' },
  { name: 'foot', size: [0.32, 0.02, 0.17], at: [0, 0.01, 0], material: 'rubber', destructionGroup: 'shell' },
];

const SOCKETS: readonly SocketSpec[] = [
  { name: 'grip', at: [0, 0.44, 0], aim: [0, 1, 0] },
  { name: 'pour', at: [0.13, 0.45, 0], aim: [1, 0.3, 0] },
  { name: 'ground', at: [0, 0, 0], aim: [0, -1, 0] },
];

const COLLIDER = { half: [0.17, 0.23, 0.09] as [number, number, number], at: [0, 0.23, 0] as [number, number, number] };
const PROP_SCALE = 5;

const TINT = { steel: 0x9aa0a6, rubber: 0x2b2b2d, paint: 0x557a41 } as const;

function gate(group: THREE.Object3D): { pass: boolean; failures: string[] } {
  const failures: string[] = [];
  const runtime = (group.userData as Record<string, unknown>).sculptRuntime as
    | { sockets: Record<string, unknown>; colliders: unknown[]; destructionGroups: Record<string, unknown>; nodes: Record<string, unknown> }
    | undefined;
  if (!runtime) failures.push('no root.userData.sculptRuntime');
  else {
    if (Object.keys(runtime.sockets).length === 0) failures.push('no sockets');
    if (runtime.colliders.length === 0) failures.push('no colliders');
    if (Object.keys(runtime.destructionGroups).length < 2) failures.push('fewer than two destruction groups');
    if (Object.keys(runtime.nodes).length === 0) failures.push('no named nodes');
  }
  return { pass: failures.length === 0, failures };
}

export const room: RoomDefinition = {
  sourceId: 6,
  skill: 'img2threejs',
  title: 'Image to procedural model contract',
  summary:
    'A declared ObjectSculptSpec, a code-only factory, and an action-ready gate over pivots, sockets, colliders and destruction groups.',
  kind: 'webgpu',
  limitation:
    'No reference image, vision probe or upstream material gate was run — the spec was authored by hand to the documented shape, and one image cannot establish hidden geometry, so this lane stays static hard-surface props, never deforming characters.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const root = new T.Group();
    root.name = 'source-06-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    const steelMat = track(new T.MeshStandardMaterial({ color: TINT.steel, roughness: 0.38, metalness: 0.85 }));
    const rubberMat = track(new T.MeshStandardMaterial({ color: TINT.rubber, roughness: 0.95 }));
    const paintMat = track(new T.MeshStandardMaterial({ color: TINT.paint, roughness: 0.72, metalness: 0.02 }));
    const socketMat = track(
      new T.MeshStandardMaterial({ color: 0xd8a13a, emissive: 0x6a4a10, roughness: 0.4 }),
    );
    const plinthMat = track(new T.MeshStandardMaterial({ color: 0x3a4046, roughness: 0.9 }));
    const failMat = track(
      new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xc0392b, emissiveIntensity: 1.6, roughness: 0.6 }),
    );
    const passMat = track(
      new T.MeshStandardMaterial({ color: 0x000000, emissive: 0x2f8f5b, emissiveIntensity: 1.6, roughness: 0.6 }),
    );

    const halfX = 3.1;
    const halfZ = 1.8;
    const plinthGeo = track(new T.BoxGeometry(2.6, 0.5, 2.2));
    const barGeo = track(new T.BoxGeometry(0.5, 3.4, 0.5));
    const markerGeo = track(new T.SphereGeometry(0.09, 10, 8));
    const probeGeo = track(new T.ConeGeometry(0.15, 0.6, 8));
    const colliderGeo = track(new T.BoxGeometry(COLLIDER.half[0] * 2, COLLIDER.half[1] * 2, COLLIDER.half[2] * 2));

    function buildProp(withRuntime: boolean): THREE.Group {
      const group = new T.Group();
      const nodes: Record<string, THREE.Object3D> = {};
      const destructionGroups: Record<string, string[]> = {};
      for (const component of COMPONENTS) {
        const mesh = new T.Mesh(
          track(new T.BoxGeometry(component.size[0], component.size[1], component.size[2])),
          component.material === 'steel' ? steelMat : component.material === 'rubber' ? rubberMat : paintMat,
        );
        mesh.name = component.name;
        mesh.position.set(component.at[0], component.at[1], component.at[2]);
        group.add(mesh);
        nodes[component.name] = mesh;
        (destructionGroups[component.destructionGroup] ||= []).push(component.name);
      }
      if (withRuntime) {
        const sockets: Record<string, THREE.Object3D> = {};
        for (const socket of SOCKETS) {
          const anchor = new T.Object3D();
          anchor.name = `socket:${socket.name}`;
          anchor.position.set(socket.at[0], socket.at[1], socket.at[2]);
          anchor.lookAt(
            socket.at[0] + socket.aim[0],
            socket.at[1] + socket.aim[1],
            socket.at[2] + socket.aim[2],
          );
          const marker = new T.Mesh(markerGeo, socketMat);
          anchor.add(marker);
          group.add(anchor);
          sockets[socket.name] = anchor;
        }
        const collider = new T.Mesh(
          colliderGeo,
          track(new T.MeshBasicMaterial({ color: 0x7fd4c1, wireframe: true, transparent: true, opacity: 0.8 })),
        );
        collider.name = 'collider:body-box';
        collider.position.set(COLLIDER.at[0], COLLIDER.at[1], COLLIDER.at[2]);
        group.add(collider);
        group.userData.sculptRuntime = {
          nodes,
          sockets,
          colliders: [{ name: 'body-box', half: COLLIDER.half, at: COLLIDER.at }],
          destructionGroups,
        };
      }
      group.scale.setScalar(PROP_SCALE);
      return group;
    }

    const ungated = buildProp(false);
    ungated.name = 'before:mesh-only-no-sculpt-runtime';
    ungated.position.set(-halfX, 0.5, halfZ);
    const gated = buildProp(true);
    gated.name = 'after:spec-plus-sculptRuntime';
    gated.position.set(halfX, 0.5, halfZ);
    root.add(ungated, gated);

    // Something attached to the declared socket: the point of having one. It
    // bobs to prove the socket carries an orientation, not just a position.
    const runtime = (gated.userData.sculptRuntime as { sockets: Record<string, THREE.Object3D> });
    const probe = new T.Mesh(probeGeo, socketMat);
    probe.name = 'socket-probe';
    probe.rotation.x = Math.PI / 2;
    probe.position.z = 0.3;
    runtime.sockets.pour.add(probe);

    // The verdicts, wall-sized: a red FAIL bar behind the mesh-only half, a
    // green PASS bar behind the gated half.
    const beforeReport = gate(ungated);
    const afterReport = gate(gated);
    const failBar = new T.Mesh(barGeo, beforeReport.pass ? passMat : failMat);
    failBar.position.set(-halfX, 1.7, halfZ + 2.6);
    const passBar = new T.Mesh(barGeo, afterReport.pass ? passMat : failMat);
    passBar.position.set(halfX, 1.7, halfZ + 2.6);
    root.add(failBar, passBar);

    for (const x of [-halfX, halfX]) {
      const plinth = new T.Mesh(plinthGeo, plinthMat);
      plinth.position.set(x, 0.25, halfZ);
      root.add(plinth);
    }

    return {
      root,
      update: (time: number) => {
        probe.position.z = 0.3 + Math.sin(time * 1.6) * 0.25;
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
