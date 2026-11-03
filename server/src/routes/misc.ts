import { Router } from "express";
import type { Db } from "mongodb";
import { asyncHandler, sendSuccess } from "../lib/http.js";
import { contactSchema } from "../validation/schemas.js";
import { googleAuthEnabled } from "../config/env.js";
import type { EventDoc, ParticipantDoc } from "../lib/serialize.js";

export function statsRouter(db: Db): Router {
  const router = Router();
  let cache: { at: number; data: Record<string, number> } | null = null;

  /* GET /api/stats — honest platform statistics straight from the database. */
  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      if (cache && Date.now() - cache.at < 30_000) {
        sendSuccess(res, cache.data);
        return;
      }
      const now = new Date();
      const events = db.collection<EventDoc>("events");
      const participants = db.collection<ParticipantDoc>("participants");
      const [volunteers, eventCount, completedInitiatives] = await Promise.all([
        db.collection("user").countDocuments({ role: "volunteer" }),
        events.countDocuments({}),
        events.countDocuments({ eventDate: { $lt: now } }),
      ]);
      const completedIds = (await events.find({ eventDate: { $lt: now } }, { projection: { _id: 1 } }).toArray()).map((d) =>
        String(d._id),
      );
      const participationsInCompleted = completedIds.length
        ? await participants.countDocuments({ eventId: { $in: completedIds } })
        : 0;
      const data = {
        volunteers,
        events: eventCount,
        completedInitiatives,
        peopleImpacted: participationsInCompleted,
      };
      cache = { at: Date.now(), data };
      sendSuccess(res, data);
    }),
  );

  return router;
}

export function contactRouter(db: Db): Router {
  const router = Router();

  /* POST /api/contact — store a contact message. */
  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = contactSchema.parse(req.body);
      await db.collection("messages").insertOne({ ...input, createdAt: new Date() });
      sendSuccess(res, { received: true }, 201);
    }),
  );

  return router;
}

export function configRouter(): Router {
  const router = Router();

  /* GET /api/config — public, non-secret client configuration. */
  router.get("/", (_req, res) => {
    sendSuccess(res, { googleAuthEnabled });
  });

  return router;
}
