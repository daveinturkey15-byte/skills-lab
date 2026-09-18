/**
 * Source 10 — Vibe3D asset registry: registry-of-source-props ingestion gate.
 *
 * Restages the lab demo at human scale: two bays, each with an oil drum and
 * a bollard installed from the same factory. The left bay keeps the pack's
 * own preview light (visible bulb, warm cast) and the as-shipped oversized
 * collider; the right bay passes the gate — host namespace in, preview light
 * stripped, real bounds measured against the declared record with a tight
 * collider. The measured numbers on the right placard are computed from the
 * built meshes, not copied from a comment. Props are locally authored
 * stand-ins; nothing was installed and no upstream source was vendored.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

interface PropRecord {
  declaredSize: [number, number, number];
}

function textBoard(
  THREE: RoomContext['THREE'],
  disposables: Array<{ dispose(): void }>,
  text: string,
  widthM: number,
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 96;
  const paint = canvas.getContext('2d')!;
  paint.fillStyle = '#10141a';
  paint.fillRect(0, 0, 1024, 96);
  paint.fillStyle = '#cfe3de';
  paint.font = '36px system-ui, sans-serif';
  paint.textAlign = 'center';
  paint.textBaseline = 'middle';
  paint.fillText(text, 512, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  disposables.push(texture);
  const geometry = new THREE.PlaneGeometry(widthM, (widthM * 96) / 1024);
  disposables.push(geometry);
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  disposables.push(material);
  const board = new THREE.Mesh(geometry, material);
  board.rotation.y = Math.PI;
  return board;
}

export const room: RoomDefinition = {
  sourceId: 10,
  skill: 'threejs-source-prop-ingestion',
  title: 'Vibe3D asset registry',
  summary:
    'The same two props installed twice: raw with the pack\u2019s preview '
    + 'light and loose collider beside gated, lit by the room and measured.',
  kind: 'webgpu',
  limitation:
    'Nothing was installed: no package added, no registry resolved, no '
    + 'upstream prop vendored — the drum and bollard are locally authored '
    + 'stand-ins exercising the contract. Model counts and token-saving '
    + 'claims remain author claims; availability is not adoption.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();
    const drumRecord: PropRecord = { declaredSize: [0.9, 1.3, 0.9] };

    const drumMaterial = new THREE.MeshStandardMaterial({ color: 0x7a4a2e, roughness: 0.6, metalness: 0.3 });
    disposables.push(drumMaterial);
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.55, metalness: 0.5 });
    disposables.push(darkMetal);
    const bollardYellow = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.6 });
    disposables.push(bollardYellow);

    const buildDrum = (): THREE.Group => {
      const group = new THREE.Group();
      const bodyGeometry = new THREE.CylinderGeometry(0.42, 0.42, 1.2, 20);
      disposables.push(bodyGeometry);
      group.add(new THREE.Mesh(bodyGeometry, drumMaterial));
      const ribGeometry = new THREE.CylinderGeometry(0.435, 0.435, 0.09, 20);
      disposables.push(ribGeometry);
      const rib = new THREE.Mesh(ribGeometry, darkMetal);
      rib.position.y = 0.1;
      group.add(rib);
      const lidGeometry = new THREE.CylinderGeometry(0.43, 0.43, 0.07, 20);
      disposables.push(lidGeometry);
      const lid = new THREE.Mesh(lidGeometry, darkMetal);
      lid.position.y = 0.63;
      group.add(lid);
      group.position.y = 0.6;
      return group;
    };

    const buildBollard = (): THREE.Group => {
      const group = new THREE.Group();
      const baseGeometry = new THREE.BoxGeometry(0.5, 0.12, 0.5);
      disposables.push(baseGeometry);
      const base = new THREE.Mesh(baseGeometry, darkMetal);
      base.position.y = -0.44;
      group.add(base);
      const postGeometry = new THREE.CylinderGeometry(0.16, 0.18, 1.0, 14);
      disposables.push(postGeometry);
      group.add(new THREE.Mesh(postGeometry, bollardYellow));
      const capGeometry = new THREE.SphereGeometry(0.18, 14, 10);
      disposables.push(capGeometry);
      const cap = new THREE.Mesh(capGeometry, darkMetal);
      cap.position.y = 0.55;
      group.add(cap);
      group.position.y = 0.5;
      return group;
    };

    // The defect on display, kept deliberately in the left bay.
    const previewLight = new THREE.PointLight(0xffd9a0, 14, 7, 2);
    previewLight.position.set(-2.9, 3.0, 2.4);
    previewLight.name = 'before-half:pack-preview-light (retained to show the defect)';
    root.add(previewLight);
    const bulbGeometry = new THREE.SphereGeometry(0.1, 10, 8);
    disposables.push(bulbGeometry);
    const bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe2b0,
      emissive: 0xffc46b,
      emissiveIntensity: 2,
    });
    disposables.push(bulbMaterial);
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.copy(previewLight.position);
    root.add(bulb);

    const plinthGeometry = new THREE.BoxGeometry(3.6, 0.5, 2.2);
    disposables.push(plinthGeometry);
    const plinthMaterial = new THREE.MeshStandardMaterial({ color: 0x565a62, roughness: 0.85 });
    disposables.push(plinthMaterial);
    const panelGeometry = new THREE.PlaneGeometry(5.6, 3.4);
    disposables.push(panelGeometry);
    const panelBefore = new THREE.MeshStandardMaterial({ color: 0x3a2c2c, roughness: 0.95 });
    disposables.push(panelBefore);
    const panelAfter = new THREE.MeshStandardMaterial({ color: 0x24382e, roughness: 0.95 });
    disposables.push(panelAfter);

    const gatedDrums: THREE.Group[] = [];
    for (const side of [-1, 1] as const) {
      const bayX = side * 2.9;
      const panel = new THREE.Mesh(panelGeometry, side < 0 ? panelBefore : panelAfter);
      panel.position.set(bayX, 2.2, 4.6);
      panel.rotation.y = Math.PI;
      root.add(panel);
      const plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
      plinth.position.set(bayX, 0.25, 2.6);
      root.add(plinth);

      const drum = buildDrum();
      drum.position.set(bayX - 0.8, 0.5 + 0.6, 2.6);
      root.add(drum);
      const bollard = buildBollard();
      bollard.position.set(bayX + 0.9, 0.5 + 0.5, 2.6);
      root.add(bollard);
      if (side > 0) gatedDrums.push(drum);
    }

    // Colliders: as-shipped oversized box on the left, measured tight on right.
    const looseGeometry = new THREE.BoxGeometry(2.4, 2.4, 2.4);
    disposables.push(looseGeometry);
    const looseMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b5e, wireframe: true });
    disposables.push(looseMaterial);
    const loose = new THREE.Mesh(looseGeometry, looseMaterial);
    loose.position.set(-3.7, 1.6, 2.6);
    root.add(loose);

    // Measured from the built drum, so the placard cannot drift from the mesh.
    const measured = new THREE.Box3().setFromObject(gatedDrums[0]);
    const size = new THREE.Vector3();
    measured.getSize(size);
    const tightGeometry = new THREE.BoxGeometry(size.x + 0.06, size.y + 0.06, size.z + 0.06);
    disposables.push(tightGeometry);
    const tightMaterial = new THREE.MeshBasicMaterial({ color: 0x6fe3a1, wireframe: true });
    disposables.push(tightMaterial);
    const tight = new THREE.Mesh(tightGeometry, tightMaterial);
    const centre = new THREE.Vector3();
    measured.getCenter(centre);
    tight.position.copy(centre);
    root.add(tight);

    const beforeBoard = textBoard(
      THREE,
      disposables,
      'raw install \u2014 preview light kept \u00b7 collider as-shipped',
      4.6,
    );
    beforeBoard.position.set(-2.9, 1.15, 4.55);
    root.add(beforeBoard);
    const declared = drumRecord.declaredSize;
    const afterBoard = textBoard(
      THREE,
      disposables,
      `gated \u2014 declared ${declared[0].toFixed(1)} \u00d7 ${declared[1].toFixed(1)} \u00d7 ${declared[2].toFixed(1)} m, measured ${size.x.toFixed(1)} \u00d7 ${size.y.toFixed(1)} \u00d7 ${size.z.toFixed(1)} m`,
      4.6,
    );
    afterBoard.position.set(2.9, 1.15, 4.55);
    root.add(afterBoard);

    return {
      root,
      update: (time: number) => {
        // The retained defect breathes; the gated bay stays on room light.
        bulbMaterial.emissiveIntensity = 1.6 + Math.sin(time * 2.2) * 0.7;
      },
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
