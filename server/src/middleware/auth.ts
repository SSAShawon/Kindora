import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type Role } from "../lib/auth.js";
import { ApiError } from "../lib/http.js";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  createdAt: Date;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

async function resolveUser(req: Request): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) return null;
  const user = session.user as SessionUser & { role?: string };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role === "organizer" ? "organizer" : "volunteer",
    createdAt: new Date(user.createdAt),
  };
}

/** Populates req.user when a valid session exists; never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resolveUser(req);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
}

/** Rejects with 401 unless a valid session exists. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resolveUser(req);
    if (!user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue."));
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Rejects with 403 unless the authenticated user has the given role. */
export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue."));
      return;
    }
    if (req.user.role !== role) {
      next(
        new ApiError(
          403,
          "FORBIDDEN",
          role === "organizer"
            ? "Only organizers can perform this action."
            : "Only volunteers can perform this action.",
        ),
      );
      return;
    }
    next();
  };
}
