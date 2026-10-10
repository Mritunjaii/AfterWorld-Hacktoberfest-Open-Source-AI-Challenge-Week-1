'use client';

import React from 'react';
import Link from 'next/link';
import { Place } from '@/types';
import { MapPin, ArrowRight } from 'lucide-react';

interface PlaceListProps {
  places: Place[];
  selectedPlaceId?: string;
  onSelectPlace?: (place: Place) => void;
}

export default function PlaceList({
  places,
  selectedPlaceId,
  onSelectPlace,
}: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div className="p-6 text-center border border-[#e8e5de] rounded-xl bg-white text-[#73716b]">
        <p className="text-sm">No places found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {places.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        return (
          <div
            key={place.id}
            onClick={() => onSelectPlace && onSelectPlace(place)}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
              isSelected
                ? 'border-[#2e6059] bg-[#eef5f4]/50 shadow-sm'
                : 'border-[#e8e5de] bg-white hover:border-[#b8b5ae]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-medium text-[#1c1c1a] text-base leading-snug flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#2e6059] shrink-0" />
                  {place.name}
                </h3>
                <span className="text-xs text-[#73716b] font-mono shrink-0">
                  {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°
                </span>
              </div>
              <p className="text-xs text-[#73716b] line-clamp-2 leading-relaxed">
                {place.summary}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f0eee6] flex items-center justify-between text-xs">
              <span className="text-[#73716b]">
                {place.facts?.length || 0} verified facts
              </span>
              <Link
                href={`/place/${place.id}`}
                className="inline-flex items-center gap-1 font-medium text-[#2e6059] hover:underline"
              >
                Open Time Portal
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
