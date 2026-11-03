import { Router } from "express";
import { ObjectId, type Db } from "mongodb";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { asyncHandler, ApiError, sendSuccess } from "../lib/http.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { updateProfileSchema } from "../validation/schemas.js";
import { serializeEvent, type EventDoc, type ParticipantDoc } from "../lib/serialize.js";

export function usersRouter(db: Db): Router {
  const router = Router();
  const events = db.collection<EventDoc>("events");
  const participants = db.collection<ParticipantDoc>("participants");

  /* GET /api/users/me */
  router.get(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = req.user!;
      sendSuccess(res, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          joinedAt: user.createdAt.toISOString(),
        },
      });
    }),
  );

  /* PUT /api/users/me/profile */
  router.put(
    "/me/profile",
    requireAuth,
    asyncHandler(async (req, res) => {
      const input = updateProfileSchema.parse(req.body);
      await auth.api.updateUser({
        headers: fromNodeHeaders(req.headers),
        body: { name: input.name, image: input.image ?? null },
      });
      if (req.user!.role === "organizer" && input.name !== req.user!.name) {
        await events.updateMany({ creatorId: req.user!.id }, { $set: { creatorName: input.name, updatedAt: new Date() } });
      }
      sendSuccess(res, {
        user: {
          id: req.user!.id,
          name: input.name,
          email: req.user!.email,
          image: input.image ?? null,
          role: req.user!.role,
          joinedAt: req.user!.createdAt.toISOString(),
        },
      });
    }),
  );

  /* GET /api/users/me/joined-events */
  router.get(
    "/me/joined-events",
    requireAuth,
    asyncHandler(async (req, res) => {
      const joined = await participants.find({ userId: req.user!.id }).sort({ joinedAt: -1 }).toArray();
      const eventIds = joined.map((p) => {
        try {
          return new ObjectId(p.eventId);
        } catch {
          return null;
        }
      });
      const validIds = eventIds.filter((x): x is NonNullable<typeof x> => x !== null);
      const docs = validIds.length ? await events.find({ _id: { $in: validIds } }).toArray() : [];
      const byId = new Map(docs.map((d) => [String(d._id), d]));
      const now = Date.now();
      const items = joined
        .map((p) => {
          const event = byId.get(p.eventId);
          if (!event) return null;
          return {
            participation: { eventId: p.eventId, joinedAt: new Date(p.joinedAt).toISOString() },
            event: serializeEvent(event),
            status: new Date(event.eventDate).getTime() > now ? "upcoming" : "completed",
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => new Date(a.event.eventDate).getTime() - new Date(b.event.eventDate).getTime());
      sendSuccess(res, { items, total: items.length });
    }),
  );

  /* GET /api/users/me/created-events — organizer only */
  router.get(
    "/me/created-events",
    requireAuth,
    requireRole("organizer"),
    asyncHandler(async (req, res) => {
      const docs = await events.find({ creatorId: req.user!.id }).sort({ eventDate: -1 }).toArray();
      sendSuccess(res, { events: docs.map(serializeEvent), total: docs.length });
    }),
  );

  /* GET /api/users/me/stats — role-aware dashboard payload */
  router.get(
    "/me/stats",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = req.user!;
      const now = new Date();

      if (user.role === "volunteer") {
        const joined = await participants.find({ userId: user.id }).sort({ joinedAt: -1 }).toArray();
        const ids = joined
          .map((p) => {
            try {
              return new ObjectId(p.eventId);
            } catch {
              return null;
            }
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
        const docs = ids.length ? await events.find({ _id: { $in: ids } }).toArray() : [];
        const byId = new Map(docs.map((d) => [String(d._id), d]));
        const upcoming = docs.filter((d) => new Date(d.eventDate) > now);
        const completed = docs.filter((d) => new Date(d.eventDate) <= now);
        const recentActivity = joined.slice(0, 6).flatMap((p) => {
          const event = byId.get(p.eventId);
          if (!event) return [];
          return [
            {
              type: "joined_event" as const,
              eventId: p.eventId,
              eventTitle: event.title,
              eventDate: new Date(event.eventDate).toISOString(),
              at: new Date(p.joinedAt).toISOString(),
            },
          ];
        });
        sendSuccess(res, {
          role: "volunteer",
          stats: { joinedTotal: joined.length, upcomingJoined: upcoming.length, completedParticipation: completed.length },
          upcomingEvents: upcoming
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
            .slice(0, 3)
            .map(serializeEvent),
          recentActivity,
        });
        return;
      }

      // Organizer
      const created = await events.find({ creatorId: user.id }).sort({ createdAt: -1 }).toArray();
      const createdIds = created.map((d) => String(d._id));
      const upcoming = created.filter((d) => new Date(d.eventDate) > now);
      const totalParticipants = created.reduce((sum, d) => sum + (d.participantCount ?? 0), 0);
      const recentJoins = createdIds.length
        ? await participants.find({ eventId: { $in: createdIds } }).sort({ joinedAt: -1 }).limit(6).toArray()
        : [];
      const userIds = [...new Set(recentJoins.map((p) => p.userId))];
      const userDocs = userIds.length
        ? await db.collection("user").find({ _id: { $in: userIds } } as never, { projection: { name: 1 } }).toArray()
        : [];
      const nameById = new Map(userDocs.map((u) => [String(u._id), u.name as string]));
      const eventById = new Map(created.map((d) => [String(d._id), d]));

      const activity = [
        ...created.slice(0, 6).map((d) => ({
          type: "created_event" as const,
          eventId: String(d._id),
          eventTitle: d.title,
          eventDate: new Date(d.eventDate).toISOString(),
          at: new Date(d.createdAt).toISOString(),
        })),
        ...recentJoins.flatMap((p) => {
          const event = eventById.get(p.eventId);
          if (!event) return [];
          return [
            {
              type: "participant_joined" as const,
              eventId: p.eventId,
              eventTitle: event.title,
              eventDate: new Date(event.eventDate).toISOString(),
              participantName: nameById.get(p.userId) ?? "A volunteer",
              at: new Date(p.joinedAt).toISOString(),
            },
          ];
        }),
      ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 6);

      sendSuccess(res, {
        role: "organizer",
        stats: { createdTotal: created.length, upcomingCreated: upcoming.length, totalParticipants },
        upcomingEvents: upcoming
          .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
          .slice(0, 3)
          .map(serializeEvent),
        recentActivity: activity,
      });
    }),
  );

  return router;
}
