import { Router } from "express";
import type { Db, Filter, Sort } from "mongodb";
import { asyncHandler, ApiError, sendSuccess, escapeRegex } from "../lib/http.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { createEventSchema, listEventsQuerySchema, updateEventSchema } from "../validation/schemas.js";
import { serializeEvent, idVariants, toObjectId, type EventDoc, type ParticipantDoc } from "../lib/serialize.js";

export function eventsRouter(db: Db): Router {
  const router = Router();
  const events = db.collection<EventDoc>("events");
  const participants = db.collection<ParticipantDoc>("participants");
  const users = db.collection("user");

  async function findEventOrThrow(id: string) {
    let objectId;
    try {
      objectId = toObjectId(id);
    } catch {
      throw new ApiError(404, "EVENT_NOT_FOUND", "This event could not be found.");
    }
    const event = await events.findOne({ _id: objectId });
    if (!event) throw new ApiError(404, "EVENT_NOT_FOUND", "This event could not be found.");
    return event;
  }

  /* ---------------------------------------------------------------- */
  /* GET /api/events — search + category + status + sort + pagination  */
  /* ---------------------------------------------------------------- */
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = listEventsQuerySchema.parse(req.query);
      const filter: Filter<EventDoc> = {};
      const now = new Date();

      if (query.status === "upcoming") filter.eventDate = { $gte: now };
      else if (query.status === "past") filter.eventDate = { $lt: now };

      if (query.category !== "All Events") filter.eventType = query.category;

      if (query.search) {
        const rx = { $regex: escapeRegex(query.search), $options: "i" };
        filter.$or = [{ title: rx }, { description: rx }, { location: rx }, { creatorName: rx }];
      }

      const sort: Sort =
        query.sort === "newest"
          ? { createdAt: -1 }
          : query.sort === "popular"
            ? { participantCount: -1, eventDate: 1 }
            : { eventDate: 1 };

      const skip = (query.page - 1) * query.limit;
      const [docs, total] = await Promise.all([
        events.find(filter).sort(sort).skip(skip).limit(query.limit).toArray(),
        events.countDocuments(filter),
      ]);

      sendSuccess(res, {
        events: docs.map(serializeEvent),
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      });
    }),
  );

  /* ---------------------------------------------------------------- */
  /* GET /api/events/featured — next upcoming events                   */
  /* ---------------------------------------------------------------- */
  router.get(
    "/featured",
    asyncHandler(async (_req, res) => {
      const docs = await events
        .find({ eventDate: { $gte: new Date() } })
        .sort({ eventDate: 1 })
        .limit(3)
        .toArray();
      sendSuccess(res, { events: docs.map(serializeEvent) });
    }),
  );

  /* ---------------------------------------------------------------- */
  /* GET /api/events/:id — details + viewer context                    */
  /* ---------------------------------------------------------------- */
  router.get(
    "/:id",
    optionalAuth,
    asyncHandler(async (req, res) => {
      const event = await findEventOrThrow(req.params.id);
      const organizer = await users.findOne(
        { _id: { $in: idVariants(event.creatorId) } } as never,
        { projection: { name: 1, image: 1 } },
      );
      let viewerJoined = false;
      if (req.user) {
        const participation = await participants.findOne({ eventId: String(event._id), userId: req.user.id });
        viewerJoined = Boolean(participation);
      }
      sendSuccess(res, {
        event: serializeEvent(event),
        organizer: {
          id: event.creatorId,
          name: (organizer?.name as string) ?? event.creatorName,
          image: (organizer?.image as string | null) ?? null,
        },
        viewerJoined,
        isOwner: req.user?.id === event.creatorId,
      });
    }),
  );

  /* ---------------------------------------------------------------- */
  /* POST /api/events — organizer only                                 */
  /* ---------------------------------------------------------------- */
  router.post(
    "/",
    requireAuth,
    requireRole("organizer"),
    asyncHandler(async (req, res) => {
      const input = createEventSchema.parse(req.body);
      const now = new Date();
      const doc: EventDoc = {
        ...input,
        creatorId: req.user!.id,
        creatorName: req.user!.name,
        participantCount: 0,
        isSample: false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await events.insertOne(doc as never);
      sendSuccess(res, { event: serializeEvent({ ...doc, _id: result.insertedId } as never) }, 201);
    }),
  );

  /* ---------------------------------------------------------------- */
  /* PUT /api/events/:id — organizer, own events only                  */
  /* ---------------------------------------------------------------- */
  router.put(
    "/:id",
    requireAuth,
    requireRole("organizer"),
    asyncHandler(async (req, res) => {
      const existing = await findEventOrThrow(req.params.id);
      if (existing.creatorId !== req.user!.id) {
        throw new ApiError(403, "NOT_EVENT_OWNER", "You can only edit events you created.");
      }
      const input = updateEventSchema.parse(req.body);
      if (input.eventDate.getTime() !== new Date(existing.eventDate).getTime() && input.eventDate.getTime() <= Date.now()) {
        throw new ApiError(400, "VALIDATION_ERROR", "When rescheduling, the new event date must be in the future.", {
          eventDate: ["When rescheduling, the new event date must be in the future."],
        });
      }
      const updated = {
        ...existing,
        ...input,
        creatorName: req.user!.name,
        updatedAt: new Date(),
      };
      await events.updateOne({ _id: existing._id }, { $set: { ...input, creatorName: req.user!.name, updatedAt: new Date() } });
      sendSuccess(res, { event: serializeEvent(updated) });
    }),
  );

  /* ---------------------------------------------------------------- */
  /* DELETE /api/events/:id — organizer, own events only               */
  /* ---------------------------------------------------------------- */
  router.delete(
    "/:id",
    requireAuth,
    requireRole("organizer"),
    asyncHandler(async (req, res) => {
      const existing = await findEventOrThrow(req.params.id);
      if (existing.creatorId !== req.user!.id) {
        throw new ApiError(403, "NOT_EVENT_OWNER", "You can only delete events you created.");
      }
      await events.deleteOne({ _id: existing._id });
      await participants.deleteMany({ eventId: String(existing._id) });
      sendSuccess(res, { deleted: true, id: String(existing._id) });
    }),
  );

  /* ---------------------------------------------------------------- */
  /* POST /api/events/:id/join — volunteers, once, future events       */
  /* ---------------------------------------------------------------- */
  router.post(
    "/:id/join",
    requireAuth,
    requireRole("volunteer"),
    asyncHandler(async (req, res) => {
      const event = await findEventOrThrow(req.params.id);
      if (new Date(event.eventDate).getTime() <= Date.now()) {
        throw new ApiError(400, "EVENT_STARTED", "This event has already started and can no longer be joined.");
      }
      if (event.creatorId === req.user!.id) {
        throw new ApiError(400, "OWN_EVENT", "You cannot join an event you created.");
      }
      const eventId = String(event._id);
      const existing = await participants.findOne({ eventId, userId: req.user!.id });
      if (existing) {
        throw new ApiError(409, "ALREADY_JOINED", "You have already joined this event.");
      }
      try {
        await participants.insertOne({ eventId, userId: req.user!.id, joinedAt: new Date() } as never);
      } catch (err) {
        if ((err as { code?: number }).code === 11000) {
          throw new ApiError(409, "ALREADY_JOINED", "You have already joined this event.");
        }
        throw err;
      }
      await events.updateOne({ _id: event._id }, { $inc: { participantCount: 1 } });
      sendSuccess(res, { joined: true, participantCount: (event.participantCount ?? 0) + 1 }, 201);
    }),
  );

  /* ---------------------------------------------------------------- */
  /* DELETE /api/events/:id/join — cancel before the event starts      */
  /* ---------------------------------------------------------------- */
  router.delete(
    "/:id/join",
    requireAuth,
    asyncHandler(async (req, res) => {
      const event = await findEventOrThrow(req.params.id);
      if (new Date(event.eventDate).getTime() <= Date.now()) {
        throw new ApiError(400, "EVENT_STARTED", "Participation can only be cancelled before the event starts.");
      }
      const result = await participants.deleteOne({ eventId: String(event._id), userId: req.user!.id });
      if (result.deletedCount === 0) {
        throw new ApiError(404, "NOT_JOINED", "You are not a participant of this event.");
      }
      await events.updateOne({ _id: event._id }, { $inc: { participantCount: -1 } });
      sendSuccess(res, { joined: false, participantCount: Math.max(0, (event.participantCount ?? 0) - 1) });
    }),
  );

  /* ---------------------------------------------------------------- */
  /* GET /api/events/:id/participants — public, privacy-safe           */
  /* ---------------------------------------------------------------- */
  router.get(
    "/:id/participants",
    asyncHandler(async (req, res) => {
      const event = await findEventOrThrow(req.params.id);
      const joined = await participants.find({ eventId: String(event._id) }).sort({ joinedAt: 1 }).toArray();
      const userIds = [...new Set(joined.map((p) => p.userId))];
      const userDocs = userIds.length
        ? await users.find({ _id: { $in: userIds.flatMap(idVariants) } } as never, { projection: { name: 1, image: 1 } }).toArray()
        : [];
      const byId = new Map(userDocs.map((u) => [String(u._id), u]));
      sendSuccess(res, {
        total: joined.length,
        participants: joined.map((p) => {
          const u = byId.get(p.userId);
          return {
            userId: p.userId,
            name: (u?.name as string) ?? "Kindora Member",
            image: (u?.image as string | null) ?? null,
            joinedAt: new Date(p.joinedAt).toISOString(),
          };
        }),
      });
    }),
  );

  return router;
}
