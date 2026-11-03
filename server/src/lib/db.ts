import { MongoClient, type Db } from "mongodb";
import { env } from "../config/env.js";

/**
 * A single MongoClient is cached on the module (and on globalThis so hot
 * reloads / serverless invocations reuse the connection pool).
 */
const globalForMongo = globalThis as unknown as {
  __kindoraMongoClient?: MongoClient;
  __kindoraMongoClientPromise?: Promise<MongoClient>;
};

export async function connectDb(): Promise<Db> {
  if (!globalForMongo.__kindoraMongoClientPromise) {
    const client = new MongoClient(env.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    });
    globalForMongo.__kindoraMongoClient = client;
    globalForMongo.__kindoraMongoClientPromise = client.connect();
  }
  const client = await globalForMongo.__kindoraMongoClientPromise;
  return client.db(env.mongoDbName);
}

let indexesReady: Promise<void> | null = null;

/** Idempotent index creation for application + auth collections. */
export function ensureIndexes(db: Db): Promise<void> {
  if (!indexesReady) {
    indexesReady = (async () => {
      await db.collection("participants").createIndex({ eventId: 1, userId: 1 }, { unique: true, name: "uniq_event_user" });
      await db.collection("participants").createIndex({ userId: 1, joinedAt: -1 }, { name: "user_recent" });
      await db.collection("events").createIndex({ eventDate: 1 }, { name: "event_date" });
      await db.collection("events").createIndex({ eventType: 1, eventDate: 1 }, { name: "category_date" });
      await db.collection("events").createIndex({ creatorId: 1, createdAt: -1 }, { name: "creator_recent" });
      await db.collection("messages").createIndex({ createdAt: -1 }, { name: "messages_recent" });
      await db.collection("user").createIndex({ email: 1 }, { unique: true, name: "uniq_email" });
      await db.collection("session").createIndex({ token: 1 }, { unique: true, name: "uniq_session_token" });
      await db.collection("session").createIndex({ userId: 1 }, { name: "session_user" });
      await db.collection("account").createIndex({ userId: 1 }, { name: "account_user" });
      await db.collection("verification").createIndex({ identifier: 1 }, { name: "verification_identifier" });
    })().catch((err) => {
      indexesReady = null;
      throw err;
    });
  }
  return indexesReady;
}
