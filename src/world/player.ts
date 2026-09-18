/**
 * src/world/player.ts — first-person walking, with collision against axis-aligned boxes.
 *
 * Deliberately small. The world is a hub and some rooms; it does not need a
 * physics engine, and adding one would be a dependency the showcase has to
 * carry forever. Axis-aligned boxes are enough for walls, doorframes and
 * plinths, and they are exact — no tunnelling, no jitter against a corner.
 *
 * Two bugs this workspace has already paid for, avoided here by construction:
 *
 *  - **Yaw sign.** Movement is derived from the camera's own basis vectors
 *    rather than from hand-written sin/cos, because a sign error there is
 *    correct at yaw 0 and 180 and exactly backwards at ±90 — which passes every
 *    test that walks down a corridor.
 *  - **dt.** Clamped before integration. An unclamped frame after a stall
 *    teleports the player through a wall.
 */
import * as THREE from 'three';

export interface Collider {
  /** World-space axis-aligned box. */
  box: THREE.Box3;
}

const EYE_HEIGHT = 1.62;
const RADIUS = 0.34;
const WALK = 4.2;
const SPRINT = 7.4;
const GRAVITY = -22;
const JUMP = 7.2;
/** Above this a single frame moves further than the player is wide. */
const MAX_DT = 1 / 20;
const STEP_UP = 0.45;

export class Player {
  readonly camera: THREE.PerspectiveCamera;
  readonly position = new THREE.Vector3(0, EYE_HEIGHT, 0);
  private readonly velocity = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private grounded = false;
  private readonly keys = new Set<string>();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly wish = new THREE.Vector3();
  private locked = false;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLElement,
    aspect: number,
    private colliders: readonly Collider[] = [],
  ) {
    this.camera = new THREE.PerspectiveCamera(72, aspect, 0.05, 400);
    this.camera.position.copy(this.position);

    this.canvas.addEventListener('click', this.requestLock);
    document.addEventListener('pointerlockchange', this.onLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  setColliders(colliders: readonly Collider[]): void {
    this.colliders = colliders;
  }

  teleport(x: number, z: number, yaw = 0): void {
    this.position.set(x, EYE_HEIGHT, z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
  }

  get isLocked(): boolean {
    return this.locked;
  }

  private requestLock = (): void => {
    if (!this.disposed) void this.canvas.requestPointerLock();
  };

  private onLockChange = (): void => {
    this.locked = document.pointerLockElement === this.canvas;
    if (!this.locked) this.keys.clear();
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.locked) return;
    this.yaw -= e.movementX * 0.0022;
    this.pitch -= e.movementY * 0.0022;
    // Stop just short of straight up/down; exactly ±90° makes the basis degenerate.
    this.pitch = Math.max(-1.52, Math.min(1.52, this.pitch));
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent): void => { this.keys.delete(e.code); };
  private onBlur = (): void => { this.keys.clear(); };

  update(dtRaw: number): void {
    const dt = Math.min(dtRaw, MAX_DT);

    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    // Basis from the camera, never from hand-rolled trigonometry.
    this.camera.getWorldDirection(this.forward);
    this.forward.y = 0;
    if (this.forward.lengthSq() < 1e-6) this.forward.set(0, 0, -1);
    this.forward.normalize();
    this.right.crossVectors(this.forward, THREE.Object3D.DEFAULT_UP).normalize();

    this.wish.set(0, 0, 0);
    if (this.keys.has('KeyW')) this.wish.add(this.forward);
    if (this.keys.has('KeyS')) this.wish.sub(this.forward);
    if (this.keys.has('KeyD')) this.wish.add(this.right);
    if (this.keys.has('KeyA')) this.wish.sub(this.right);
    if (this.wish.lengthSq() > 0) this.wish.normalize();

    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? SPRINT : WALK;
    this.velocity.x = this.wish.x * speed;
    this.velocity.z = this.wish.z * speed;

    if (this.grounded && this.keys.has('Space')) {
      this.velocity.y = JUMP;
      this.grounded = false;
    }
    this.velocity.y += GRAVITY * dt;

    // Resolve one axis at a time: sliding along a wall falls out for free, and
    // a corner cannot wedge the player the way a single combined test does.
    this.moveAxis('x', this.velocity.x * dt);
    this.moveAxis('z', this.velocity.z * dt);
    this.moveAxis('y', this.velocity.y * dt);

    if (this.position.y < EYE_HEIGHT) {
      this.position.y = EYE_HEIGHT;
      this.velocity.y = 0;
      this.grounded = true;
    }
    this.camera.position.copy(this.position);
  }

  private moveAxis(axis: 'x' | 'y' | 'z', delta: number): void {
    if (delta === 0) return;
    const before = this.position[axis];
    this.position[axis] = before + delta;

    const feet = this.position.y - EYE_HEIGHT;
    for (const c of this.colliders) {
      const b = c.box;
      if (
        this.position.x + RADIUS <= b.min.x || this.position.x - RADIUS >= b.max.x ||
        this.position.z + RADIUS <= b.min.z || this.position.z - RADIUS >= b.max.z ||
        this.position.y <= b.min.y || feet >= b.max.y
      ) continue;

      if (axis === 'y') {
        if (delta < 0) { this.position.y = b.max.y + EYE_HEIGHT; this.grounded = true; }
        else this.position.y = b.min.y;
        this.velocity.y = 0;
        return;
      }
      // A low obstruction is a step, not a wall — otherwise a 10cm kerb stops you.
      if (b.max.y - feet <= STEP_UP) {
        this.position.y = b.max.y + EYE_HEIGHT;
        this.grounded = true;
        continue;
      }
      this.position[axis] = before;
      return;
    }
    if (axis === 'y' && delta < 0) this.grounded = false;
  }

  dispose(): void {
    this.disposed = true;
    this.canvas.removeEventListener('click', this.requestLock);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
}

export { EYE_HEIGHT, RADIUS };
