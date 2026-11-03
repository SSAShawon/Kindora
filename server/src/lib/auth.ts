import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { env, googleAuthEnabled } from "../config/env.js";
import { connectDb, ensureIndexes } from "./db.js";

export const ROLES = ["volunteer", "organizer"] as const;
export type Role = (typeof ROLES)[number];

const db = await connectDb();
await ensureIndexes(db);

/**
 * Better Auth — email/password + optional Google OAuth, MongoDB adapter,
 * database-backed sessions with a short-lived signed cookie cache.
 */
export const auth = betterAuth({
  appName: "Kindora",
  baseURL: env.authUrl,
  secret: env.authSecret,
  database: mongodbAdapter(db),
  trustedOrigins: [
    env.clientOrigin,
    env.authUrl,
    "http://localhost:3000",
    "http://localhost:5000",
    // Sandbox live-preview origins (development convenience only).
    "https://*.e2b.app",
    "http://*.e2b.app",
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders: googleAuthEnabled
    ? {
        google: {
          clientId: env.googleClientId,
          clientSecret: env.googleClientSecret,
        },
      }
    : undefined,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh expiry at most once per day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "volunteer",
        // Clients cannot set `role` through any Better Auth endpoint
        // (sign-up input is parsed with the default, update attempts are
        // rejected). The requested role is read from the sign-up request
        // body inside the create hook below and strictly validated there.
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const body = (context as { body?: Record<string, unknown> } | undefined)?.body;
          const requested = body?.role;
          const role =
            typeof requested === "string" && (ROLES as readonly string[]).includes(requested)
              ? requested
              : "volunteer";
          return { data: { ...user, role } };
        },
      },
      update: {
        before: async (userData) => {
          // Defense in depth: role is immutable after sign-up. Abort any
          // update that tries to change it (hook results are merged, so
          // deleting keys here would NOT remove them — returning false does).
          if ((userData as Record<string, unknown>).role !== undefined) return false;
          return { data: userData };
        },
      },
    },
  },
  advanced: {
    useSecureCookies: env.isProduction,
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
  rateLimit: {
    enabled: env.isProduction,
    window: 60,
    max: 100,
  },
});

export type AuthSession = typeof auth.$Infer.Session;
