'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Place } from '@/types';
import PlaceCardGrid from './PlaceCardGrid';
import { Search, Compass, AlertCircle, Sparkles, LocateFixed, Check, MapPin, X } from 'lucide-react';

// Dynamic import for Leaflet map to prevent SSR issues
const DynamicExploreMap = dynamic(() => import('./ExploreMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-[#f4f1ea] border border-[#e8e5de] rounded-2xl flex items-center justify-center text-[#73716b] text-sm animate-pulse">
      Loading interactive map...
    </div>
  ),
});

interface ExploreViewProps {
  initialPlaces: Place[];
}

export default function ExploreView({ initialPlaces }: ExploreViewProps) {
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [selectedPlace, setSelectedPlace] = useState<Place | undefined>(initialPlaces[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [currentZoom, setCurrentZoom] = useState(selectedPlace ? 5 : 2);
  const [center, setCenter] = useState<[number, number]>(
    selectedPlace && selectedPlace.latitude !== 0 ? [selectedPlace.latitude, selectedPlace.longitude] : [25, 20]
  );
  const [showMap, setShowMap] = useState(true);

  // Perform search (debounced or explicit)
  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setPlaces(initialPlaces);
      if (initialPlaces.length > 0) {
        setSelectedPlace(initialPlaces[0]);
        setCenter([initialPlaces[0].latitude, initialPlaces[0].longitude]);
      }
      return;
    }

    setIsSearching(true);
    setGeoError(null);

    try {
      let url = `/api/places/search?q=${encodeURIComponent(queryText)}`;
      if (userLocation) {
        url += `&lat=${userLocation[0]}&lon=${userLocation[1]}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.places) {
        setPlaces(data.places);
        if (data.places.length > 0) {
          const first = data.places[0];
          setSelectedPlace(first);
          if (first.latitude !== 0 || first.longitude !== 0) {
            setCenter([first.latitude, first.longitude]);
            setCurrentZoom(7);
          }
        }
      }
    } catch (err) {
      console.error('Search request failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleGeolocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        setGeoError(null);
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setCenter([latitude, longitude]);
        setCurrentZoom(6);

        // Fetch nearby places and reverse geocoded locality
        try {
          const res = await fetch(`/api/places/search?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.places && data.places.length > 0) {
            setPlaces(data.places);
            setSelectedPlace(data.places[0]);
          }
        } catch (err) {
          console.warn('Failed to fetch nearby geocoded places:', err);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was declined. Manual search is always available.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location information is currently unavailable on this device.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Location request timed out. Please try again or search manually.');
        } else {
          setGeoError('Unable to detect current position. Manual search remains available.');
        }
      },
      {
        enableHighAccuracy: false, // Prevents hanging on desktops without GPS hardware
        timeout: 8000,             // 8 seconds sensible timeout
        maximumAge: 120000,        // Allow cached location up to 2 mins
      }
    );
  };

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
    if (place.latitude !== 0 || place.longitude !== 0) {
      setCenter([place.latitude, place.longitude]);
      setCurrentZoom(7);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#eef5f4] text-[#2e6059] border border-[#d6eae7] text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TEMPORAL REALITY EXPLORER</span>
        </div>

        <h1 className="editorial-serif text-4xl sm:text-5xl lg:text-6xl text-[#1c1c1a] font-normal tracking-tight leading-[1.15]">
          Every Place Holds a Story.
        </h1>

        <p className="text-base sm:text-lg text-[#73716b] font-light leading-relaxed max-w-2xl mx-auto">
          Travel through the documented past and imagined future of places around you.
        </p>

        {/* Prominent Search Bar & Current Location */}
        <div className="pt-2 max-w-2xl mx-auto space-y-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl border border-[#e8e5de] shadow-sm hover:border-[#b8b5ae] transition-colors"
          >
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 text-[#73716b] ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any place, landmark, or ancient city..."
                className="w-full px-3 py-2.5 bg-transparent text-[#1c1c1a] text-sm placeholder:text-[#73716b]/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPlaces(initialPlaces);
                    if (initialPlaces.length > 0) {
                      handleSelectPlace(initialPlaces[0]);
                    }
                  }}
                  className="p-1 text-[#73716b] hover:text-[#1c1c1a] mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="submit"
                disabled={isSearching}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#2e6059] text-white rounded-xl text-sm font-medium hover:bg-[#254f49] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>

              <button
                type="button"
                onClick={handleGeolocation}
                disabled={isLocating}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fbf9f5] border border-[#e8e5de] text-[#1c1c1a] rounded-xl text-sm font-medium hover:bg-[#f0eee6] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                title="Detect current location"
              >
                {isLocating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#2e6059] border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Locating...</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-4 h-4 text-[#2e6059]" />
                    <span className="hidden sm:inline">Current Location</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Active Geolocation Feedback */}
          {userLocation && (
            <div className="flex items-center justify-center gap-2 text-xs text-[#2e6059] bg-[#eef5f4] px-4 py-2 rounded-xl border border-[#d6eae7] max-w-fit mx-auto">
              <Check className="w-3.5 h-3.5" />
              <span>
                Sorted by distance from your position ({userLocation[0].toFixed(2)}°, {userLocation[1].toFixed(2)}°)
              </span>
            </div>
          )}

          {/* Geolocation Notice / Error */}
          {geoError && !userLocation && (
            <div className="p-3 bg-[#fdf5f2] border border-[#f2ded6] rounded-xl flex items-center justify-center gap-2 text-xs text-[#a3412a]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{geoError}</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. COMPACT INTERACTIVE MAP SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#e8e5de]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#73716b]">
            <Compass className="w-4 h-4 text-[#2e6059]" />
            <span>Interactive Map Cartography</span>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs text-[#2e6059] hover:underline font-medium cursor-pointer"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {showMap && (
          <div className="h-[380px] sm:h-[420px] rounded-2xl overflow-hidden">
            <DynamicExploreMap
              places={places}
              selectedPlaceId={selectedPlace?.id}
              onSelectPlace={handleSelectPlace}
              center={center}
              zoom={currentZoom}
              userLocation={userLocation}
            />
          </div>
        )}
      </section>

      {/* 3. EXPLORE SECTION — 3-COLUMN RESPONSIVE GRID */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[#e8e5de]">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#73716b]">
              Cataloged Horizons
            </span>
            <h2 className="editorial-serif text-2xl sm:text-3xl text-[#1c1c1a] font-normal tracking-tight mt-0.5">
              Explore Available Portals ({places.length})
            </h2>
          </div>

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPlaces(initialPlaces);
                if (initialPlaces.length > 0) {
                  handleSelectPlace(initialPlaces[0]);
                }
              }}
              className="text-xs text-[#2e6059] hover:underline font-medium self-start sm:self-auto cursor-pointer"
            >
              Reset to All Places &rarr;
            </button>
          )}
        </div>

        <PlaceCardGrid
          places={places}
          selectedPlaceId={selectedPlace?.id}
          onSelectPlace={handleSelectPlace}
          isUserLocationActive={Boolean(userLocation)}
        />
      </section>
    </div>
  );
}
