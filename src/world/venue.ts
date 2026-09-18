/**
 * src/world/venue.ts — the routing decision, in one place with its reasons.
 *
 * A technique lives where it is most itself. Most of the catalogue is
 * spatial or temporal (water, foliage, terrain, weather, lighting,
 * animation, a shape grammar, a rendering method) and belongs in a walk-in
 * room. A smaller set is document-shaped: what the source actually carries
 * is a format, a comparison, a decision, a licence finding, a process or a
 * catalogue. Staging a floating prop for a document makes the world worse
 * and the technique less legible, so those sources are authoritative in the
 * Atlas and their Map 3 door presents the artifact at wall scale instead.
 *
 * The rule reads properties (status, method wording), never an id list, so
 * source 63 cannot silently fall through a stale roster. Checks run from
 * the most specific document shape to the most general; anything unmatched
 * stays in the world. A `browser` door still opens — see the lane report
 * for the intended room treatment.
 */
import type { RoomVenue } from './contract';

/** The catalogue fields the routing decision actually reads. */
export interface VenueSource {
  sourceId: number;
  status: string;
  method?: string;
}

/** A routing decision with its one-line audit reason. */
export interface VenueDecision {
  venue: RoomVenue;
  reason: string;
}

/**
 * Route one catalogue source to the venue where it is most itself.
 * Pure function of the source's own properties; no id list anywhere.
 */
export function venueFor(source: VenueSource): VenueDecision {
  const method = source.method ?? '';

  // An alias carries no technique of its own; it points at one.
  if (source.status === 'alias') {
    return { venue: 'browser', reason: 'alias pointer: carries no technique of its own' };
  }

  // Nothing was ever retrieved: an unretrievable article or an unverified
  // release claim. There is no spatial thing to stage.
  if (/^\s*not established\.?\s*$/i.test(method)) {
    return { venue: 'browser', reason: 'no retrievable body: release or article unverified' };
  }

  // A comparison with no portable method: quality targets, a comparator
  // rubric, an owner's judgement bar, or one-line sweep notes. Readable,
  // not stageable. Sources whose "no portable implementation" still names a
  // spatial atom (weather states, strands, tracks) do NOT match here.
  if (/quality targets only|comparator rubric|owner.s judgement|one-line.*comparators/is.test(method)) {
    return { venue: 'browser', reason: 'comparison without a portable method: targets or rubric only' };
  }

  // The reusable object is an index, a hub, or a brief template — a
  // catalogue or format document, not a scene.
  if (/reusable object is the format|hub of self-contained sketches|shelf index|one-page.?brief/is.test(method)) {
    return { venue: 'browser', reason: 'catalogue/format document: the reusable object is an index, hub or brief' };
  }

  // An honest finding that there is no separable technique: the build is a
  // bar the loop must clear, not a method to demonstrate.
  if (/honest finding: no separable|no separable.*beyond/is.test(method)) {
    return { venue: 'browser', reason: 'finding, not a method: the build is a bar for the loop' };
  }

  // A licence decision split: what may be restated versus what is
  // out of bounds as a commercial product. The finding is the artifact.
  if (/^\s*decision split:/i.test(method)) {
    return { venue: 'browser', reason: 'licence decision: restatable physics versus an out-of-bounds product' };
  }

  // A transferable decision principle (keep lighting parametric). A rule to
  // read, not a scene to walk into.
  if (/^\s*transferable principle/i.test(method)) {
    return { venue: 'browser', reason: 'decision principle: a rule about lighting parameters, not a scene' };
  }

  // A mechanical world-QA harness: a passability sweep plus perf ordering.
  // A gate over the world, not an exhibit inside it.
  if (/mechanical world-qa harness|passability sweep/is.test(method)) {
    return { venue: 'browser', reason: 'process document: a mechanical QA harness, a gate rather than a scene' };
  }

  return {
    venue: 'world',
    reason: 'spatial or temporal technique: geometry, light, motion or rendering method',
  };
}

/** Atlas deep link for a source; the world wall card points here. */
export function atlasDeepLink(sourceId: number): string {
  return `?view=atlas#source-${sourceId}`;
}

/** Everything a later lane needs to wire one room: venue, reason, link. */
export function venueCard(source: VenueSource): VenueDecision & { href: string } {
  const decision = venueFor(source);
  return { ...decision, href: atlasDeepLink(source.sourceId) };
}
