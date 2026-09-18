import type { RoomDefinition } from '../contract';

/**
 * Source 55 — Project Aether: claimed self-hosted source release.
 *
 * Stub by honesty. The post announces source availability, but the only
 * outbound link recoverable from it is a Discord invite, not a repository,
 * and a name search returns unrelated projects. The release is UNVERIFIED,
 * not refuted — and until a URL exists there is nothing to pin, licence-check
 * or stage. Joining the Discord to ask is an external action needing owner
 * approval, so this door waits with the reason on the wall.
 */
export const room: RoomDefinition = {
  sourceId: 55,
  skill: 'unmapped',
  title: 'Project Aether — release unverified',
  summary:
    'A post claims a self-hosted source release, but no repository URL is recoverable from it — only a Discord invite.',
  kind: 'stub',
  limitation:
    'Release claim UNVERIFIED: nothing about the game’s technology is established by this row, so there is nothing honest to stage. Unblock action is the repository URL itself; never guess it from the name Aether alone.',
};
