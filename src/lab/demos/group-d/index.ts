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
import { createDemo as createWoodland } from './source-53-verdant-woodland';
import { createDemo as createBust } from './source-58-dermis-bust';
import { createDemo as createSmartMesh } from './source-56-smart-mesh';
import { createDemo as createImageToGame } from './source-60-image-to-game';
import { createDemo as createIsland } from './source-52-island-schedules';
import { createDemo as createOcean } from './source-57-two-scale-ocean';
import { createDemo as createPickup } from './source-54-pickup-comparator';

const SOURCES_51 = ['https://x.com/zackontopx/status/2100183743436890237'];
const SOURCES_53 = ['https://github.com/Leonxlnx/verdant-forest'];
const SOURCES_58 = ['https://github.com/SamG-Coder/dermis-cuda'];
const SOURCES_56 = ['https://x.com/majidmanzarpour/status/2098926447150645605'];
const SOURCES_60 = [
  'https://x.com/tesanaai',
  'https://tesana.ai/',
  'https://tesana.ai/en/blog/introducing-image-to-game',
];
const SOURCES_52 = ['https://x.com/DilumSanjaya/status/2098816417324003476'];
const SOURCES_57 = [
  'https://x.com/samgcoder/status/2099056246523597071',
  'https://github.com/SamG-Coder/north-swell',
  'https://github.com/SamG-Coder/cuda-webshader',
];
const SOURCES_54 = [
  'https://x.com/victormustar/status/2099226451568435605',
  'https://www.deepseek.com/news/deepseek-v4-1-flash/',
];

export const manifest: DemoManifestEntry[] = [
  {
    sourceId: 51,
    title: 'Cumulus congestus turret-stack: CPU-baked raymarch with light march and HG rim',
    method:
      'Layered value/Worley density written for this demo, marched '
      + 'front-to-back with Beer-Lambert extinction, a 5-step '
      + 'light march toward a low warm sun at each occupied sample, and a '
      + 'Henyey-Greenstein phase term for thin forward-lit edges.',
    adaptation: 'adapted',
    sources: [...SOURCES_51],
    limitation:
      'CPU bake at 96x128 texels and 32 view steps, not a live GPU raymarch; '
      + 'motion is whole-tower advection of the static bake. Step count and density '
      + 'are construction constants, not live controls. Shaping mismatch owned: the field '
      + 'still flares to a flat anvil cap while the reference is a cumulus congestus '
      + 'turret-stack with no anvil spread.',
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
  {
    sourceId: 53,
    title: 'Verdant forest — instanced LOD woodland with trail corridor',
    method:
      'Seeded procedural woodland: three tree kinds generated in three LODs '
      + 'each, planted into near/mid/far rings with a trail corridor, spacing '
      + 'and rock-exclusion culling, hash-culled far density, one grass pool '
      + 'with distance-scaled counts, and near-ring wind sway.',
    adaptation: 'adapted',
    sources: [...SOURCES_53],
    limitation:
      'Learn-only: the source ships no licence file, so every operand is '
      + 'locally authored and only the population structure is restated. LOD '
      + 'rings are static distances, not camera-relative swaps; wind moves the '
      + 'near ring only.',
    createDemo: createWoodland,
  },
  {
    sourceId: 58,
    title: 'DERMIS atoms — strand hair, procedural skin and iris, one blink',
    method:
      'Comparator atoms on a fixed generic base: fibonacci-rooted tapered '
      + 'scalp strands with per-strand length limits and breeze sway, '
      + 'fbm-mottled skin, a three-stop procedural iris, and one shared blink '
      + 'driver. Not a likeness route: no image input exists.',
    adaptation: 'adapted',
    sources: [...SOURCES_58],
    limitation:
      'Comparator only: no CUDA, no compute, no capture and no likeness. '
      + 'Strands are rigid instances with whole-strand sway, not simulated '
      + 'curves; skin is vertex-colour fbm. MIT repo located at 6c7c598; '
      + 'method restated, nothing vendored.',
    createDemo: createBust,
  },
  {
    sourceId: 56,
    title: 'Smart-mesh ladder: one tower at sculpt density and at game-ready density',
    method:
      'Stage one authored tower twice, at 40-sided and 7-sided radial density, and carry '
      + 'both triangle counts. The low half wears a wireframe overlay on its three largest '
      + 'masses so the retopology bargain is inspectable rather than asserted.',
    adaptation: 'adapted',
    sources: [...SOURCES_56],
    limitation:
      'Comparator-only source: no repository, no technique write-up and no licence exist, '
      + 'so nothing here is vendor output. The low tower is a uniform segment reduction, '
      + 'not a real retopology pass — no quad-flow optimisation, no UVs, no LOD chain.',
    comparison: {
      control: 'Sculpt density — smooth but unaffordable per frame',
      technique: 'Game-ready density — edge flow kept where the silhouette lives',
      controlPosition: 'left',
    },
    createDemo: createSmartMesh,
  },
  {
    sourceId: 60,
    title: 'Image-to-game surface: concept panel beside its derived diorama',
    method:
      'Bake a synthetic concept panel in code, sample its own ridge field and palette '
      + 'bands back out, and raise them as diorama volumes — skyline blocks from the ridge, '
      + 'block colours from the bands — with one pacing mover standing in for the motion '
      + 'half no image contains.',
    adaptation: 'adapted',
    sources: [...SOURCES_60],
    limitation:
      'Comparator-only source: proprietary hosted product with no source, no pin and no '
      + 'licence, so no vendor input, output or timing is reproduced. The concept panel is '
      + 'synthetic input baked by the demo, and the derivation is hand-placed from its '
      + 'fields — an illustration of what image-to-game would have to bridge.',
    comparison: {
      control: 'Single image — flat, no depth, nothing moves',
      technique: 'Image-derived diorama: regions as volumes, ridge as skyline, plus a mover',
      controlPosition: 'left',
    },
    createDemo: createImageToGame,
  },
  {
    sourceId: 52,
    title: 'Island village NPC schedules (comparator)',
    method:
      'Agent-schedule layer restated as a deterministic timetable: five named villagers '
      + 'with jobs walk eased dwell-and-carry legs between the well, farm, dock and hut '
      + 'doors on a 48-second loop, and a quest marker hops huts each quarter cycle.',
    adaptation: 'adapted',
    sources: [...SOURCES_52],
    limitation:
      'Comparator only: no Tripo output, no Mixamo rig and no model call exist here — '
      + 'bodies are capsules with canvas name tags, and the names, jobs and timetable '
      + 'are our invention. The poster claim (which tool built what) is unverified.',
    createDemo: createIsland,
  },
  {
    sourceId: 57,
    title: 'JONSWAP two-scale ocean: swell stitched with chop and foam',
    method:
      'Two wave scales summed per vertex with deep-water dispersion: four long swell '
      + 'trains with JONSWAP-flavoured peak weights, plus five cross chop trains stitched '
      + 'in on the technique panel only, with a crest-factor foam standing in for the '
      + 'Jacobian-fold term. Control shows the swell alone.',
    adaptation: 'adapted',
    sources: [...SOURCES_57],
    limitation:
      'CPU restatement, not the source pipeline: no CUDA kernel, no WGSL compute and no '
      + 'transpiler run — spectrum weights are our own choice, not the author baked '
      + 'table, and three here is 0.185.1 while cuda-webshader pins r186 and refuses '
      + 'WebGL2.',
    comparison: {
      control: 'Long swell only, no chop, no foam',
      technique: 'Two-scale stitch: swell + directional chop + crest foam',
      controlPosition: 'left',
    },
    createDemo: createOcean,
  },
  {
    sourceId: 54,
    title: 'Pickup truck in code: many-part hierarchy with a modelled underbody (comparator)',
    method:
      'Comparator atoms restated as an authored exhibit: a rolling chassis — frame rails, '
      + 'crossmembers, axles, driveshaft, differential, exhaust, tank, suspension arms, spare '
      + 'and four tyred wheels on spinning hubs — staged beside the same chassis dressed with '
      + 'a shell. Named groups throughout, the way a generated scene outliner would list them.',
    adaptation: 'adapted',
    sources: [...SOURCES_54],
    limitation:
      'Comparator only: no model call, no Blender session, no prompt log and no .blend exist '
      + 'here, so the poster claim (a model built it, mechanically accurate) is unverified — '
      + 'frames verify only that a truck scene with this underbody detail exists. Every part '
      + 'is a locally authored box, cylinder or sphere; the many-part hierarchy and the '
      + 'modelled underbody are the quality bar the Blender gauntlet loop is measured against, '
      + 'not vendor output.',
    comparison: {
      control: 'Rolling chassis — frame, running gear and underbody, the hard part',
      technique: 'Dressed truck — the same chassis under a shell',
      controlPosition: 'left',
    },
    createDemo: createPickup,
  },
];
