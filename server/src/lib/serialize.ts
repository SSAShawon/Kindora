import { ObjectId, type WithId, type Document } from "mongodb";

export interface EventDoc extends Document {
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  eventDate: Date;
  creatorId: string;
  creatorName: string;
  participantCount: number;
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantDoc extends Document {
  eventId: string;
  userId: string;
  joinedAt: Date;
}

export interface EventDTO {
  id: string;
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  eventDate: string;
  creatorId: string;
  creatorName: string;
  participantCount: number;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export function serializeEvent(doc: WithId<EventDoc>): EventDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    eventType: doc.eventType,
    thumbnail: doc.thumbnail,
    location: doc.location,
    eventDate: new Date(doc.eventDate).toISOString(),
    creatorId: doc.creatorId,
    creatorName: doc.creatorName,
    participantCount: doc.participantCount ?? 0,
    isSample: Boolean(doc.isSample),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/** Better Auth stores ids as strings; accept ObjectId-shaped ids defensively. */
export function idVariants(id: string): (string | ObjectId)[] {
  const variants: (string | ObjectId)[] = [id];
  if (/^[a-f0-9]{24}$/i.test(id)) variants.push(new ObjectId(id));
  return variants;
}

export function toObjectId(id: string): ObjectId {
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    throw new Error("Invalid id format");
  }
  return new ObjectId(id);
}
