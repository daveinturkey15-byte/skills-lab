/**
 * Source 43 — Lumera: keep lighting a PARAMETER, not a baked property.
 *
 * Canonical: none usable. A paper page with code and weights marked "Soon";
 * nothing to pin, nothing to licence-check, nothing to run. The register exists
 * partly to stop this row being re-evaluated as if it were adoptable, and this
 * lane confirms the state rather than assuming it: the paper page fetched at
 * 1,087 B on 2026-09-12 (see SOURCE_RESEARCH.json), and no code or weights
 * release was found.
 *
 * So no image-to-3D reconstruction is performed or simulated here. What IS free
 * and real is the transferable principle the register names: when you rebuild a
 * scene from a reference, keep objects SEPARABLE and keep lighting as ENGINE
 * PARAMETERS rather than baked into the surface.
 *
 * BEFORE is the usual image-to-3D outcome: one merged mesh with the lighting
 * baked into its vertex colours. AFTER is the same scene as separable objects
 * lit by a real, movable light. `update` moves the light: the after panel
 * responds and the before panel cannot, because its lighting is already paint.
 * That non-response is the whole demonstration.
 *
 * This is the one demo in group C that requires a local light — the technique
 * is precisely "lighting is a live parameter" — and it is declared in metadata.
 */

import {
  beforeAfterPanels,
  countDraws,
  disposeTree,
  paintVertices,
  type Demo,
  type DemoContext,
} from './shared';

type Prop = {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  albedo: [number, number, number];
};

const PROPS: readonly Prop[] = [
  { name: 'crate', position: [-0.77, 0.31, 0.17], size: [0.61, 0.61, 0.61], albedo: [0.55, 0.42, 0.28] },
  { name: 'barrel', position: [0.51, 0.37, -0.43], size: [0.51, 0.75, 0.51], albedo: [0.32, 0.38, 0.34] },
  { name: 'panel', position: [0.09, 0.51, 0.94], size: [1.19, 1.02, 0.1], albedo: [0.48, 0.48, 0.5] },
  { name: 'block', position: [1.05, 0.2, 0.6], size: [0.41, 0.41, 0.41], albedo: [0.6, 0.3, 0.26] },
];

/** The bake the after-panel refuses: irradiance folded into the albedo. */
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

export function createDemo(context: DemoContext): Demo {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-43-lighting-as-parameter';
  const { before, after } = beforeAfterPanels(THREE, 3.0);
  // Ground boards: contact read and frame area under both panels alike.
  for (const panel of [before, after]) {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.1, 2.6),
      // Mid slate, distinct from the host backdrop — a stage that merges with
      // the background reads as void and inflates the empty-frame share.
      new THREE.MeshStandardMaterial({ color: 0x3d454f, roughness: 0.95 }),
    );
    board.position.y = -0.05;
    board.name = 'stage-board';
    panel.add(board);
  }

  // The light position the BEFORE panel was baked at, once, and forever.
  const BAKE_POSITION: readonly [number, number, number] = [-1.53, 1.87, 1.02];

  // BEFORE — one merged mesh. The props are not separable: they share a single
  // geometry and their lighting is vertex paint.
  const mergedParts: import('three').BufferGeometry[] = [];
  for (const prop of PROPS) {
    const geometry = new THREE.BoxGeometry(prop.size[0], prop.size[1], prop.size[2], 2, 2, 2);
    geometry.translate(prop.position[0], prop.position[1], prop.position[2]);
    paintVertices(THREE, geometry, (x, y, z) => bakedShade(prop.albedo, x, y, z, BAKE_POSITION));
    // BoxGeometry is indexed; a manual attribute concat that drops the index
    // renders soup, not boxes. De-index first — still one mesh, one draw.
    const soup = geometry.toNonIndexed();
    geometry.dispose();
    mergedParts.push(soup);
  }
  // Merge by concatenating attributes: one mesh, one draw, nothing addressable.
  let mergedVertexCount = 0;
  for (const part of mergedParts) mergedVertexCount += part.getAttribute('position').count;
  const mergedPositions = new Float32Array(mergedVertexCount * 3);
  const mergedColours = new Float32Array(mergedVertexCount * 3);
  const mergedNormals = new Float32Array(mergedVertexCount * 3);
  let cursor = 0;
  for (const part of mergedParts) {
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
  const mergedGeometry = new THREE.BufferGeometry();
  mergedGeometry.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  mergedGeometry.setAttribute('color', new THREE.BufferAttribute(mergedColours, 3));
  mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
  const mergedMesh = new THREE.Mesh(
    mergedGeometry,
    // Unlit-by-intent: the colour IS the lighting, which is the defect.
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  mergedMesh.name = 'baked-merged-reconstruction';
  // Never culled: a hand-merged buffer must not depend on an auto-computed
  // bound to stay in frame, and the host fits to visible geometry.
  mergedMesh.frustumCulled = false;
  before.add(mergedMesh);

  // AFTER — separable objects with plain albedo, lit by a parameter.
  for (const prop of PROPS) {
    const geometry = new THREE.BoxGeometry(prop.size[0], prop.size[1], prop.size[2]);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(prop.albedo[0], prop.albedo[1], prop.albedo[2]),
        roughness: 0.82,
        metalness: 0.03,
      }),
    );
    mesh.name = `separable-${prop.name}`;
    mesh.position.set(prop.position[0], prop.position[1], prop.position[2]);
    after.add(mesh);
  }

  const light = new THREE.PointLight(0xfff0d8, 3.2, 8, 2);
  light.name = 'reconstructed-key-light';
  light.position.set(BAKE_POSITION[0], BAKE_POSITION[1], BAKE_POSITION[2]);
  after.add(light);

  root.add(before, after);
  const draws = countDraws(root);

  let elapsed = 0;
  return {
    root,
    update: (_time: number, dt: number) => {
      // Move the parameter. Only one panel can follow it.
      elapsed += dt;
      const angle = elapsed * 0.7;
      light.position.set(Math.cos(angle) * 1.7, 1.87, Math.sin(angle) * 1.53);
    },
    dispose: () => disposeTree(root),
    metadata: {
      sourceId: 43,
      title: 'Lighting kept as a movable parameter, objects kept separable',
      method:
        'The same four props are built twice: once merged into a single mesh with irradiance '
        + 'baked into vertex colour and an unlit material, and once as separately addressable '
        + 'meshes carrying plain albedo and lit by a real point light. Moving the light at '
        + 'runtime relights the separable scene and leaves the baked one unchanged, which is the '
        + 'difference the principle is about.',
      adaptation: 'adapted',
      sources: [
        'https://x.com/stefan_3d_ai/status/2093937170717585657',
        'https://haidilao0328.github.io/Lumera/',
      ],
      limitation:
        'NO image-to-3D reconstruction happens here and none is simulated: Lumera has no released '
        + 'code and no weights, so there is nothing to run, pin or licence-check, and nothing '
        + 'about its method is claimed. No image is read, no object is detected, no HDR '
        + 'environment is estimated. This demonstrates only the transferable principle, on a '
        + 'scene authored by this file. Note the standing tension the register records: this is '
        + 'an image-to-asset route, while Map 3 is testing whether maths-and-code beats importing '
        + 'assets at all.',
      localLights: ['reconstructed-key-light'],
      counters: {
        props: PROPS.length,
        separableObjects: PROPS.length,
        bakedMeshes: 1,
        liveLights: 1,
        meshes: draws.meshes,
      },
    },
  };
}

export default createDemo;
