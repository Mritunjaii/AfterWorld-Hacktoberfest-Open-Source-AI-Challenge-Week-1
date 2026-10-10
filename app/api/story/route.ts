import { NextRequest, NextResponse } from 'next/server';
import { getPlaceById, getCachedStory, saveStoryCache } from '@/lib/db/repository';
import { getOrDiscoverEvidence } from '@/lib/sources/pipeline';
import { getModelProvider } from '@/lib/ai';
import { buildPastStoryPrompt, buildFutureStoryPrompt } from '@/lib/ai/prompts';
import { generateGroundedHistoricalProse, generateTailoredFutureNarrative } from '@/lib/ai/synthesizer';
import { StoryResponsePast, StoryResponseFuture, Fact } from '@/types';

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

/**
 * Deduplicates and canonicalizes source entries by URL
 */
function deduplicateSources(facts: Fact[]): { title: string; url: string; factId?: string }[] {
  const seenUrls = new Set<string>();
  const uniqueSources: { title: string; url: string; factId?: string }[] = [];

  for (const f of facts) {
    const canonicalUrl = f.sourceUrl.trim();
    if (!seenUrls.has(canonicalUrl)) {
      seenUrls.add(canonicalUrl);
      uniqueSources.push({
        title: f.sourceTitle,
        url: canonicalUrl,
        factId: f.id,
      });
    }
  }

  return uniqueSources;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, mode, refresh } = body;

    if (!placeId || typeof placeId !== 'string') {
      return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
    }

    if (mode !== 'past' && mode !== 'future') {
      return NextResponse.json({ error: 'mode must be "past" or "future"' }, { status: 400 });
    }

    const place = await getPlaceById(placeId);
    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const provider = getModelProvider();
    const modelId = provider.id;

    // Check cache (unless explicit refresh requested)
    if (!refresh) {
      const cached = await getCachedStory(placeId, mode, modelId);
      if (cached) {
        if (mode === 'past') {
          const uniqueSources = deduplicateSources(place.facts || []);
          const response: StoryResponsePast = {
            mode: 'past',
            story: cached.story,
            sources: uniqueSources,
            evidenceStatus: (place.facts || []).length >= 2 ? 'supported' : 'limited',
          };
          return NextResponse.json(response);
        } else {
          const response: StoryResponseFuture = {
            mode: 'future',
            story: cached.story,
            speculationLabel: 'Imagined future — not a prediction',
            assumptions: cached.assumptions || [],
          };
          return NextResponse.json(response);
        }
      }
    }

    // 1. PAST MODE
    if (mode === 'past') {
      const rawEvidence = await getOrDiscoverEvidence(place, Boolean(refresh));

      // Deduplicate facts by claim string
      const seenClaims = new Set<string>();
      const evidence: Fact[] = [];
      for (const fact of rawEvidence) {
        const normalized = fact.claim.toLowerCase().replace(/\s+/g, ' ').slice(0, 40);
        if (!seenClaims.has(normalized)) {
          seenClaims.add(normalized);
          evidence.push(fact);
        }
      }

      if (!evidence || evidence.length === 0) {
        return NextResponse.json(
          {
            mode: 'past',
            story: 'Not enough verified historical information yet for this location. We do not generate ungrounded historical narratives.',
            sources: [],
            evidenceStatus: 'limited',
            isFallback: true,
          },
          { status: 200 }
        );
      }

      const { system, user } = buildPastStoryPrompt(place.name, evidence, place.summary);

      let storyText = '';
      let usedFactIds: string[] = evidence.map((e) => e.id);
      let isFallback = false;

      try {
        const rawOutput = await provider.generateText(user, system);
        const parsed = JSON.parse(cleanJsonString(rawOutput));
        if (parsed.story) {
          storyText = parsed.story;
          if (Array.isArray(parsed.factIdsUsed) && parsed.factIdsUsed.length > 0) {
            usedFactIds = parsed.factIdsUsed;
          }
        } else {
          storyText = rawOutput;
        }
      } catch (err) {
        console.warn('Inference provider offline, generating strictly grounded factual synthesis:', err);
        storyText = generateGroundedHistoricalProse(place.name, evidence);
        isFallback = true;
      }

      // Save to cache
      await saveStoryCache({
        placeId,
        mode: 'past',
        modelId,
        story: storyText,
        sourceFactIds: usedFactIds,
        createdAt: new Date().toISOString(),
      });

      const uniqueSources = deduplicateSources(evidence);

      const response: StoryResponsePast = {
        mode: 'past',
        story: storyText,
        sources: uniqueSources,
        evidenceStatus: evidence.length >= 2 ? 'supported' : 'limited',
        isFallback,
      };

      return NextResponse.json(response);
    }

    // 2. FUTURE MODE
    if (mode === 'future') {
      const { system, user } = buildFutureStoryPrompt(place.name, place.presentContext, place.summary);

      let storyText = '';
      let assumptions: string[] = [];
      let isFallback = false;

      try {
        const rawOutput = await provider.generateText(user, system);
        const parsed = JSON.parse(cleanJsonString(rawOutput));
        if (parsed.story) {
          storyText = parsed.story;
          if (Array.isArray(parsed.assumptions)) {
            assumptions = parsed.assumptions;
          }
        } else {
          storyText = rawOutput;
        }
      } catch (err) {
        console.warn('Inference provider offline, generating site-specific speculative projection:', err);
        const tailored = generateTailoredFutureNarrative(place.name, place.summary, place.presentContext);
        storyText = tailored.story;
        assumptions = tailored.assumptions;
        isFallback = true;
      }

      await saveStoryCache({
        placeId,
        mode: 'future',
        modelId,
        story: storyText,
        assumptions,
        createdAt: new Date().toISOString(),
      });

      const response: StoryResponseFuture = {
        mode: 'future',
        story: storyText,
        speculationLabel: 'Imagined future — not a prediction',
        assumptions,
        isFallback,
      };

      return NextResponse.json(response);
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    console.error('API /api/story error:', error);
    return NextResponse.json({ error: 'Internal server error while generating narrative' }, { status: 500 });
  }
}
