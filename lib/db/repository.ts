import { Place, StoryCache } from '@/types';
import { getDb } from './client';
import seedPlaces from '@/data/places.json';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'discovered_places.json');

// Helper to load persistent file-backed discovered places
function loadPersistentDiscoveredPlaces(): Map<string, Place> {
  const map = new Map<string, Place>();
  (seedPlaces as Place[]).forEach((p) => map.set(p.id, p));

  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed: Place[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((p) => map.set(p.id, p));
      }
    }
  } catch (err) {
    console.warn('Failed to read persistent discovered places file:', err);
  }
  return map;
}

function persistDiscoveredPlaceToFile(place: Place) {
  try {
    let currentList: Place[] = [];
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      currentList = JSON.parse(raw);
    }
    const idx = currentList.findIndex((p) => p.id === place.id);
    if (idx >= 0) {
      currentList[idx] = place;
    } else {
      currentList.push(place);
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(currentList, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist discovered place to file:', err);
  }
}

// In-memory runtime cache backed by seed data and discovered file
const inMemoryPlaces: Map<string, Place> = loadPersistentDiscoveredPlaces();
const inMemoryStories: StoryCache[] = [];

export async function getAllPlaces(): Promise<Place[]> {
  const db = await getDb();
  if (db) {
    try {
      const collection = db.collection<Place>('places');
      const count = await collection.countDocuments();
      if (count === 0) {
        await collection.insertMany(seedPlaces as Place[]);
      }
      const places = await collection.find({}).toArray();
      if (places.length > 0) {
        places.forEach((p) => inMemoryPlaces.set(p.id, p));
        return places;
      }
    } catch (e) {
      console.warn('MongoDB query error, falling back to local dataset:', e);
    }
  }

  return Array.from(inMemoryPlaces.values());
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const db = await getDb();
  if (db) {
    try {
      const collection = db.collection<Place>('places');
      const place = await collection.findOne({ id });
      if (place) {
        inMemoryPlaces.set(place.id, place);
        return place;
      }
    } catch (e) {
      console.warn('MongoDB query error for place ID, falling back:', e);
    }
  }

  // Reload file cache in case place was written by another process/worker
  if (!inMemoryPlaces.has(id)) {
    const reloaded = loadPersistentDiscoveredPlaces();
    if (reloaded.has(id)) {
      return reloaded.get(id) || null;
    }
  }

  return inMemoryPlaces.get(id) || null;
}

export async function savePlace(place: Place): Promise<void> {
  inMemoryPlaces.set(place.id, place);
  persistDiscoveredPlaceToFile(place);

  const db = await getDb();
  if (db) {
    try {
      const collection = db.collection<Place>('places');
      await collection.updateOne(
        { id: place.id },
        { $set: place },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Failed to upsert place in MongoDB:', e);
    }
  }
}

export async function getCachedStory(
  placeId: string,
  mode: 'past' | 'future',
  modelId: string
): Promise<StoryCache | null> {
  const db = await getDb();
  if (db) {
    try {
      const collection = db.collection<StoryCache>('story_cache');
      const cached = await collection.findOne({ placeId, mode, modelId });
      if (cached) return cached;
    } catch (e) {
      console.warn('MongoDB error querying story cache:', e);
    }
  }

  const found = inMemoryStories.find(
    (s) => s.placeId === placeId && s.mode === mode && s.modelId === modelId
  );
  return found || null;
}

export async function saveStoryCache(storyCache: StoryCache): Promise<void> {
  const existingIdx = inMemoryStories.findIndex(
    (s) =>
      s.placeId === storyCache.placeId &&
      s.mode === storyCache.mode &&
      s.modelId === storyCache.modelId
  );
  if (existingIdx >= 0) {
    inMemoryStories[existingIdx] = storyCache;
  } else {
    inMemoryStories.push(storyCache);
  }

  const db = await getDb();
  if (db) {
    try {
      const collection = db.collection<StoryCache>('story_cache');
      await collection.updateOne(
        {
          placeId: storyCache.placeId,
          mode: storyCache.mode,
          modelId: storyCache.modelId,
        },
        { $set: storyCache },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Failed to cache story in MongoDB:', e);
    }
  }
}
