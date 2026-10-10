'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Place } from '@/types';
import TimeTabs, { TimeMode } from '@/components/TimeTabs';
import StoryPanel from '@/components/StoryPanel';
import { ArrowLeft, MapPin, Globe, ShieldCheck } from 'lucide-react';

interface PlaceDetailClientProps {
  place: Place;
}

export default function PlaceDetailClient({ place }: PlaceDetailClientProps) {
  const [currentMode, setCurrentMode] = useState<TimeMode>('past');
  const image = place.images && place.images.length > 0 ? place.images[0] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back Navigation Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#73716b] hover:text-[#1c1c1a] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to All Portals</span>
        </Link>
      </div>

      {/* Header Overview Card */}
      <header className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#2e6059] font-medium">
            <span className="inline-flex items-center gap-1 bg-[#eef5f4] px-2.5 py-1 rounded-full border border-[#d6eae7]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°</span>
            </span>
            {place.country && (
              <span className="inline-flex items-center gap-1 bg-[#f4f1ea] text-[#1c1c1a] px-2.5 py-1 rounded-full border border-[#e8e5de]">
                <Globe className="w-3.5 h-3.5 text-[#73716b]" />
                <span>{place.country}</span>
              </span>
            )}
            {place.facts && place.facts.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[#2e6059]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{place.facts.length} verified citations</span>
              </span>
            )}
          </div>

          <h1 className="editorial-serif text-3xl sm:text-4xl lg:text-5xl text-[#1c1c1a] font-normal tracking-tight">
            {place.name}
          </h1>

          {place.summary && (
            <p className="text-base text-[#73716b] leading-relaxed max-w-2xl font-light">
              {place.summary}
            </p>
          )}
        </div>

        {/* Feature Image with Attributions */}
        {image && (
          <div className="relative rounded-2xl overflow-hidden border border-[#e8e5de] bg-[#f0eee6] shadow-xs">
            <div className="relative h-72 sm:h-96 w-full">
              <Image
                src={image.url}
                alt={image.caption || place.name}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            <div className="p-3.5 bg-white/95 border-t border-[#e8e5de] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#73716b] gap-1">
              <span className="font-medium text-[#1c1c1a]">{image.caption || place.name}</span>
              <span>
                Photograph: {image.credit} &bull; {image.license || 'Licensed'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Sticky Time Tabs Navigation */}
      <div className="sticky top-18 z-30 pt-2 pb-2 bg-[#fbf9f5]/95 backdrop-blur-md">
        <TimeTabs currentMode={currentMode} onSelectMode={setCurrentMode} />
      </div>

      {/* Story & Evidence Narrative Panel */}
      <main>
        <StoryPanel place={place} mode={currentMode} />
      </main>
    </div>
  );
}
