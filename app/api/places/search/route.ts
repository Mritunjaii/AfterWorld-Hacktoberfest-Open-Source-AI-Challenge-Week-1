import { NextRequest, NextResponse } from 'next/server';
import { getAllPlaces, savePlace } from '@/lib/db/repository';
import { searchWikipediaFacts } from '@/lib/sources/wikipedia';
import { Place } from '@/types';

// Rate limiting: ip -> timestamp
const rateLimitMap = new Map<string, number>();

// Calculate distance in kilometers using Haversine formula
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip) || 0;
    if (now - lastRequest < 150) {
      return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 });
    }
    rateLimitMap.set(ip, now);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const userLat = latParam ? parseFloat(latParam) : null;
    const userLon = lonParam ? parseFloat(lonParam) : null;

    const allPlaces = await getAllPlaces();

    // 1. NEARBY QUERY (lat & lon provided, no text query)
    if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon) && !query) {
      try {
        // Reverse geocode to find user's current city/area
        const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLon}&format=json&zoom=10`;
        const revRes = await fetch(revUrl, {
          headers: { 'User-Agent': 'Afterworld/1.0 (temporal-place-portal)' },
          next: { revalidate: 3600 },
        });

        let nearbyPlaceName = '';
        if (revRes.ok) {
          const revData = await revRes.json();
          nearbyPlaceName = revData.address?.city || revData.address?.town || revData.address?.county || revData.address?.state || '';
        }

        // If a nearby city was discovered and not in places, fetch Wikipedia historical facts
        if (nearbyPlaceName && nearbyPlaceName.length > 2) {
          const slug = nearbyPlaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const existing = allPlaces.find((p) => p.name.toLowerCase().includes(nearbyPlaceName.toLowerCase()));

          if (!existing) {
            const wikiData = await searchWikipediaFacts(nearbyPlaceName);
            if (wikiData.summary && wikiData.facts.length > 0) {
              const discoveredNearby: Place = {
                id: `nearby-${slug}-${Date.now().toString(36)}`,
                name: nearbyPlaceName,
                country: 'Local Horizon',
                latitude: userLat,
                longitude: userLon,
                summary: wikiData.summary,
                presentContext: `Located in your immediate geographic vicinity (${userLat.toFixed(3)}°, ${userLon.toFixed(3)}°).`,
                facts: wikiData.facts,
                distanceKm: 0,
              };
              await savePlace(discoveredNearby);
              allPlaces.unshift(discoveredNearby);
            }
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding error:', err);
      }

      // Calculate exact distance for all places
      const placesWithDistance: Place[] = allPlaces.map((p) => {
        const dist = (p.latitude !== 0 || p.longitude !== 0)
          ? calculateHaversineKm(userLat, userLon, p.latitude, p.longitude)
          : undefined;
        return { ...p, distanceKm: dist };
      });

      // Sort ascending by distance
      placesWithDistance.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));

      return NextResponse.json({ places: placesWithDistance, isUserLocation: true });
    }

    // 2. EMPTY QUERY (standard homepage request)
    if (!query) {
      return NextResponse.json({ places: allPlaces });
    }

    // 3. TEXT SEARCH
    const lower = query.toLowerCase();
    const matchedCurated = allPlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.country && p.country.toLowerCase().includes(lower)) ||
        (p.summary && p.summary.toLowerCase().includes(lower))
    );

    if (matchedCurated.length > 0) {
      if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
        const enriched = matchedCurated.map((p) => ({
          ...p,
          distanceKm: (p.latitude !== 0 || p.longitude !== 0)
            ? calculateHaversineKm(userLat, userLon, p.latitude, p.longitude)
            : undefined,
        }));
        return NextResponse.json({ places: enriched });
      }
      return NextResponse.json({ places: matchedCurated });
    }

    // 4. DISCOVER VIA NOMINATIM GEOCODING + WIKIPEDIA
    if (query.length >= 2) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`;
        const nomRes = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'Afterworld/1.0 (temporal-place-portal)' },
          next: { revalidate: 86400 },
        });

        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0) {
            const bestHit = nomData[0];
            const hitLat = parseFloat(bestHit.lat);
            const hitLon = parseFloat(bestHit.lon);
            const displayNameParts = bestHit.display_name.split(',');
            const rawNominatimName = (bestHit.name || displayNameParts[0]).trim();
            const country = displayNameParts[displayNameParts.length - 1].trim();

            // Prioritize the specific place/landmark first:
            // 1. User's explicit query (e.g. "Rumi Darwaza")
            // 2. Specific Nominatim landmark name (e.g. "Rumi Gate")
            // 3. First segment of display name
            // 4. Fallback to larger city/region only if the specific place cannot be documented
            const searchCandidates = [
              query,
              rawNominatimName,
              displayNameParts[0].trim(),
              displayNameParts.length > 3 ? displayNameParts[3].trim() : '', // city fallback (e.g. "Lucknow")
            ].filter((c, i, arr) => c && c.length >= 2 && arr.indexOf(c) === i);

            let wikiData = { title: '', summary: '', facts: [] as any[], sourceUrl: '', officialUrl: undefined as string | undefined, presentContext: '' };
            let resolvedName = query;

            for (const candidate of searchCandidates) {
              const res = await searchWikipediaFacts(candidate);
              if (res.summary && res.facts && res.facts.length > 0) {
                wikiData = res;
                resolvedName = res.title || candidate;
                break;
              }
            }

            if (!resolvedName) {
              resolvedName = rawNominatimName || query;
            }

            const slug = resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const discoveredPlace: Place = {
              id: `discovered-${slug}-${Date.now().toString(36)}`,
              name: resolvedName,
              country: country || 'Historical Site',
              latitude: hitLat,
              longitude: hitLon,
              summary: wikiData.summary || `Historical landmark identified at ${bestHit.display_name}.`,
              presentContext: wikiData.presentContext || `Documented landmark located at coordinates ${hitLat.toFixed(4)}°, ${hitLon.toFixed(4)}°.`,
              officialUrl: wikiData.officialUrl,
              facts: wikiData.facts.length > 0 ? wikiData.facts : [
                {
                  id: `nom-${Date.now()}`,
                  claim: `Geographically cataloged at ${bestHit.display_name}.`,
                  sourceTitle: 'OpenStreetMap / Nominatim Geographic Database',
                  sourceUrl: `https://www.openstreetmap.org/?mlat=${hitLat}&mlon=${hitLon}`,
                  confidence: 'high',
                },
              ],
              distanceKm: userLat && userLon ? calculateHaversineKm(userLat, userLon, hitLat, hitLon) : undefined,
            };

            await savePlace(discoveredPlace);
            return NextResponse.json({ places: [discoveredPlace] });
          }
        }
      } catch (nomErr) {
        console.warn('Nominatim discovery error:', nomErr);
      }

      // Wikipedia direct fallback
      const wikiFallback = await searchWikipediaFacts(query);
      if (wikiFallback.summary && wikiFallback.facts.length > 0) {
        const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const discoveredPlace: Place = {
          id: `wiki-${slug}-${Date.now().toString(36)}`,
          name: query.charAt(0).toUpperCase() + query.slice(1),
          country: 'Documented Landmark',
          latitude: 0,
          longitude: 0,
          summary: wikiFallback.summary,
          presentContext: `Discovered from public records. Verified via Wikipedia citations.`,
          facts: wikiFallback.facts,
        };
        await savePlace(discoveredPlace);
        return NextResponse.json({ places: [discoveredPlace] });
      }
    }

    return NextResponse.json({ places: [] });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
