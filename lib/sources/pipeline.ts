import { Fact, Place } from '@/types';
import { conductPlaceResearch } from './research';

/**
 * Backwards-compatible entrypoint to get or discover evidence bundle for a place.
 * Delegates to the optimized conductPlaceResearch pipeline.
 */
export async function getOrDiscoverEvidence(place: Place, forceRefresh: boolean = false): Promise<Fact[]> {
  const outcome = await conductPlaceResearch(place, forceRefresh);
  return outcome.facts;
}
