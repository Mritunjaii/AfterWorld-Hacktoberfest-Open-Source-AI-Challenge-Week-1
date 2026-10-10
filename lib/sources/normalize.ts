import { Fact } from '@/types';

/**
 * Extracts clean domain name from URL for authoritative publisher labeling.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Web Source';
  }
}

/**
 * Normalizes and canonicalizes URL (removes tracking params, hashes, trailing slashes).
 */
export function canonicalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Strip common tracking parameters
    const paramsToStrip = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
    ];
    paramsToStrip.forEach((p) => parsed.searchParams.delete(p));
    parsed.hash = ''; // Remove anchor
    let clean = parsed.toString();
    if (clean.endsWith('/') && parsed.pathname !== '/') {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Determines whether a publisher/domain is authoritative.
 */
export function isAuthoritativeDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return (
    d.endsWith('.gov') ||
    d.endsWith('.gov.in') ||
    d.endsWith('.org') ||
    d.endsWith('.edu') ||
    d.endsWith('.ac.in') ||
    d.includes('unesco.org') ||
    d.includes('britannica.com') ||
    d.includes('nationalgeographic.com') ||
    d.includes('smithsonianmag.com') ||
    d.includes('museum') ||
    d.includes('archeo') ||
    d.includes('asi.nic.in')
  );
}

/**
 * Normalizes and deduplicates a collection of facts by canonical URL and claim similarity.
 */
export function normalizeAndDeduplicateFacts(facts: Fact[]): Fact[] {
  const seenUrls = new Set<string>();
  const seenClaims = new Set<string>();
  const normalized: Fact[] = [];

  for (const fact of facts) {
    if (!fact.claim || fact.claim.trim().length < 25) continue;

    const canonicalUrl = canonicalizeUrl(fact.sourceUrl);
    // Normalize claim snippet for deduplication
    const claimKey = fact.claim
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 45);

    if (seenClaims.has(claimKey)) {
      continue;
    }
    seenClaims.add(claimKey);

    const domain = fact.publisher || extractDomain(canonicalUrl);
    const confidence = isAuthoritativeDomain(domain) ? 'high' : fact.confidence || 'medium';

    normalized.push({
      ...fact,
      sourceUrl: canonicalUrl,
      publisher: domain,
      confidence,
      verificationStatus: fact.verificationStatus || (isAuthoritativeDomain(domain) ? 'verified' : 'candidate'),
      retrievedAt: fact.retrievedAt || new Date().toISOString(),
    });
  }

  return normalized;
}
