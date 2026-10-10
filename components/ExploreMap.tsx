'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '@/types';
import Link from 'next/link';
import { INDIA_BOUNDARY } from 'leaflet-india-boundary';

// Fix leaflet default marker icons in Next.js
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapRecenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

interface ExploreMapProps {
  places: Place[];
  selectedPlaceId?: string;
  onSelectPlace?: (place: Place) => void;
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
}

export default function ExploreMap({
  places,
  selectedPlaceId,
  onSelectPlace,
  center = [20, 0],
  zoom = 2,
  userLocation = null,
}: ExploreMapProps) {
  const validPlaces = places.filter((p) => p.latitude !== 0 || p.longitude !== 0);

  return (
    <div className="w-full h-full min-h-[380px] relative rounded-2xl overflow-hidden border border-[#e8e5de] bg-[#f4f1ea] shadow-xs">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[380px] z-10"
      >
        <MapRecenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | Survey of India Official Boundaries'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Official Survey of India Sovereign Boundary Overlay */}
        <GeoJSON
          data={INDIA_BOUNDARY as any}
          style={() => ({
            color: '#C6B2BF',
            weight: 3,
            opacity: 1,
          })}
        />

        {/* User location indicator */}
        {userLocation && (
          <>
            <CircleMarker
              center={userLocation}
              radius={8}
              pathOptions={{ color: '#2e6059', fillColor: '#2e6059', fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div className="text-xs font-medium p-1 text-[#2e6059]">
                  📍 Your Detected Location
                </div>
              </Popup>
            </CircleMarker>
            <CircleMarker
              center={userLocation}
              radius={26}
              pathOptions={{ color: '#2e6059', fillColor: '#2e6059', fillOpacity: 0.15, weight: 1 }}
            />
          </>
        )}

        {/* Landmark places markers */}
        {validPlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={customIcon}
              eventHandlers={{
                click: () => onSelectPlace && onSelectPlace(place),
              }}
            >
              <Popup>
                <div className="text-xs p-1 max-w-[210px] space-y-1.5">
                  <div>
                    {place.country && (
                      <span className="text-[10px] uppercase tracking-wider text-[#73716b] font-medium block">
                        {place.country}
                      </span>
                    )}
                    <strong className="block font-medium text-[#1c1c1a] text-sm">{place.name}</strong>
                  </div>
                  <p className="text-[#73716b] text-[11px] line-clamp-2 leading-relaxed">{place.summary}</p>
                  <Link
                    href={`/place/${place.id}`}
                    className="inline-flex items-center gap-1 text-[#2e6059] font-medium text-xs hover:underline pt-1"
                  >
                    Open Temporal Portal &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
