'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Place } from '@/types';
import { MapPin, ArrowRight, ShieldCheck, Navigation } from 'lucide-react';

interface PlaceCardGridProps {
  places: Place[];
  selectedPlaceId?: string;
  onSelectPlace?: (place: Place) => void;
  isUserLocationActive?: boolean;
}

export default function PlaceCardGrid({
  places,
  selectedPlaceId,
  onSelectPlace,
  isUserLocationActive = false,
}: PlaceCardGridProps) {
  if (places.length === 0) {
    return (
      <div className="p-12 text-center border border-[#e8e5de] rounded-2xl bg-white shadow-xs max-w-lg mx-auto">
        <MapPin className="w-8 h-8 text-[#73716b] mx-auto mb-3 opacity-60" />
        <h3 className="font-medium text-[#1c1c1a] text-base mb-1">No Time Portals Found</h3>
        <p className="text-xs text-[#73716b] leading-relaxed">
          No landmarks matched your search. Try searching for a known ancient city, monument, or region (e.g. Rome, Athens, Peru).
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {places.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        const image = place.images && place.images.length > 0 ? place.images[0] : null;
        const verifiedFactsCount = place.facts?.length || 0;

        return (
          <div
            key={place.id}
            onClick={() => onSelectPlace && onSelectPlace(place)}
            className={`group flex flex-col justify-between rounded-2xl border bg-white overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-md ${
              isSelected
                ? 'border-[#2e6059] ring-2 ring-[#2e6059]/20 shadow-sm'
                : 'border-[#e8e5de] hover:border-[#b8b5ae]'
            }`}
          >
            <div>
              {/* Card Image */}
              <div className="relative h-48 w-full bg-[#f4f1ea] overflow-hidden">
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.caption || place.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#73716b] p-4 text-center">
                    <MapPin className="w-8 h-8 text-[#2e6059]/60 mb-2" />
                    <span className="text-xs font-mono uppercase tracking-wider">Historical Archive</span>
                  </div>
                )}

                {/* Country / Location Tag */}
                {place.country && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-medium text-[#1c1c1a] shadow-xs">
                    {place.country}
                  </div>
                )}

                {/* Distance Badge (only when user coordinates are valid) */}
                {isUserLocationActive && place.distanceKm !== undefined && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#2e6059] text-white text-[11px] font-medium shadow-xs flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>{place.distanceKm} km away</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="editorial-serif font-normal text-xl text-[#1c1c1a] group-hover:text-[#2e6059] transition-colors leading-snug">
                    {place.name}
                  </h3>
                </div>

                <p className="text-xs text-[#73716b] line-clamp-3 leading-relaxed">
                  {place.summary || 'A documented portal through time.'}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-5 pt-0 mt-3">
              <div className="pt-3 border-t border-[#f0eee6] flex items-center justify-between text-xs">
                {verifiedFactsCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2e6059]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{verifiedFactsCount} verified facts</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-[#73716b]">Public archive lead</span>
                )}

                <Link
                  href={`/place/${place.id}`}
                  className="inline-flex items-center gap-1 font-medium text-xs text-[#2e6059] group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Explore this place</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
