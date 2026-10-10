import { Place, Fact, ResearchTelemetry } from '@/types';
import { classifyPlaceType, buildFocusedQueries } from './query-builder';
import { executeSerpApiQuery } from './serpapi';
import { searchWikipediaFacts } from './wikipedia';
import { normalizeAndDeduplicateFacts } from './normalize';
import { savePlace } from '../db/repository';

export interface ResearchOutcome {
  facts: Fact[];
  telemetry: ResearchTelemetry;
  officialUrl?: string;
}

/**
 * Orchestrates structured evidence retrieval:
 * 1. Checks if place already possesses sufficient reviewed facts (avoids repeated API calls on tab switch)
 * 2. Executes 1 focused primary search via SerpApi
 * 3. Evaluates evidence depth; only fires a secondary targeted search if facts are sparse
 * 4. Merges with authoritative Wikipedia structured sections
 * 5. Normalizes, extracts publishers, and deduplicates claims & URLs
 * 6. Emits server telemetry metrics
 */
export async function conductPlaceResearch(
  place: Place,
  forceRefresh: boolean = false
): Promise<ResearchOutcome> {
  const startTime = Date.now();
  let searchesExecuted = 0;
  let authoritativeFound = false;

  // 1. REUSE CACHED / CURATED EVIDENCE IF SUFFICIENT
  if (!forceRefresh && place.facts && place.facts.length >= 3) {
    const unique = normalizeAndDeduplicateFacts(place.facts);
    return {
      facts: unique,
      officialUrl: place.officialUrl,
      telemetry: {
        searchesExecuted: 0,
        uniqueSourcesRetained: unique.length,
        cacheHit: true,
        authoritativeFound: unique.some((f) => f.confidence === 'high'),
        evidenceSource: 'curated',
        latencyMs: Date.now() - startTime,
      },
    };
  }

  // 2. FORMULATE FOCUSED QUERIES
  const placeType = classifyPlaceType(place.name, place.summary || place.presentContext);
  const queries = buildFocusedQueries(place.name, placeType);
  const collectedFacts: Fact[] = [...(place.facts || [])];
  let discoveredOfficialUrl: string | undefined = place.officialUrl;

  // 3. PRIMARY TARGETED SEARCH (Single focused query)
  if (process.env.SERPAPI_API_KEY) {
    searchesExecuted++;
    const primaryResult = await executeSerpApiQuery(queries.primary, { limit: 4, timeoutMs: 5000 });
    if (primaryResult.facts.length > 0) {
      collectedFacts.push(...primaryResult.facts);
    }
    if (primaryResult.authoritativeFound) {
      authoritativeFound = true;
    }
    if (primaryResult.officialSiteUrl && !discoveredOfficialUrl) {
      discoveredOfficialUrl = primaryResult.officialSiteUrl;
    }

    // 4. SECONDARY SEARCH (Only triggered if evidence is sparse)
    if (collectedFacts.length < 3) {
      searchesExecuted++;
      const secondaryResult = await executeSerpApiQuery(queries.secondary, { limit: 3, timeoutMs: 4000 });
      if (secondaryResult.facts.length > 0) {
        collectedFacts.push(...secondaryResult.facts);
      }
      if (secondaryResult.authoritativeFound) {
        authoritativeFound = true;
      }
      if (secondaryResult.officialSiteUrl && !discoveredOfficialUrl) {
        discoveredOfficialUrl = secondaryResult.officialSiteUrl;
      }
    }
  }

  // 5. SUPPLEMENT WITH STRUCTURED WIKIPEDIA DISCOVERY (History + Architecture sections)
  if (collectedFacts.length < 4) {
    const wikiData = await searchWikipediaFacts(place.name);
    if (wikiData.facts && wikiData.facts.length > 0) {
      collectedFacts.push(...wikiData.facts);
    }
    if (wikiData.officialUrl && !discoveredOfficialUrl) {
      discoveredOfficialUrl = wikiData.officialUrl;
    }
  }

  // 6. NORMALIZE & DEDUPLICATE EVIDENCE
  const normalizedFacts = normalizeAndDeduplicateFacts(collectedFacts);

  // Update place record in persistence so future tab switches and visits hit cache
  if (normalizedFacts.length > (place.facts || []).length || discoveredOfficialUrl !== place.officialUrl) {
    const updatedPlace: Place = {
      ...place,
      facts: normalizedFacts,
      officialUrl: discoveredOfficialUrl,
    };
    await savePlace(updatedPlace);
  }

  const telemetry: ResearchTelemetry = {
    searchesExecuted,
    uniqueSourcesRetained: normalizedFacts.length,
    cacheHit: false,
    authoritativeFound: authoritativeFound || normalizedFacts.some((f) => f.confidence === 'high'),
    evidenceSource: searchesExecuted > 0 ? 'fresh_serp' : 'fresh_wiki',
    latencyMs: Date.now() - startTime,
  };

  // Log clean server-side debug summary without exposing keys or user data
  console.log(
    `[Research Pipeline] Place: "${place.name}" | Searches Executed: ${telemetry.searchesExecuted} | Retained Sources: ${telemetry.uniqueSourcesRetained} | Source: ${telemetry.evidenceSource} | Latency: ${telemetry.latencyMs}ms`
  );

  return {
    facts: normalizedFacts,
    telemetry,
    officialUrl: discoveredOfficialUrl,
  };
}
