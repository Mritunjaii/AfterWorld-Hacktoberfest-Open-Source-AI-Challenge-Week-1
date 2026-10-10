import { notFound } from 'next/navigation';
import { getPlaceById, getAllPlaces, savePlace } from '@/lib/db/repository';
import { searchWikipediaFacts } from '@/lib/sources/wikipedia';
import PlaceDetailClient from '@/components/PlaceDetailClient';
import { Place } from '@/types';

export const dynamic = 'force-dynamic';

interface PlacePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const places = await getAllPlaces();
  return places.map((place) => ({
    id: place.id,
  }));
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { id } = await params;
  let place = await getPlaceById(id);

  // If place is not found in cache (e.g. newly discovered link clicked directly)
  if (!place) {
    // Attempt on-the-fly resolution from ID if it follows discovered format
    const cleanId = decodeURIComponent(id);
    const placeName = cleanId
      .replace(/^(discovered-|nearby-|wiki-)/, '')
      .replace(/--[a-z0-9]+$/, '')
      .replace(/-[a-z0-9]+$/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    if (placeName && placeName.length > 2) {
      try {
        const wikiData = await searchWikipediaFacts(placeName);
        if (wikiData.summary && wikiData.facts.length > 0) {
          const autoCreated: Place = {
            id: cleanId,
            name: placeName,
            country: 'Historical Landmark',
            latitude: 0,
            longitude: 0,
            summary: wikiData.summary,
            presentContext: `Discovered from public records. Documented historical landmark.`,
            facts: wikiData.facts,
          };
          await savePlace(autoCreated);
          place = autoCreated;
        }
      } catch (err) {
        console.warn('On-the-fly place resolution failed:', err);
      }
    }
  }

  if (!place) {
    notFound();
  }

  return <PlaceDetailClient place={place} />;
}
