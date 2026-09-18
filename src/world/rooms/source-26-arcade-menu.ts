import type { RoomContext, RoomDefinition, RoomInstance } from '../contract';

/**
 * Source 26 — arcade attract-loop game-select ring. Re-staged from
 * `src/lab/demos/group-b/source-26.ts`: the ring arithmetic is kept verbatim
 * (R = N(W+GAP)/TAU, STEP = TAU/N, short-way delta modulo N, two-stage commit,
 * accent scored by saturation against distance from mid-lightness then clamped
 * with a fixed fallback). What changed is scale and address: card width grows
 * to 1.7 m so the ring stands ~2.5 m in radius at the back of the room, the
 * focus totem becomes a walk-around pillar, and the unclamped/clamped swatches
 * become wall-sized comparisons — because from the doorway the old stage read
 * as a thin sliver at 6.2%.
 */

const ITEM_COUNT = 8;
const CARD_WIDTH = 1.7;
const CARD_HEIGHT = 1.5;
const CARD_GAP = 0.3;
const TAU = Math.PI * 2;

/** Ring radius derived from item count, not hand-tuned. */
const RING_RADIUS = (ITEM_COUNT * (CARD_WIDTH + CARD_GAP)) / TAU;
const STEP = TAU / ITEM_COUNT;

type Hsl = { h: number; s: number; l: number };

function makeRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 1) + 1) % 1;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(hue * 6) % 6;
  const table: [number, number, number][] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ];
  const [r, g, b] = table[sector] ?? [0, 0, 0];
  return [r + m, g + m, b + m];
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

/**
 * Accent extraction with the legibility clamp that is easy to drop and
 * expensive to lose; near-neutral art falls back to a fixed accent.
 */
function extractAccent(pixels: Uint8Array): { raw: Hsl; clamped: Hsl } {
  let best: Hsl = { h: 0, s: 0, l: 0.5 };
  let bestScore = -1;
  for (let i = 0; i < pixels.length; i += 4) {
    const hsl = rgbToHsl(pixels[i] / 255, pixels[i + 1] / 255, pixels[i + 2] / 255);
    const score = hsl.s * (1 - Math.abs(hsl.l - 0.5) * 1.4);
    if (score > bestScore) {
      bestScore = score;
      best = hsl;
    }
  }
  if (best.s < 0.18) return { raw: best, clamped: { h: 0.55, s: 0.74, l: 0.55 } };
  return {
    raw: best,
    clamped: { h: best.h, s: Math.max(0.72, best.s), l: Math.min(0.6, Math.max(0.5, best.l)) },
  };
}

/** Shortest signed angular distance, modulo N — the short-way-round rule. */
function shortWayDelta(fromIndex: number, toIndex: number, count: number): number {
  let delta = (toIndex - fromIndex) % count;
  if (delta > count / 2) delta -= count;
  if (delta < -count / 2) delta += count;
  return delta;
}

export const room: RoomDefinition = {
  sourceId: 26,
  skill: 'game-hud-menu-overhaul',
  title: 'Arcade game-select ring',
  summary:
    'A game-select ring sized from its item count, rotated the short way round, with two-stage commit and a legibility-clamped accent.',
  kind: 'webgpu',
  limitation:
    'Page expression all rights reserved; behaviour restated in our own code. A demo owns no DOM, so the semantic-roster data source, degradation branches, entry gate and audio are stated, not demonstrated; selection advances on a timer.',
  create(ctx: RoomContext): RoomInstance {
    const T = ctx.THREE;
    const low = ctx.quality === 'low';
    const root = new T.Group();
    root.name = 'source-26-room';
    const disposables: Array<{ dispose(): void }> = [];
    const track = <D extends { dispose(): void }>(d: D): D => {
      disposables.push(d);
      return d;
    };

    // Forward of centre: from the doorway the ring reads at 4–7 m, not 8–12 m.
    const centreZ = -0.6;
    const ringY = 2.5;

    // Floor pad so the ring reads as one installation from the door.
    const pad = new T.Mesh(
      track(new T.BoxGeometry(9.5, 0.12, 10)),
      track(new T.MeshStandardMaterial({ color: 0x2e3438, roughness: 0.95 })),
    );
    pad.position.set(0, -0.06, centreZ);
    root.add(pad);

    // Deterministic stand-in cover art: banded hues, every third card washed
    // out so the clamp has something real to correct.
    const rng = makeRng(ctx.seed * 13 + 26);
    const artSeeds: number[] = [];
    for (let i = 0; i < ITEM_COUNT; i += 1) artSeeds.push(Math.floor(rng() * 1e9));
    const coverSize = low ? 8 : 16;
    const ring = new T.Group();
    ring.position.set(0, 0, centreZ);
    root.add(ring);

    const cardGeo = track(new T.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT));
    const cards: InstanceType<typeof T.Mesh>[] = [];
    const textures: InstanceType<typeof T.DataTexture>[] = [];
    const accents: Array<{ raw: Hsl; clamped: Hsl }> = [];
    for (let i = 0; i < ITEM_COUNT; i += 1) {
      const data = new Uint8Array(coverSize * coverSize * 4);
      const hue = (i / ITEM_COUNT + 0.06) % 1;
      const washed = i % 3 === 2;
      const cardRng = makeRng(artSeeds[i]);
      for (let y = 0; y < coverSize; y += 1) {
        for (let x = 0; x < coverSize; x += 1) {
          const band = Math.floor((y / coverSize) * 4);
          const saturation = washed ? 0.06 + cardRng() * 0.05 : 0.35 + band * 0.16;
          const lightness = 0.16 + band * 0.17 + cardRng() * 0.05;
          const [r, g, b] = hslToRgb(hue + band * 0.02, Math.min(0.95, saturation), Math.min(0.92, lightness));
          const k = (y * coverSize + x) * 4;
          data[k] = Math.round(r * 255);
          data[k + 1] = Math.round(g * 255);
          data[k + 2] = Math.round(b * 255);
          data[k + 3] = 255;
        }
      }
      accents.push(extractAccent(data));
      const texture = new T.DataTexture(data, coverSize, coverSize, T.RGBAFormat);
      texture.colorSpace = T.SRGBColorSpace;
      texture.needsUpdate = true;
      track(texture);
      textures.push(texture);
      const card = new T.Mesh(
        cardGeo,
        track(new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide, toneMapped: false })),
      );
      const angle = i * STEP;
      card.position.set(Math.sin(angle) * RING_RADIUS, ringY, Math.cos(angle) * RING_RADIUS);
      card.rotation.y = angle;
      ring.add(card);
      cards.push(card);
    }

    // Focus totem: the ring's hollow middle is dead frame from the doorway, so
    // the focus slot is physical — a pillar in the live accent carrying the
    // focused cover as a hero plate, the focused-item detail panel.
    const totem = new T.Mesh(
      track(new T.CylinderGeometry(1.15, 1.3, 2.4, 6)),
      track(new T.MeshStandardMaterial({ roughness: 0.6, flatShading: true })),
    );
    totem.position.set(0, 1.3, centreZ);
    root.add(totem);
    const hero = new T.Mesh(
      track(new T.PlaneGeometry(2.3, 1.4)),
      track(new T.MeshBasicMaterial({ toneMapped: false, side: T.DoubleSide })),
    );
    hero.position.set(0, 3.3, centreZ);
    hero.rotation.y = Math.PI / 5;
    root.add(hero);

    // The two swatches, wall-sized, flanking the totem where the doorway sees
    // them: the shell crosses local z = 0 on this slot, so anything past the
    // ring's far side is wall, not exhibit. Double-sided — the camera meets
    // their backs from the door.
    const swatchGeo = track(new T.PlaneGeometry(1.7, 1.0));
    const rawSwatchMat = track(new T.MeshBasicMaterial({ toneMapped: false, side: T.DoubleSide }));
    const clampedSwatchMat = track(new T.MeshBasicMaterial({ toneMapped: false, side: T.DoubleSide }));
    const rawSwatch = new T.Mesh(swatchGeo, rawSwatchMat);
    rawSwatch.position.set(-3.1, 1.3, centreZ - 1.2);
    const clampedSwatch = new T.Mesh(swatchGeo, clampedSwatchMat);
    clampedSwatch.position.set(3.1, 1.3, centreZ - 1.2);
    root.add(rawSwatch, clampedSwatch);

    // Focus rail: the live accent as a physical element, carried in front of
    // the totem for the same reason.
    const railMat = track(new T.MeshBasicMaterial({ toneMapped: false, side: T.DoubleSide }));
    const rail = new T.Mesh(track(new T.PlaneGeometry(CARD_WIDTH * 1.2, 0.09)), railMat);
    rail.position.set(0, 1.0, centreZ - 1.5);
    root.add(rail);

    const totemMat = totem.material as InstanceType<typeof T.MeshStandardMaterial>;
    const heroMat = hero.material as InstanceType<typeof T.MeshBasicMaterial>;
    function applyAccent(index: number): void {
      const accent = accents[index]!;
      const raw = hslToRgb(accent.raw.h, accent.raw.s, accent.raw.l);
      const clamped = hslToRgb(accent.clamped.h, accent.clamped.s, accent.clamped.l);
      rawSwatchMat.color.setRGB(raw[0], raw[1], raw[2]);
      clampedSwatchMat.color.setRGB(clamped[0], clamped[1], clamped[2]);
      railMat.color.setRGB(clamped[0], clamped[1], clamped[2]);
      totemMat.color.setRGB(clamped[0], clamped[1], clamped[2]);
      heroMat.map = textures[index] ?? null;
      heroMat.needsUpdate = true;
    }

    let focusIndex = 0;
    let committedIndex = -1;
    let ringAngle = 0;
    let targetAngle = 0;
    let nextEventAt = 1.2;
    let pendingActivation: number | null = null;
    applyAccent(0);

    return {
      root,
      update: (time: number, dt: number) => {
        // The loop idles between selections, which reads as a still to a
        // two-frame motion probe — so the totem turns and the hero plate sways
        // continuously, and the ring still steps the short way round on events.
        totem.rotation.y = time * 0.25;
        hero.position.y = 3.3 + Math.sin(time * 1.3) * 0.08;
        if (time >= nextEventAt) {
          nextEventAt = time + 1.8;
          if (pendingActivation === null) {
            // Stage 1: a side card activates — it rotates to the front but does
            // NOT launch. Only the focus slot launches (stage 2).
            pendingActivation = (focusIndex + 3) % ITEM_COUNT;
            targetAngle -= shortWayDelta(focusIndex, pendingActivation, ITEM_COUNT) * STEP;
            focusIndex = pendingActivation;
            committedIndex = -1;
            applyAccent(focusIndex);
          } else {
            committedIndex = pendingActivation;
            pendingActivation = null;
          }
        }
        const rate = Math.min(1, dt * 6);
        ringAngle += (targetAngle - ringAngle) * rate;
        ring.rotation.y = ringAngle;
        for (let i = 0; i < cards.length; i += 1) {
          const scale = i === committedIndex ? 1.16 : i === focusIndex ? 1.08 : 1;
          cards[i].scale.setScalar(scale);
        }
        rail.scale.x = committedIndex >= 0 ? 1.2 : 1;
      },
      dispose: () => {
        for (const d of disposables) d.dispose();
        root.clear();
      },
    };
  },
};
