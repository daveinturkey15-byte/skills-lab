/**
 * Source 51, D3 — colour correction, and the missing output conversion.
 *
 * A fixed seven-chip test scene (deep shadow, two neutrals, mid grey, light
 * grey, an HDR specular chip, two saturated chips) is graded with
 * lift/gamma/gain + saturation + contrast. Both halves show the graded scene;
 * they differ only in the output conversion, which is the trap this workspace
 * has already been bitten by: a raw ShaderMaterial (or any custom node
 * output) receives no tone mapping and no colour-space conversion, so it
 * renders darker than everything beside it.
 *
 * The host was read, not assumed: runtime.ts initRenderer sets neither
 * toneMapping nor outputColorSpace, so the renderer keeps three's defaults —
 * NoToneMapping (common/Renderer.js) and SRGBColorSpace output — while
 * built-in materials convert and a raw shader does not. With no tone mapping
 * on this host, the trap's tone-mapping half is moot here and the visible
 * half is purely the missing sRGB encode.
 *
 * No live shader runs in this lane (no GPU, no browser), so the failure is
 * shown as baked appearance values through the correct path: to display D
 * through a converting material, the chip is authored with V = decode(D).
 * The ungraded reference strip along the bottom keeps "without grade" in the
 * same frame.
 */

import type * as THREE from 'three';

import type {
  DemoComparison,
  DemoContext,
  DemoInstance,
  DemoMetadata,
} from '../../types';
import {
  applyGrade,
  clamp01,
  disposeTree,
  srgbToLinear,
  type GradeParams,
} from './shared';

export const SOURCE_URLS = [
  'https://x.com/zackontopx/status/2100183743436890237',
] as const;

/** The demonstrated grade; fixed, documented, and exported for the notes. */
export const GRADE: GradeParams = {
  lift: [0.015, 0.015, 0.02],
  gamma: 1.12,
  gain: [1.06, 1.0, 0.94],
  saturation: 1.3,
  contrast: 1.1,
  contrastPivot: 0.18,
};

/** Linear scene values: shadow, dark, mid, light, HDR specular, red, blue. */
export const SCENE_CHIPS: ReadonlyArray<readonly [number, number, number]> = [
  [0.012, 0.012, 0.012],
  [0.05, 0.05, 0.05],
  [0.18, 0.18, 0.18],
  [0.45, 0.45, 0.45],
  [3.0, 3.0, 3.0],
  [0.55, 0.02, 0.02],
  [0.04, 0.08, 0.55],
];

/** Indices of the reference strip: shadow, mid, specular, red. */
const STRIP_INDICES = [0, 2, 4, 5] as const;

/** Graded linear radiance of chip i under the demonstrated grade. */
export function gradedLinear(index: number): [number, number, number] {
  const chip = SCENE_CHIPS[index];
  return applyGrade(chip[0], chip[1], chip[2], GRADE);
}

/**
 * What a conversion-less raw shader displays for graded linear L: the raw
 * numbers, clipped. Darker than intended everywhere below white.
 */
export function failureDisplay(
  graded: readonly [number, number, number],
): [number, number, number] {
  return [clamp01(graded[0]), clamp01(graded[1]), clamp01(graded[2])];
}

/**
 * Chip authoring that shows display target D through the correct
 * converting path: V = decode(D), so the path's own encode restores D.
 */
export function correctBake(
  graded: readonly [number, number, number],
): readonly [number, number, number] {
  return graded;
}

/** Chip authoring that shows the failure appearance through the same path. */
export function failureBake(
  graded: readonly [number, number, number],
): [number, number, number] {
  const shown = failureDisplay(graded);
  return [srgbToLinear(shown[0]), srgbToLinear(shown[1]), srgbToLinear(shown[2])];
}

const CHIP_SIZE = 0.86;
const CHIP_GAP = 1.0;
const PLATE_COLOUR: readonly [number, number, number] = [0.028, 0.028, 0.034];

export function createDemo(context: DemoContext): DemoInstance {
  const { THREE } = context;
  const root = new THREE.Group();
  root.name = 'source-51-colour-grade';

  const chipGeometry = new THREE.PlaneGeometry(CHIP_SIZE, CHIP_SIZE);

  const addChip = (
    parent: THREE.Group,
    x: number,
    y: number,
    rgb: readonly [number, number, number],
    name: string,
  ): void => {
    const chip = new THREE.Mesh(
      chipGeometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(rgb[0], rgb[1], rgb[2]),
      }),
    );
    chip.name = name;
    chip.position.set(x, y, 0);
    parent.add(chip);
  };

  const addPlate = (
    parent: THREE.Group,
    width: number,
    height: number,
    y: number,
    name: string,
  ): void => {
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(PLATE_COLOUR[0], PLATE_COLOUR[1], PLATE_COLOUR[2]),
      }),
    );
    plate.name = name;
    plate.position.set(0, y, -0.06);
    parent.add(plate);
  };

  const buildRow = (
    parent: THREE.Group,
    bake: (graded: readonly [number, number, number]) => readonly [number, number, number],
    tag: string,
  ): void => {
    addPlate(parent, 7.9, 1.7, 0, `${tag}-plate`);
    for (let i = 0; i < SCENE_CHIPS.length; i += 1) {
      addChip(parent, (i - 3) * CHIP_GAP, 0, bake(gradedLinear(i)), `${tag}-chip-${i}`);
    }
  };

  // Left: the graded scene with no output conversion (the trap: darker).
  const control = new THREE.Group();
  control.name = 'control';
  control.position.x = -4.5;
  buildRow(control, failureBake, 'raw-shader');
  root.add(control);

  // Right: the identical grade with the sRGB output encode restored.
  const technique = new THREE.Group();
  technique.name = 'technique';
  technique.position.x = 4.5;
  buildRow(technique, correctBake, 'corrected');
  root.add(technique);

  // Bottom: the same scene ungraded, so "without grade" is in frame too.
  const reference = new THREE.Group();
  reference.name = 'ungraded-reference';
  reference.position.y = -1.7;
  addPlate(reference, 4.9, 1.7, 0, 'reference-plate');
  STRIP_INDICES.forEach((chipIndex, slot) => {
    const chip = SCENE_CHIPS[chipIndex];
    addChip(reference, (slot - 1.5) * CHIP_GAP, 0, chip, `reference-chip-${chipIndex}`);
  });
  root.add(reference);

  const comparison: DemoComparison = {
    control: 'Grade computed but emitted with no output conversion (the raw-shader look: darker)',
    technique: 'Identical grade with the sRGB output encode restored',
    controlPosition: 'left',
  };

  const metadata: DemoMetadata & { counters: Record<string, number> } = {
    sourceId: 51,
    title: 'Lift/gamma/gain + saturation + contrast, and the missing output conversion',
    method:
      'Seven fixed chips (shadow, dark, mid, light, HDR specular, saturated red and '
      + 'blue) take a lift/gamma/gain + saturation + contrast grade in linear space. '
      + 'The left half bakes the failure this workspace has met before — a raw shader '
      + 'emits graded linear with no tone mapping and no colour-space conversion, so it '
      + 'reads darker — and the right half bakes the same grade with the sRGB encode '
      + 'restored. The host was read first: it sets no tone mapping (three default '
      + 'NoToneMapping) and sRGB output, so on this host the trap is purely the missing '
      + 'encode. An ungraded reference strip keeps the before in frame.',
    adaptation: 'adapted',
    sources: [...SOURCE_URLS],
    limitation:
      'Appearance values baked through the correct path, not a live ShaderMaterial: '
      + 'this lane has no GPU or browser, so the darker half is the exact displayed '
      + 'colour a conversion-less shader would produce, pre-distorted so the converting '
      + 'path shows it — the shader stage itself is not exercised. Static chart, no '
      + 'temporal behaviour. The grade constants are fixed exports, not live dials.',
    comparison,
    counters: {
      chips: SCENE_CHIPS.length * 2 + STRIP_INDICES.length,
      meshes: SCENE_CHIPS.length * 2 + STRIP_INDICES.length + 3,
    },
  };

  return {
    root,
    dispose: () => disposeTree(root),
    metadata,
  };
}

export default createDemo;
