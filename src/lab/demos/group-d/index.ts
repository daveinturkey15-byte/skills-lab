/**
 * Technique lab — group D manifest (source 51: sailing-game weather).
 *
 * Four demos share one sourceId by lane design: the cloud, its shadow, the
 * grade on everything, and the one-value weather driver. That sharing is
 * recorded honestly here and in docs/group-d-notes.md — the host as read
 * (runtime.ts refreshGroups) dedupes manifest rows by sourceId and keeps the
 * first, so mounting all four needs a host change this lane does not own.
 * Registration is still just this file: the host discovers groups with
 * import.meta.glob('./demos/group-N/index.ts').
 */

import type { DemoManifestEntry } from '../../types';
import { createDemo as createCloud } from './source-51-cloud';
import { createDemo as createGrade } from './source-51-grade';
import { createDemo as createShadow } from './source-51-shadow';
import { createDemo as createStorm } from './source-51-storm';

const SOURCES_51 = ['https://x.com/zackontopx/status/2100183743436890237'];

export const manifest: DemoManifestEntry[] = [
  {
    sourceId: 51,
    title: 'Anvil cumulonimbus: CPU-baked raymarch with light march and HG rim',
    method:
      'Layered value/Worley density written for this demo, eroded flat at the '
      + 'anvil cap, marched front-to-back with Beer-Lambert extinction, a 5-step '
      + 'light march toward a low warm sun at each occupied sample, and a '
      + 'Henyey-Greenstein phase term for thin forward-lit edges.',
    adaptation: 'adapted',
    sources: [...SOURCES_51],
    limitation:
      'CPU bake at 96x128 texels and 32 view steps, not a live GPU raymarch; '
      + 'motion is whole-tower advection of the static bake. Step count and density '
      + 'are construction constants, not live controls.',
    createDemo: createCloud,
  },
  {
    sourceId: 51,
    title: 'Cloud shadows that agree with the cloud deck (sun × coverage)',
    method:
      'The overhead deck and the ground shadow sample one coverage field at the '
      + 'same clock with the same wind vector; the control panel keeps the same '
      + 'albedo and blocking forms under flat sun.',
    adaptation: 'adapted',
    sources: [...SOURCES_51],
    limitation:
      'Vertical projection (a high-sun approximation); the shadow lives in ground '
      + 'vertex colours only and the blocking forms neither cast nor catch it.',
    createDemo: createShadow,
    comparison: {
      control: 'Sun only — flat light, no extinction',
      technique: 'Sun × cloud coverage from the same field as the deck overhead',
      controlPosition: 'left',
    },
  },
  {
    sourceId: 51,
    title: 'Lift/gamma/gain + saturation + contrast, and the missing output conversion',
    method:
      'Seven fixed chips take a lift/gamma/gain + saturation + contrast grade in '
      + 'linear space; the left half bakes the raw-shader failure (no output '
      + 'conversion: darker) and the right half the same grade corrected, with an '
      + 'ungraded reference strip in frame.',
    adaptation: 'adapted',
    sources: [...SOURCES_51],
    limitation:
      'Appearance values baked through the correct path, not a live ShaderMaterial; '
      + 'static chart, fixed grade constants.',
    createDemo: createGrade,
    comparison: {
      control: 'Grade computed but emitted with no output conversion (the raw-shader look: darker)',
      technique: 'Identical grade with the sRGB output encode restored',
      controlPosition: 'left',
    },
  },
  {
    sourceId: 51,
    title: 'One storminess value driving sun, cloud, rain, sea and exposure',
    method:
      'Storminess loops calm-storm-calm over 80 seconds; seven channels chase it '
      + 'with time constants from 2.5 to 18 seconds. Water is the frozen spectrum '
      + 'via sampleOcean. Values read live on userData and eight meter bars.',
    adaptation: 'adapted',
    sources: [...SOURCES_51],
    limitation:
      'Renderer exposure is host-owned and untouched — the exposure channel is an '
      + 'emulated multiplier on sky colours. Foam is a height tint, not breaking '
      + 'detection. Two mounts match only at equal age.',
    createDemo: createStorm,
  },
];
