import { getAllPlaces } from '@/lib/db/repository';
import ExploreView from '@/components/ExploreView';

export const revalidate = 60;

export default async function HomePage() {
  const places = await getAllPlaces();

  return <ExploreView initialPlaces={places} />;
}
