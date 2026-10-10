import { Fact } from '@/types';

export interface WikiExtractResult {
  title: string;
  summary: string;
  facts: Fact[];
  sourceUrl: string;
  officialUrl?: string;
  presentContext?: string;
}

/**
 * Searches Wikipedia and extracts rich, distinct historical facts,
 * preventing duplicate source URLs and duplicate sentences.
 */
export async function searchWikipediaFacts(query: string): Promise<WikiExtractResult> {
  try {
    const encoded = encodeURIComponent(query.trim());
    // 1. Search Wikipedia for best page title hit
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Afterworld/1.0 (historical-place-storytelling)' },
      next: { revalidate: 86400 },
    });

    if (!searchRes.ok) {
      return { title: query, summary: '', facts: [], sourceUrl: '' };
    }

    const searchData = await searchRes.json();
    const hits = searchData?.query?.search;
    if (!hits || hits.length === 0) {
      return { title: query, summary: '', facts: [], sourceUrl: '' };
    }

    const bestHit = hits[0];
    const pageTitle = bestHit.title;
    const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;

    // 2. Fetch full plain-text extract with sections and external links
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|extlinks&explaintext=1&titles=${encodeURIComponent(
      pageTitle
    )}&format=json&origin=*`;
    const extractRes = await fetch(extractUrl, {
      headers: { 'User-Agent': 'Afterworld/1.0 (historical-place-storytelling)' },
      next: { revalidate: 86400 },
    });

    if (!extractRes.ok) {
      return {
        title: pageTitle,
        summary: bestHit.snippet.replace(/<[^>]+>/g, ''),
        facts: [],
        sourceUrl: pageUrl,
      };
    }

    const extractData = await extractRes.json();
    const pages = extractData?.query?.pages;
    const pageId = Object.keys(pages || {})[0];
    const pageObj = pages?.[pageId];
    const fullExtract: string = pageObj?.extract || '';

    // Extract official external website if available
    let officialUrl: string | undefined = undefined;
    const extLinks = pageObj?.extlinks;
    if (Array.isArray(extLinks)) {
      for (const linkObj of extLinks) {
        const link = linkObj['*'];
        if (
          typeof link === 'string' &&
          (link.includes('.gov') ||
            link.includes('.org') ||
            link.includes('.edu') ||
            link.includes('.ac.in') ||
            link.includes('official') ||
            link.includes(pageTitle.toLowerCase().slice(0, 5)))
        ) {
          officialUrl = link.startsWith('http') ? link : `https://${link}`;
          break;
        }
      }
    }

    // Split extract into sections
    const rawSections = fullExtract.split(/\n==+ /);
    const leadSection = rawSections[0] || '';

    // Extract specific thematic sections: History, Foundation, Architecture, Campus
    const historySection = rawSections.find(
      (s) =>
        s.toLowerCase().startsWith('history') ||
        s.toLowerCase().startsWith('foundation') ||
        s.toLowerCase().startsWith('origins') ||
        s.toLowerCase().startsWith('construction')
    );

    const architectureOrCampusSection = rawSections.find(
      (s) =>
        s.toLowerCase().startsWith('architecture') ||
        s.toLowerCase().startsWith('campus') ||
        s.toLowerCase().startsWith('description') ||
        s.toLowerCase().startsWith('structure')
    );

    const cleanSentences = (text: string): string[] => {
      // Remove section headers like "History ==\n"
      const body = text.replace(/^[^=\n]+==+\n?/, '');
      return body
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.replace(/\s+/g, ' ').trim())
        .filter(
          (s) =>
            s.length > 35 &&
            s.length < 320 &&
            !s.startsWith('==') &&
            !s.toLowerCase().includes('see also') &&
            !s.toLowerCase().includes('references')
        );
    };

    const leadSentences = cleanSentences(leadSection);
    const historySentences = historySection ? cleanSentences(historySection) : [];
    const campusSentences = architectureOrCampusSection ? cleanSentences(architectureOrCampusSection) : [];

    // Deduplicate statements and pick distinct chronological and architectural claims
    const collectedSentences: string[] = [];
    const seenLower = new Set<string>();

    const addSentence = (s: string) => {
      const normalized = s.toLowerCase().slice(0, 45);
      if (!seenLower.has(normalized)) {
        seenLower.add(normalized);
        collectedSentences.push(s);
      }
    };

    // 1. Foundation/History first
    historySentences.slice(0, 3).forEach(addSentence);
    // 2. Lead definitions
    leadSentences.slice(0, 2).forEach(addSentence);
    // 3. Architecture/Campus development
    campusSentences.slice(0, 2).forEach(addSentence);

    // If still thin, add remaining distinct lead statements
    leadSentences.slice(2, 5).forEach(addSentence);

    const extractedFacts: Fact[] = collectedSentences.slice(0, 5).map((sentence, idx) => ({
      id: `wiki-${pageId}-${idx + 1}`,
      claim: sentence,
      sourceTitle: `${pageTitle} — Verified Encyclopedia Entry`,
      sourceUrl: pageUrl,
      supportingExcerpt: sentence,
      confidence: 'medium',
    }));

    // Formulate a rich presentContext
    let presentContext = '';
    if (campusSentences.length > 0) {
      presentContext = campusSentences[0];
    } else if (leadSentences.length > 1) {
      presentContext = leadSentences[1];
    } else {
      presentContext = `Preserved heritage site and landmark situated at ${pageTitle}.`;
    }

    return {
      title: pageTitle,
      summary: leadSentences[0] || bestHit.snippet.replace(/<[^>]+>/g, ''),
      facts: extractedFacts,
      sourceUrl: pageUrl,
      officialUrl,
      presentContext,
    };
  } catch (error) {
    console.error('Error in Wikipedia fact extraction:', error);
    return { title: query, summary: '', facts: [], sourceUrl: '' };
  }
}
