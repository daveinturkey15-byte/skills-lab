import type * as THREE from 'three';
import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 43 — Lumera's transferable principle: keep lighting a PARAMETER, not
 * a baked property. Re-staged from `src/lab/demos/group-c/source-43.ts`: the
 * same four props, the same bake position, the same `bakedShade` irradiance
 * fold. What changed is scale — the demo's 3 m panels become two 5.6 m bays —
 * so a visitor at the door sees the one thing that matters: when the light
 * moves, the right bay relights and the left bay cannot, because its lighting
 * is already paint.
 */

type Prop = {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  albedo: [number, number, number];
};

// Lane-authored scene, in metres; the demo's props scaled for the room.
const PROPS: readonly Prop[] = [
  { name: 'crate', position: [-1.7, 0.68, 0.37], size: [1.34, 1.34, 1.34], albedo: [0.55, 0.42, 0.28] },
  { name: 'barrel', position: [1.12, 0.82, -0.95], size: [1.12, 1.65, 1.12], albedo: [0.32, 0.38, 0.34] },
  { name: 'panel', position: [0.2, 1.12, 2.07], size: [2.62, 2.24, 0.22], albedo: [0.48, 0.48, 0.5] },
  { name: 'block', position: [2.31, 0.45, 1.32], size: [0.9, 0.9, 0.9], albedo: [0.6, 0.3, 0.26] },
];

/** The bake the after bay refuses: irradiance folded into the albedo. */
function bakedShade(
  albedo: readonly [number, number, number],
  x: number,
  y: number,
  z: number,
  lightAt: readonly [number, number, number],
): [number, number, number] {
  const dx = lightAt[0] - x;
  const dy = lightAt[1] - y;
  const dz = lightAt[2] - z;
  const distance = Math.hypot(dx, dy, dz) || 1;
  const falloff = Math.min(1, 2.6 / (distance * distance));
  const lambert = Math.max(0.12, dy / distance);
  const irradiance = 0.22 + falloff * lambert * 1.5;
  return [albedo[0] * irradiance, albedo[1] * irradiance, albedo[2] * irradiance];
}

export const room: RoomDefinition = {
  sourceId: 43,
  skill: 'img2threejs',
  title: 'Lighting as a parameter, not paint',
  summary:
    'The same props twice: merged with lighting baked into vertex colour, and separable under a real light that moves.',
  kind: 'webgpu',
  limitation:
    'Lumera has no released code or weights, so no reconstruction happens or is simulated here — only the transferable principle, on a lane-authored scene. No image is read and no lighting environment is estimated.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const root = new T.Group();
    root.name = 'source-43-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    // Door-side of centre, clear of the through-room world wall at local z=0
    // (this wing carries it: the back half of both bays never reached the
    // door). Boards smaller and closer, so the props read at 2–5 m.
    const bayX = 2.8;
    const bayZ = -3.6;
    const boardGeo = track(new T.BoxGeometry(5.2, 0.12, 4.6));
    const boardMat = track(new T.MeshStandardMaterial({ color: 0x3d454f, roughness: 0.95 }));
    for (const side of [-1, 1]) {
      const board = new T.Mesh(boardGeo, boardMat);
      board.position.set(side * bayX, -0.06, bayZ);
      root.add(board);
    }
    // Light position the BEFORE bay was baked at, once, and forever.
    const BAKE: readonly [number, number, number] = [-3.37, 4.11, 2.24];
    // BEFORE — one merged mesh. Props share a single geometry and their
    // lighting is vertex paint, so nothing is addressable and no light can
    // ever move across them.
    const parts: THREE.BufferGeometry[] = [];
    for (const prop of PROPS) {
      const geometry = new T.BoxGeometry(prop.size[0], prop.size[1], prop.size[2], 2, 2, 2);
      geometry.translate(
        -bayX + prop.position[0],
        prop.position[1],
        bayZ + prop.position[2],
      );
      const positions = geometry.getAttribute('position');
      const colours = new Float32Array(positions.count * 3);
      const v = new T.Vector3();
      for (let i = 0; i < positions.count; i += 1) {
        v.fromBufferAttribute(positions, i);
        // Bake in bay-local coordinates so the paint matches the after bay.
        const [r, g, b] = bakedShade(prop.albedo, v.x + bayX, v.y, v.z - bayZ, BAKE);
        colours[i * 3] = r;
        colours[i * 3 + 1] = g;
        colours[i * 3 + 2] = b;
      }
      geometry.setAttribute('color', new T.BufferAttribute(colours, 3));
      const soup = geometry.toNonIndexed();
      geometry.dispose();
      parts.push(soup);
    }
    let vertexCount = 0;
    for (const part of parts) vertexCount += part.getAttribute('position').count;
    const mergedPositions = new Float32Array(vertexCount * 3);
    const mergedColours = new Float32Array(vertexCount * 3);
    const mergedNormals = new Float32Array(vertexCount * 3);
    let cursor = 0;
    for (const part of parts) {
      const position = part.getAttribute('position');
      const colour = part.getAttribute('color');
      const normal = part.getAttribute('normal');
      for (let i = 0; i < position.count; i += 1) {
        mergedPositions[(cursor + i) * 3] = position.getX(i);
        mergedPositions[(cursor + i) * 3 + 1] = position.getY(i);
        mergedPositions[(cursor + i) * 3 + 2] = position.getZ(i);
        mergedColours[(cursor + i) * 3] = colour.getX(i);
        mergedColours[(cursor + i) * 3 + 1] = colour.getY(i);
        mergedColours[(cursor + i) * 3 + 2] = colour.getZ(i);
        mergedNormals[(cursor + i) * 3] = normal.getX(i);
        mergedNormals[(cursor + i) * 3 + 1] = normal.getY(i);
        mergedNormals[(cursor + i) * 3 + 2] = normal.getZ(i);
      }
      cursor += position.count;
      part.dispose();
    }
    const mergedGeometry = track(new T.BufferGeometry());
    mergedGeometry.setAttribute('position', new T.BufferAttribute(mergedPositions, 3));
    mergedGeometry.setAttribute('color', new T.BufferAttribute(mergedColours, 3));
    mergedGeometry.setAttribute('normal', new T.BufferAttribute(mergedNormals, 3));
    const merged = new T.Mesh(
      mergedGeometry,
      // Unlit by intent: the colour IS the lighting, which is the defect.
      track(new T.MeshBasicMaterial({ vertexColors: true })),
    );
    merged.name = 'baked-merged-reconstruction';
    merged.frustumCulled = false;
    root.add(merged);

    // AFTER — separable objects with plain albedo, lit by a parameter.
    for (const prop of PROPS) {
      const mesh = new T.Mesh(
        track(new T.BoxGeometry(prop.size[0], prop.size[1], prop.size[2])),
        track(
          new T.MeshStandardMaterial({
            color: new T.Color(prop.albedo[0], prop.albedo[1], prop.albedo[2]),
            roughness: 0.82,
            metalness: 0.03,
          }),
        ),
      );
      mesh.position.set(bayX + prop.position[0], prop.position[1], bayZ + prop.position[2]);
      root.add(mesh);
    }
    const light = new T.PointLight(0xfff0d8, 90, 22, 2);
    light.name = 'reconstructed-key-light';
    light.position.set(bayX + BAKE[0], BAKE[1], bayZ + BAKE[2]);
    root.add(light);
    // The parameter made visible: a small bright orb riding the light, so a
    // visitor sees WHY the right bay relights instead of only that it does.
    // Staging only — Lumera estimates lighting; nothing here estimates
    // anything. One mesh, driven by the same orbit below.
    const orb = new T.Mesh(
      track(new T.SphereGeometry(0.22, 16, 12)),
      track(new T.MeshBasicMaterial({ color: 0xffe6b8, toneMapped: false })),
    );
    orb.name = 'light-parameter-orb';
    orb.position.copy(light.position);
    root.add(orb);

    let elapsed = 0;
    return {
      root,
      update: (_t: number, dt: number) => {
        // Move the parameter. Only one bay can follow it.
        elapsed += dt;
        const angle = elapsed * 0.7;
        light.position.set(
          bayX + Math.cos(angle) * 2.6,
          4.1,
          bayZ + Math.sin(angle) * 2.2,
        );
        orb.position.copy(light.position);
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
