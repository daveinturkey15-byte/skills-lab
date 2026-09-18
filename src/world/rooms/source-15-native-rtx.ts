/**
 * Room for source 15 — Native RTX runtime for Three.js (ThreeRuntime).
 *
 * Honest stub, by catalogue design. The method replaces the browser with a
 * native desktop runtime (Three.js/WebGPU → C++ → Vulkan + RTX), so an
 * in-browser room claiming to show it would repeat the recorded substitution
 * error. Whether that product line exists is an owner decision, not a build.
 */
import type { RoomDefinition } from '../contract';

export const room: RoomDefinition = {
  sourceId: 15,
  skill: 'threejs-rtx-runtime-route',
  title: 'Native RTX runtime (blocked)',
  summary: 'This runtime leaves the browser for native Vulkan and RTX, so there is nothing browser-side to walk into.',
  kind: 'stub',
  limitation:
    'Blocked: the method needs a native C++/Vulkan build and an owner product decision. ' +
    'No in-browser substitute is shown here, deliberately.',
};
