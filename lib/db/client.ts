import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
// Fast server selection timeout (1.5 seconds) so failure falls back instantly to local JSON
const options = {
  serverSelectionTimeoutMS: 1500,
  connectTimeoutMS: 2000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let connectionFailed = false;

export async function getDb(): Promise<Db | null> {
  if (!uri || connectionFailed) {
    return null;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
        _mongoFailed?: boolean;
      };

      if (globalWithMongo._mongoFailed) {
        return null;
      }

      if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
      }
      clientPromise = globalWithMongo._mongoClientPromise;
    } else {
      if (!clientPromise) {
        client = new MongoClient(uri, options);
        clientPromise = client.connect();
      }
    }

    const connectedClient = await clientPromise;
    return connectedClient.db('afterworld');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Database] MongoDB Atlas unavailable (${errorMsg.slice(0, 80)}...). Seamlessly falling back to curated local dataset.`);
    connectionFailed = true;
    if (process.env.NODE_ENV === 'development') {
      (global as typeof globalThis & { _mongoFailed?: boolean })._mongoFailed = true;
    }
    return null;
  }
}
