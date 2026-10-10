'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Place, StoryResponsePast, StoryResponseFuture } from '@/types';
import {
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Volume2,
  Square,
  Globe,
  MapPin,
  Compass,
} from 'lucide-react';

// Dynamic import for Leaflet mini-map in Present tab
const DynamicMiniMap = dynamic(() => import('./ExploreMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-[#f4f1ea] border border-[#e8e5de] rounded-xl flex items-center justify-center text-[#73716b] text-xs">
      Loading geographic map...
    </div>
  ),
});

interface StoryPanelProps {
  place: Place;
  mode: 'past' | 'present' | 'future';
}

export default function StoryPanel({ place, mode }: StoryPanelProps) {
  const [pastData, setPastData] = useState<StoryResponsePast | null>(null);
  const [futureData, setFutureData] = useState<StoryResponseFuture | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [ttsSupported, setTtsSupported] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setTtsSupported(false);
    }
  }, []);

  // Stop speech when mode or place changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [mode, place.id]);

  const handleSpeak = useCallback((textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  const fetchStory = async (storyMode: 'past' | 'future', forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: place.id, mode: storyMode, refresh: forceRefresh }),
      });

      if (!res.ok) {
        throw new Error(`Failed to retrieve narrative: ${res.statusText}`);
      }

      const data = await res.json();
      startTransition(() => {
        if (storyMode === 'past') {
          setPastData(data);
        } else {
          setFutureData(data);
        }
      });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating narrative');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'past' && !pastData) {
      fetchStory('past');
    } else if (mode === 'future' && !futureData) {
      fetchStory('future');
    }
  }, [mode, place.id]);

  // =========================================================================
  // PRESENT MODE: Rich evidence-backed context, geography, map, & links
  // =========================================================================
  if (mode === 'present') {
    const presentNarrative = place.presentContext || place.summary || 'Documented heritage location.';
    const hasCoordinates = place.latitude !== 0 || place.longitude !== 0;

    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#e8e5de] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0eee6]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#73716b]">
              <BookOpen className="w-4 h-4 text-[#2e6059]" />
              <span>Current Function & Significance</span>
            </div>

            {ttsSupported && (
              <button
                onClick={() => handleSpeak(presentNarrative)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto ${
                  isSpeaking
                    ? 'bg-[#2e6059] text-white shadow-2xs'
                    : 'bg-[#f4f1ea] text-[#1c1c1a] hover:bg-[#e8e5de]'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read narrative aloud'}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#2e6059]" />
                    <span>Speak Up</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="editorial-serif text-2xl sm:text-3xl text-[#1c1c1a]">
              {place.name} in the Contemporary World
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-[#1c1c1a] font-light">
              {presentNarrative}
            </p>
          </div>

          {/* Present Geographic & Visitor Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#f0eee6]">
            <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#e8e5de] space-y-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[#73716b] text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2e6059]" /> Geographic Setting
              </span>
              <p className="text-[#1c1c1a] leading-relaxed">
                Located at exact coordinates{' '}
                <strong className="font-mono text-[#2e6059]">
                  {place.latitude.toFixed(4)}°N, {place.longitude.toFixed(4)}°E
                </strong>
                {place.country ? ` in ${place.country}.` : '.'}
              </p>
              <p className="text-[#73716b] text-[11px]">
                Part of the international open heritage cataloging index.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#e8e5de] space-y-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[#73716b] text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2e6059]" /> Institutional & Visitor Guidance
              </span>
              {place.officialUrl ? (
                <div className="space-y-1">
                  <p className="text-[#1c1c1a]">Official Institutional Portal Identified:</p>
                  <a
                    href={place.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#2e6059] font-medium hover:underline break-all"
                  >
                    <span>{place.officialUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              ) : (
                <p className="text-[#73716b] italic">
                  Specific operating hours and daily ticketing regulations vary seasonally. Refer to regional heritage registries before planning visits.
                </p>
              )}
            </div>
          </div>

          {/* Embedded Mini-Map showing actual site location */}
          {hasCoordinates && (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[#73716b] font-medium flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#2e6059]" /> Verified Map Location
              </span>
              <div className="h-56 rounded-xl overflow-hidden border border-[#e8e5de]">
                <DynamicMiniMap
                  places={[place]}
                  selectedPlaceId={place.id}
                  center={[place.latitude, place.longitude]}
                  zoom={12}
                />
              </div>
            </div>
          )}
        </div>

        {/* Catalog of reviewed factual statements */}
        {place.facts && place.facts.length > 0 && (
          <div className="bg-[#f7f5ee] border border-[#e8e5de] rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#73716b]">
              Documented Archival Record ({place.facts.length} Claims)
            </h3>
            <div className="space-y-2.5">
              {place.facts.map((fact) => (
                <div key={fact.id} className="p-3.5 bg-white rounded-xl border border-[#e8e5de] text-xs space-y-1.5 shadow-2xs">
                  <p className="text-[#1c1c1a] leading-relaxed">{fact.claim}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#73716b] pt-1 border-t border-[#faf8f4]">
                    <span className="font-medium text-[#73716b] truncate max-w-[70%]">
                      Source: {fact.sourceTitle}
                    </span>
                    <a
                      href={fact.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#2e6059] font-medium hover:underline shrink-0"
                    >
                      View Record <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  if (loading) {
    return (
      <div className="bg-white border border-[#e8e5de] rounded-2xl p-8 sm:p-14 text-center space-y-4 shadow-xs">
        <div className="w-8 h-8 border-2 border-[#2e6059] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#1c1c1a]">
            {mode === 'past'
              ? 'Chronologically synthesizing documented records...'
              : 'Constructing site-specific future horizon...'}
          </p>
          <p className="text-xs text-[#73716b]">
            Enforcing strict source ground-truth &amp; deduplicating evidence
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ERROR STATE
  // =========================================================================
  if (error) {
    return (
      <div className="bg-[#fdf5f2] border border-[#f2ded6] rounded-2xl p-6 sm:p-8 space-y-4 text-center">
        <AlertTriangle className="w-8 h-8 text-[#a3412a] mx-auto" />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-[#1c1c1a]">Generation Interrupted</h3>
          <p className="text-xs text-[#73716b] max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={() => fetchStory(mode, true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e8e5de] rounded-xl text-xs font-medium text-[#1c1c1a] hover:bg-[#f7f5ee] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Narrative
        </button>
      </div>
    );
  }

  // =========================================================================
  // PAST MODE: Grounded Narrative + Deduplicated Sources
  // =========================================================================
  if (mode === 'past' && pastData) {
    return (
      <div className="space-y-6">
        <article className="bg-white border border-[#e8e5de] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0eee6]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73716b]">
                Historical Chronicle &bull; 150–250 Words
              </span>
              {pastData.evidenceStatus === 'supported' ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#eef5f4] text-[#2e6059] font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Grounded in Verified Citations
                </span>
              ) : (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#fff6e6] text-[#996500] font-medium">
                  Limited Evidence
                </span>
              )}
            </div>

            {/* Speak Up Audio Button */}
            {ttsSupported && (
              <button
                onClick={() => handleSpeak(pastData.story)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto ${
                  isSpeaking
                    ? 'bg-[#2e6059] text-white shadow-2xs'
                    : 'bg-[#f4f1ea] text-[#1c1c1a] hover:bg-[#e8e5de]'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read narrative aloud'}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#2e6059]" />
                    <span>Speak Up</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="editorial-serif text-lg sm:text-xl leading-relaxed text-[#1c1c1a]">
            {pastData.story}
          </div>

          {pastData.isFallback && (
            <p className="text-xs text-[#73716b] italic border-t border-[#f0eee6] pt-3">
              Note: Offline inference fallback synthesized directly from verified archival records.
            </p>
          )}
        </article>

        {/* Deduplicated Clickable Sources Section directly below story */}
        <div className="bg-[#fbf9f5] border border-[#e8e5de] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#73716b]">
              Verified Source Records ({pastData.sources?.length || 0})
            </h3>
            <span className="text-[11px] text-[#73716b]">No duplicate URLs</span>
          </div>

          {pastData.sources && pastData.sources.length > 0 ? (
            <ul className="space-y-2">
              {pastData.sources.map((src, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl bg-white border border-[#e8e5de] shadow-2xs"
                >
                  <span className="text-[#1c1c1a] font-medium leading-relaxed">{src.title}</span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2e6059] font-medium hover:underline shrink-0"
                  >
                    Source Link <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#73716b]">No external citations available.</p>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // FUTURE MODE: Distinct Place-Specific Speculative Narrative
  // =========================================================================
  if (mode === 'future' && futureData) {
    return (
      <div className="space-y-6">
        <article className="bg-white border border-[#e8e5de] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f0eee6]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#73716b] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2e6059]" />
                Temporal Horizon
              </span>
              <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#f4f1ea] border border-[#e8e5de] text-[#73716b]">
                Imagined future — not a prediction
              </span>
            </div>

            {/* Speak Up Audio Button */}
            {ttsSupported && (
              <button
                onClick={() => handleSpeak(futureData.story)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto ${
                  isSpeaking
                    ? 'bg-[#2e6059] text-white shadow-2xs'
                    : 'bg-[#f4f1ea] text-[#1c1c1a] hover:bg-[#e8e5de]'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read narrative aloud'}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#2e6059]" />
                    <span>Speak Up</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="editorial-serif text-lg sm:text-xl leading-relaxed text-[#1c1c1a] italic">
            &ldquo;{futureData.story}&rdquo;
          </div>

          {futureData.assumptions && futureData.assumptions.length > 0 && (
            <div className="pt-4 border-t border-[#f0eee6] space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#73716b]">
                Underlying Speculative Premises
              </h4>
              <ul className="list-disc list-inside text-xs text-[#73716b] space-y-1.5 leading-relaxed">
                {futureData.assumptions.map((assump, idx) => (
                  <li key={idx} className="text-[#1c1c1a]">{assump}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    );
  }

  return null;
}
