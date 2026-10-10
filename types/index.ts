export interface Fact {
  id: string;
  claim: string;
  sourceTitle: string;
  sourceUrl: string;
  publisher?: string;
  supportingExcerpt?: string;
  confidence: 'high' | 'medium' | 'low';
  category?: 'historical' | 'present' | 'contextual';
  retrievedAt?: string;
  verificationStatus?: 'verified' | 'candidate';
}

export interface PlaceImage {
  url: string;
  caption?: string;
  credit: string;
  license?: string;
  sourceUrl: string;
}

export interface Place {
  id: string;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  summary?: string;
  presentContext?: string;
  officialUrl?: string;
  facts: Fact[];
  images?: PlaceImage[];
  distanceKm?: number;
}

export interface StoryCache {
  placeId: string;
  mode: 'past' | 'future';
  modelId: string;
  story: string;
  sourceFactIds?: string[];
  assumptions?: string[];
  createdAt: string;
}

export interface StoryResponsePast {
  mode: 'past';
  story: string;
  sources: { title: string; url: string; publisher?: string; factId?: string }[];
  evidenceStatus: 'supported' | 'limited';
  isFallback?: boolean;
}

export interface StoryResponseFuture {
  mode: 'future';
  story: string;
  speculationLabel: string;
  assumptions?: string[];
  isFallback?: boolean;
}

export type StoryResponse = StoryResponsePast | StoryResponseFuture;

export interface ResearchTelemetry {
  searchesExecuted: number;
  uniqueSourcesRetained: number;
  cacheHit: boolean;
  authoritativeFound: boolean;
  evidenceSource: 'cached' | 'curated' | 'fresh_serp' | 'fresh_wiki';
  latencyMs: number;
}
