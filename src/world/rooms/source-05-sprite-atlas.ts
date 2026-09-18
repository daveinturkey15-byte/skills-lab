/**
 * Source 5 — local H3 video to sprite animation (licence-blocked model).
 *
 * Restages the lab demo's provider-neutral half at room scale: giant
 * before/after billboards facing the door — raw clip on flat magenta at
 * uniform timing beside pose extremes keyed to transparency on per-extreme
 * holds — with the packed atlas as a filmstrip below and a playhead cursor.
 * No H3 model, weights or output were fetched or used; the input frames are
 * drawn locally in code on the same flat magenta the post specifies, so the
 * keying step is real rather than assumed. The result is a 2D billboard,
 * never a 3D rig.
 */
import type * as THREE from 'three';
import type { RoomContext, RoomDefinition } from '../contract';

const TILE = 32;
const CLIP_FRAMES = 16;
const ATLAS_COLS = 4;
const KEY: readonly [number, number, number] = [255, 0, 255];

/** Locally authored stand-in for the generated clip: deterministic figure. */
function drawFrame(out: Uint8Array, offset: number, phase: number): void {
  const px = (x: number, y: number, r: number, g: number, b: number): void => {
    for (let ox = 0; ox < 2; ox += 1) {
      const xx = x + ox;
      if (xx < 0 || y < 0 || xx >= TILE || y >= TILE) return;
      const i = offset + (y * TILE + xx) * 4;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
    }
  };
  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) px(x, y, KEY[0], KEY[1], KEY[2]);
  }
  const swing = Math.sin(phase * Math.PI * 2);
  const lift = Math.max(0, Math.sin(phase * Math.PI * 2)) * 3;
  const cx = 16;
  const hip = 19 - Math.round(lift);
  for (let y = 9; y <= hip; y += 1) {
    for (let dx = -1; dx <= 1; dx += 1) px(cx + dx, y, 230, 210, 180);
  }
  for (let dy = 0; dy < 6; dy += 1) {
    for (let dx = -3; dx <= 2; dx += 1) px(cx + dx, 3 + dy, 240, 225, 195);
  }
  for (let t = 0; t < 11; t += 1) {
    const k = t / 10;
    px(cx + Math.round(swing * 5 * k), hip + t, 200, 160, 120);
    px(cx - Math.round(swing * 5 * k), hip + t, 170, 130, 95);
    px(cx + Math.round(swing * 6 * k), 10 + t, 210, 175, 135);
  }
}

/** Keep only the pose extremes — the frames where motion reverses. */
function poseExtremes(frames: number[]): number[] {
  const picks: number[] = [];
  for (let i = 1; i < frames.length - 1; i += 1) {
    const a = frames[i] - frames[i - 1];
    const b = frames[i + 1] - frames[i];
    if (a === 0 || b === 0 || a * b < 0) picks.push(i);
  }
  if (picks.length === 0) picks.push(0);
  return picks;
}

export const room: RoomDefinition = {
  sourceId: 5,
  skill: 'game-animation-asset-pipeline',
  title: 'Local H3 video to sprite animation',
  summary:
    'Raw clip on magenta beside keyed pose-extreme atlas: the portable half '
    + 'of a video-to-sprite workflow, keyed live at the door.',
  kind: 'webgpu',
  limitation:
    'MiniMax H3 is licence-blocked on this machine — the Community Licence '
    + 'excludes the UK — so no model, weights or output were used and the '
    + 'frames are drawn in code. Atlas and timing half only; a 2D billboard, '
    + 'never a 3D skinned rig.',
  create: (ctx: RoomContext) => {
    const { THREE } = ctx;
    const disposables: Array<{ dispose(): void }> = [];
    const root = new THREE.Group();

    const clip = new Uint8Array(CLIP_FRAMES * TILE * TILE * 4);
    const signal: number[] = [];
    for (let f = 0; f < CLIP_FRAMES; f += 1) {
      const phase = f / CLIP_FRAMES;
      drawFrame(clip, f * TILE * TILE * 4, phase);
      signal.push(Math.sin(phase * Math.PI * 2));
    }
    const extremes = poseExtremes(signal);
    const rows = Math.max(1, Math.ceil(extremes.length / ATLAS_COLS));
    const atlas = new Uint8Array(ATLAS_COLS * TILE * rows * TILE * 4);
    extremes.forEach((frameIndex, slot) => {
      const col = slot % ATLAS_COLS;
      const row = Math.floor(slot / ATLAS_COLS);
      for (let y = 0; y < TILE; y += 1) {
        for (let x = 0; x < TILE; x += 1) {
          const src = frameIndex * TILE * TILE * 4 + (y * TILE + x) * 4;
          const dst = ((row * TILE + y) * ATLAS_COLS * TILE + (col * TILE + x)) * 4;
          const isKey = clip[src] === KEY[0] && clip[src + 1] === KEY[1] && clip[src + 2] === KEY[2];
          atlas[dst] = clip[src];
          atlas[dst + 1] = clip[src + 1];
          atlas[dst + 2] = clip[src + 2];
          atlas[dst + 3] = isKey ? 0 : 255;
        }
      }
    });

    const atlasTexture = new THREE.DataTexture(atlas, ATLAS_COLS * TILE, rows * TILE, THREE.RGBAFormat);
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
    atlasTexture.magFilter = THREE.NearestFilter;
    atlasTexture.minFilter = THREE.NearestFilter;
    atlasTexture.repeat.set(1 / ATLAS_COLS, 1 / rows);
    atlasTexture.needsUpdate = true;
    disposables.push(atlasTexture);

    const rawTexture = new THREE.DataTexture(clip.slice(0, TILE * TILE * 4), TILE, TILE, THREE.RGBAFormat);
    rawTexture.colorSpace = THREE.SRGBColorSpace;
    rawTexture.magFilter = THREE.NearestFilter;
    rawTexture.minFilter = THREE.NearestFilter;
    rawTexture.needsUpdate = true;
    disposables.push(rawTexture);

    const quadGeometry = new THREE.PlaneGeometry(3.4, 3.4);
    disposables.push(quadGeometry);
    const rawMaterial = new THREE.MeshBasicMaterial({ map: rawTexture, toneMapped: false });
    disposables.push(rawMaterial);
    const atlasMaterial = new THREE.MeshBasicMaterial({
      map: atlasTexture,
      transparent: true,
      alphaTest: 0.5,
      toneMapped: false,
    });
    disposables.push(atlasMaterial);

    // Door half: a shell wall crosses local z = 0 in some wings, so the
    // billboards stand where the doorway camera can see them.
    const before = new THREE.Mesh(quadGeometry, rawMaterial);
    before.position.set(-2.05, 2.7, -3.0);
    before.rotation.y = Math.PI;
    root.add(before);
    const after = new THREE.Mesh(quadGeometry, atlasMaterial);
    after.position.set(2.05, 2.7, -3.0);
    after.rotation.y = Math.PI;
    root.add(after);

    // Atlas filmstrip: the packed extremes shown whole with a playhead.
    const stripTexture = new THREE.DataTexture(atlas, ATLAS_COLS * TILE, rows * TILE, THREE.RGBAFormat);
    stripTexture.colorSpace = THREE.SRGBColorSpace;
    stripTexture.magFilter = THREE.NearestFilter;
    stripTexture.minFilter = THREE.NearestFilter;
    stripTexture.needsUpdate = true;
    disposables.push(stripTexture);
    const stripGeometry = new THREE.PlaneGeometry(6.8, 6.8 / ATLAS_COLS);
    disposables.push(stripGeometry);
    const stripMaterial = new THREE.MeshBasicMaterial({
      map: stripTexture,
      transparent: true,
      alphaTest: 0.5,
      toneMapped: false,
    });
    disposables.push(stripMaterial);
    const strip = new THREE.Mesh(stripGeometry, stripMaterial);
    strip.position.set(0, 0.55, -2.95);
    strip.rotation.y = Math.PI;
    root.add(strip);

    const slotW = 6.8 / ATLAS_COLS;
    const cursorGeometry = new THREE.PlaneGeometry(slotW - 0.08, 6.8 / ATLAS_COLS + 0.08);
    disposables.push(cursorGeometry);
    const cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe28a,
      wireframe: true,
      toneMapped: false,
    });
    disposables.push(cursorMaterial);
    const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    cursor.position.set(-3.4 + slotW / 2, 0.55, -2.94);
    cursor.rotation.y = Math.PI;
    root.add(cursor);

    // Stand poles ground the billboards; the strip floats low on purpose.
    const poleGeometry = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 8);
    disposables.push(poleGeometry);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2f3338, roughness: 0.9 });
    disposables.push(poleMaterial);
    for (const x of [-2.05, 2.05]) {
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x, 0.5, -3.0);
      root.add(pole);
    }

    const holds = extremes.map((_, i) => (i % 2 === 0 ? 0.18 : 0.1));
    const totalHold = holds.reduce((a, b) => a + b, 0);
    let rawFrame = 0;
    let atlasSlot = 0;

    return {
      root,
      update: (time: number) => {
        const next = Math.floor(time * 12) % CLIP_FRAMES;
        if (next !== rawFrame) {
          rawFrame = next;
          (rawTexture.image.data as Uint8Array).set(
            clip.subarray(next * TILE * TILE * 4, (next + 1) * TILE * TILE * 4),
          );
          rawTexture.needsUpdate = true;
        }
        let t = time % totalHold;
        let slot = 0;
        for (; slot < holds.length - 1 && t > holds[slot]; slot += 1) t -= holds[slot];
        if (slot !== atlasSlot) {
          atlasSlot = slot;
          atlasTexture.offset.set(
            (slot % ATLAS_COLS) / ATLAS_COLS,
            1 - (Math.floor(slot / ATLAS_COLS) + 1) / rows,
          );
          cursor.position.x = -3.4 + slotW / 2 + (slot % ATLAS_COLS) * slotW;
        }
      },
      dispose: () => {
        for (const entry of disposables) entry.dispose();
      },
    };
  },
};
