/**
 * src/world/world.ts — the integrator.
 *
 * Builds the hub, streams rooms in and out around the player, and owns the
 * single renderer and the single frame loop. Rooms supply contents and nothing
 * else: they never touch the renderer, the camera, the lights or each other.
 *
 * Written by hand and frozen before any build lane starts, because the lesson
 * from the last parallel run on this machine is that lanes produce parts that
 * do not compose unless the integrator and the contract exist first.
 *
 * DEFENSIVE LOADING IS NOT OPTIONAL. Every room module is imported, constructed
 * and updated inside try/catch, and a room that throws is replaced by a marker
 * that says so. With many authors writing rooms at once, one bad room must not
 * be able to black-screen the world.
 */
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { Player, type Collider } from './player';
import {
  planDoors, ATRIUM_HALF, WING_WIDTH, WALL_HEIGHT, DOOR_WIDTH, DOOR_HEIGHT,
  ROOM_WIDTH, ROOM_DEPTH, VESTIBULE, type DoorSlot,
} from './layout';
import { DEFAULT_BOUNDS, type RoomDefinition, type RoomInstance } from './contract';

/** Rooms nearer than this are built; beyond it they are disposed. */
const STREAM_IN = 26;
const STREAM_OUT = 34;

/* ------------------------------------------------------------------ text */

/**
 * Door plates and wall cards are canvas textures. A font atlas or an SDF text
 * library would look better and would be a dependency this showcase carries
 * forever; at door-plate size, canvas is indistinguishable and free.
 */
function textPlane(
  lines: readonly string[], widthM: number, opts: { size?: number; colour?: string; bg?: string } = {},
): THREE.Mesh {
  const px = 512;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = Math.max(64, Math.round((px / widthM) * (lines.length * 0.42 + 0.3)));
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = opts.bg ?? 'rgba(8,16,18,0.92)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = opts.colour ?? '#cfe9e4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = opts.size ?? 44;
  const lh = size * 1.28;
  lines.forEach((line, i) => {
    ctx.font = `${i === 0 ? 600 : 400} ${i === 0 ? size : size * 0.72}px system-ui, sans-serif`;
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (i - (lines.length - 1) / 2) * lh, canvas.width - 24);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const h = widthM * (canvas.height / canvas.width);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(widthM, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
  mesh.userData.disposable = [tex];
  return mesh;
}

function box(w: number, h: number, d: number, colour: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.92, metalness: 0 }),
  );
}

/* ----------------------------------------------------------------- world */

export interface WorldHandle {
  dispose(): void;
}

interface LiveRoom {
  slot: DoorSlot;
  def: RoomDefinition;
  instance: RoomInstance | null;
  group: THREE.Group;
  failed: string | null;
}

export async function mountWorld(
  container: HTMLElement,
  definitions: readonly RoomDefinition[],
): Promise<WorldHandle> {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;outline:none';
  container.appendChild(canvas);

  const renderer = new WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  await renderer.init();

  const backend = (renderer.backend as { isWebGPUBackend?: boolean })?.isWebGPUBackend
    ? 'WebGPU' : 'WebGL fallback';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1113);
  scene.fog = new THREE.Fog(0x0a1113, 30, 130);

  // An interior with no windows gets no help from a sky, so the base rig has to
  // do all of it. The first version read as near-black on a real adapter.
  scene.add(new THREE.HemisphereLight(0xbfd8de, 0x3a3230, 2.2));
  const key = new THREE.DirectionalLight(0xfff0dd, 2.0);
  key.position.set(18, 30, 12);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const slots = planDoors(definitions.length);
  const colliders: Collider[] = [];
  const statics = new THREE.Group();
  scene.add(statics);

  const addSolid = (mesh: THREE.Mesh, x: number, y: number, z: number): void => {
    mesh.position.set(x, y, z);
    mesh.updateMatrixWorld(true);
    statics.add(mesh);
    colliders.push({ box: new THREE.Box3().setFromObject(mesh) });
  };

  // --- atrium floor and the four wing floors -------------------------------
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2b3336, roughness: 0.95 });
  const atriumFloor = new THREE.Mesh(new THREE.BoxGeometry(ATRIUM_HALF * 2, 0.4, ATRIUM_HALF * 2), floorMat);
  addSolid(atriumFloor, 0, -0.2, 0);

  const reach = Math.max(...slots.map((s) => Math.abs(s.door.x) + Math.abs(s.door.z))) + 10;
  for (const [ax, az] of [[0, -1], [0, 1], [1, 0], [-1, 0]] as const) {
    const len = reach;
    const f = new THREE.Mesh(
      new THREE.BoxGeometry(ax !== 0 ? len : WING_WIDTH, 0.4, az !== 0 ? len : WING_WIDTH),
      floorMat,
    );
    addSolid(f, ax * (len / 2), -0.2, az * (len / 2));
  }

  // --- room shells and door frames ----------------------------------------
  const live = new Map<number, LiveRoom>();

  for (const slot of slots) {
    const def = definitions[slot.index]!;
    const px = slot.room.x - slot.door.x;
    const pz = slot.room.z - slot.door.z;
    const outLen = Math.hypot(px, pz);
    const ox = px / outLen;
    const oz = pz / outLen;
    // Along-wall direction, perpendicular to the outward normal.
    const tx = -oz;
    const tz = ox;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x39434a, roughness: 0.9 });
    // Wing wall either side of the opening.
    for (const s of [-1, 1]) {
      const segW = (ROOM_WIDTH - DOOR_WIDTH) / 2 + 2;
      const cx = slot.door.x + tx * s * (DOOR_WIDTH / 2 + segW / 2);
      const cz = slot.door.z + tz * s * (DOOR_WIDTH / 2 + segW / 2);
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(Math.abs(tx) > 0.5 ? segW : 0.5, WALL_HEIGHT, Math.abs(tz) > 0.5 ? segW : 0.5),
        wallMat,
      );
      addSolid(m, cx, WALL_HEIGHT / 2, cz);
    }
    // Lintel above the opening.
    const lintelH = WALL_HEIGHT - DOOR_HEIGHT;
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(Math.abs(tx) > 0.5 ? DOOR_WIDTH : 0.5, lintelH, Math.abs(tz) > 0.5 ? DOOR_WIDTH : 0.5),
      wallMat,
    );
    addSolid(lintel, slot.door.x, DOOR_HEIGHT + lintelH / 2, slot.door.z);

    // Door plate: the skill name, read at walking pace.
    const plate = textPlane([def.title, def.skill], 3.0, { size: 40 });
    plate.position.set(slot.door.x - ox * 0.31, DOOR_HEIGHT + lintelH / 2, slot.door.z - oz * 0.31);
    plate.lookAt(plate.position.x - ox, plate.position.y, plate.position.z - oz);
    statics.add(plate);

    // Room shell: floor, three walls, ceiling. The door wall is the wing wall.
    const shell = new THREE.Group();
    const rf = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, 0.4, ROOM_DEPTH + VESTIBULE), floorMat);
    addSolid(rf, slot.room.x - ox * (VESTIBULE / 2), -0.2, slot.room.z - oz * (VESTIBULE / 2));
    for (const [sx, sz, w, d] of [
      [ox, oz, ROOM_WIDTH, 0.5],
      [tx, tz, 0.5, ROOM_DEPTH],
      [-tx, -tz, 0.5, ROOM_DEPTH],
    ] as const) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(Math.abs(sx) > 0.5 ? d : w, WALL_HEIGHT, Math.abs(sz) > 0.5 ? d : w),
        wallMat,
      );
      addSolid(
        m,
        slot.room.x + sx * (Math.abs(sx) > 0.5 ? ROOM_DEPTH / 2 : ROOM_WIDTH / 2),
        WALL_HEIGHT / 2,
        slot.room.z + sz * (Math.abs(sz) > 0.5 ? ROOM_DEPTH / 2 : ROOM_WIDTH / 2),
      );
    }
    statics.add(shell);

    // Wall card inside: what this is, and what it does not prove.
    const cardLines = [def.summary];
    if (def.limitation) cardLines.push(`Not shown: ${def.limitation}`);
    if (def.kind === 'external') cardLines.push(`Runs outside the browser — ${def.launcher?.label ?? 'launcher'}`);
    if (def.kind === 'stub') cardLines.push('Not built yet. This door is honest about that.');
    const card = textPlane(cardLines, 6, { size: 30, colour: '#b9d4d0' });
    card.position.set(slot.room.x + ox * (ROOM_DEPTH / 2 - 0.3), 2.5, slot.room.z + oz * (ROOM_DEPTH / 2 - 0.3));
    card.lookAt(card.position.x - ox, card.position.y, card.position.z - oz);
    statics.add(card);

    // A lamp per room. Without it a room is a dark box until its contents
    // happen to emit, which made empty and broken rooms indistinguishable.
    const lamp = new THREE.PointLight(0xffe9cf, 26, 26, 2);
    lamp.position.set(slot.room.x, WALL_HEIGHT - 1.2, slot.room.z);
    statics.add(lamp);

    const group = new THREE.Group();
    group.position.set(slot.room.x, 0, slot.room.z);
    group.rotation.y = Math.atan2(ox, oz);
    scene.add(group);
    live.set(slot.index, { slot, def, instance: null, group, failed: null });
  }

  const player = new Player(canvas, container.clientWidth / container.clientHeight, colliders);
  player.teleport(0, 4, 0);

  // Headless capture needs to stand somewhere specific without a mouse. This is
  // the only hook the world exposes and it moves the camera and nothing else,
  // so it cannot be used to fake a result.
  (window as unknown as Record<string, unknown>).__worldTeleport =
    (x: number, z: number, yaw = 0) => player.teleport(x, z, yaw);

  /* --------------------------------------------------------- streaming */

  const quality: 'low' | 'medium' | 'high' = backend === 'WebGPU' ? 'high' : 'low';

  function ensureRoom(room: LiveRoom, want: boolean): void {
    if (want && !room.instance && !room.failed) {
      if (!room.def.create) return;
      try {
        room.instance = room.def.create({
          THREE, seed: 1000 + room.slot.index, bounds: DEFAULT_BOUNDS, quality,
        });
        room.group.add(room.instance.root);
      } catch (error) {
        // One bad room must never take the world with it.
        room.failed = error instanceof Error ? error.message : String(error);
        const marker = textPlane(
          ['This room failed to build', room.failed.slice(0, 70)], 5, { size: 30, colour: '#ffb4a2' },
        );
        marker.position.set(0, 2.2, 0);
        room.group.add(marker);
        console.error(`room ${room.def.sourceId} (${room.def.skill}) failed:`, error);
      }
    } else if (!want && room.instance) {
      try { room.instance.dispose(); } catch { /* a bad dispose must not stall streaming */ }
      room.group.remove(room.instance.root);
      room.instance = null;
    }
  }

  /* ---------------------------------------------------------- frame loop */

  const clock = new THREE.Clock();
  const local = new THREE.Vector3();
  let raf = 0;
  let disposed = false;

  const onResize = (): void => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    player.camera.aspect = w / h;
    player.camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  const tick = (): void => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    const elapsed = clock.elapsedTime;
    player.update(dt);

    for (const room of live.values()) {
      const d = Math.hypot(room.slot.room.x - player.position.x, room.slot.room.z - player.position.z);
      if (d < STREAM_IN) ensureRoom(room, true);
      else if (d > STREAM_OUT) ensureRoom(room, false);
      if (room.instance?.update) {
        try {
          local.copy(player.position);
          room.group.worldToLocal(local);
          room.instance.update(elapsed, dt, local);
        } catch (error) {
          room.failed = String(error);
          ensureRoom(room, false);
        }
      }
    }
    renderer.render(scene, player.camera);
  };
  tick();

  return {
    dispose(): void {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      player.dispose();
      for (const room of live.values()) ensureRoom(room, false);
      renderer.dispose();
      canvas.remove();
    },
  };
}
