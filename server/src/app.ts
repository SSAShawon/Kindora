import express from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { connectDb, ensureIndexes } from "./lib/db.js";
import { env } from "./config/env.js";
import { eventsRouter } from "./routes/events.js";
import { usersRouter } from "./routes/users.js";
import { statsRouter, contactRouter, configRouter } from "./routes/misc.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = new Set([env.clientOrigin, env.authUrl, "http://localhost:3000", "http://localhost:5000"]);
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin / server-to-server requests have no Origin header.
      if (!origin || allowedOrigins.has(origin) || /^https?:\/\/[\w-]+\.e2b\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Better Auth handles its own body parsing — mount it before express.json().
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));

const db = await connectDb();
await ensureIndexes(db);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", service: "kindora-api", time: new Date().toISOString() } });
});

app.use("/api/events", eventsRouter(db));
app.use("/api/users", usersRouter(db));
app.use("/api/stats", statsRouter(db));
app.use("/api/contact", contactRouter(db));
app.use("/api/config", configRouter());

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
