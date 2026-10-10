import { Fact } from '@/types';
import { extractDomain, isAuthoritativeDomain, canonicalizeUrl } from './normalize';

interface SerpApiResponse {
  organic_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    displayed_link?: string;
  }>;
  error?: string;
}

// In-memory status tracking to avoid hammering SerpApi if quotas run out or keys are invalid
let serpApiPermanentError = false;
let permanentErrorMessage = '';

export interface SerpApiSearchOptions {
  limit?: number;
  timeoutMs?: number;
}

export interface SerpApiResult {
  facts: Fact[];
  authoritativeFound: boolean;
  officialSiteUrl?: string;
}

/**
 * Executes a single focused search against SerpApi with circuit breaking, timeouts, and rate handling.
 */
export async function executeSerpApiQuery(
  query: string,
  options: SerpApiSearchOptions = {}
): Promise<SerpApiResult> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return { facts: [], authoritativeFound: false };
  }

  // Circuit breaker check
  if (serpApiPermanentError) {
    console.warn(`[SerpApi] Skipped call due to prior permanent error: ${permanentErrorMessage}`);
    return { facts: [], authoritativeFound: false };
  }

  const limit = options.limit || 4;
  const timeoutMs = options.timeoutMs || 5000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encoded = encodeURIComponent(query);
    const endpoint = `https://serpapi.com/search.json?engine=google&q=${encoded}&api_key=${apiKey}&num=${limit}&hl=en&gl=us`;

    const res = await fetch(endpoint, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      serpApiPermanentError = true;
      permanentErrorMessage = `Authentication failed (status ${res.status}). Check SERPAPI_API_KEY.`;
      console.warn(`[SerpApi] ${permanentErrorMessage}`);
      return { facts: [], authoritativeFound: false };
    }

    if (res.status === 429) {
      console.warn('[SerpApi] Rate limit reached. Backing off smoothly without throwing.');
      return { facts: [], authoritativeFound: false };
    }

    if (!res.ok) {
      console.warn(`[SerpApi] HTTP status ${res.status} returned for query: "${query}"`);
      return { facts: [], authoritativeFound: false };
    }

    const data: SerpApiResponse = await res.json();
    if (data.error) {
      if (data.error.includes('quota') || data.error.includes('Invalid API key')) {
        serpApiPermanentError = true;
        permanentErrorMessage = data.error;
      }
      console.warn(`[SerpApi] Provider reported error: ${data.error}`);
      return { facts: [], authoritativeFound: false };
    }

    const results = data.organic_results || [];
    const facts: Fact[] = [];
    let authoritativeFound = false;
    let officialSiteUrl: string | undefined = undefined;

    results.forEach((item, idx) => {
      if (!item.link || !item.snippet || !item.title) return;

      const canonicalUrl = canonicalizeUrl(item.link);
      const domain = extractDomain(canonicalUrl);
      const isAuth = isAuthoritativeDomain(domain);

      if (isAuth) {
        authoritativeFound = true;
        if (!officialSiteUrl && (domain.endsWith('.org') || domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.ac.in'))) {
          officialSiteUrl = canonicalUrl;
        }
      }

      facts.push({
        id: `serp-${Date.now().toString(36)}-${idx + 1}`,
        claim: item.snippet.replace(/\s+/g, ' ').trim(),
        sourceTitle: item.title.trim(),
        sourceUrl: canonicalUrl,
        publisher: domain,
        supportingExcerpt: item.snippet.trim(),
        confidence: isAuth ? 'high' : 'medium',
        category: 'historical',
        retrievedAt: new Date().toISOString(),
        verificationStatus: isAuth ? 'verified' : 'candidate',
      });
    });

    return { facts, authoritativeFound, officialSiteUrl };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn(`[SerpApi] Request timed out after ${timeoutMs}ms for query "${query}"`);
    } else {
      console.warn('[SerpApi] Network error during query:', err);
    }
    return { facts: [], authoritativeFound: false };
  } finally {
    clearTimeout(timeoutId);
  }
}
