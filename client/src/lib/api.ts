import type {
  DashboardStats,
  EventDetail,
  EventListResponse,
  JoinedEventItem,
  KindoraEvent,
  Participant,
  PlatformStats,
  PublicUser,
} from "./types";

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

/**
 * All requests use relative URLs — the Next.js server proxies /api/* to the
 * Express backend, so cookies stay same-origin in every environment.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "Cannot reach the server. Check your connection and try again.");
  }
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body?.success) {
    throw new ApiClientError(
      res.status,
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? "Something went wrong. Please try again.",
      body?.error?.details,
    );
  }
  return body.data as T;
}

export interface EventQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: "soonest" | "newest" | "popular";
  status?: "upcoming" | "past" | "all";
}

export interface EventInput {
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  eventDate: string;
}

export const api = {
  events: {
    list(query: EventQuery = {}, signal?: AbortSignal) {
      const params = new URLSearchParams();
      if (query.search) params.set("search", query.search);
      if (query.category && query.category !== "All Events") params.set("category", query.category);
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.status) params.set("status", query.status);
      const qs = params.toString();
      return request<EventListResponse>(`/api/events${qs ? `?${qs}` : ""}`, { signal });
    },
    featured: () => request<{ events: KindoraEvent[] }>("/api/events/featured"),
    get: (id: string) => request<EventDetail>(`/api/events/${id}`),
    create: (input: EventInput) => request<{ event: KindoraEvent }>("/api/events", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: EventInput) =>
      request<{ event: KindoraEvent }>(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ deleted: boolean }>(`/api/events/${id}`, { method: "DELETE" }),
    join: (id: string) => request<{ joined: boolean; participantCount: number }>(`/api/events/${id}/join`, { method: "POST" }),
    cancel: (id: string) => request<{ joined: boolean; participantCount: number }>(`/api/events/${id}/join`, { method: "DELETE" }),
    participants: (id: string) => request<{ total: number; participants: Participant[] }>(`/api/events/${id}/participants`),
  },
  users: {
    me: () => request<{ user: PublicUser }>("/api/users/me"),
    updateProfile: (input: { name: string; image?: string | null }) =>
      request<{ user: PublicUser }>("/api/users/me/profile", { method: "PUT", body: JSON.stringify(input) }),
    joinedEvents: () => request<{ items: JoinedEventItem[]; total: number }>("/api/users/me/joined-events"),
    createdEvents: () => request<{ events: KindoraEvent[]; total: number }>("/api/users/me/created-events"),
    stats: () => request<DashboardStats>("/api/users/me/stats"),
  },
  stats: () => request<PlatformStats>("/api/stats"),
  contact: (input: { name: string; email: string; subject: string; message: string }) =>
    request<{ received: boolean }>("/api/contact", { method: "POST", body: JSON.stringify(input) }),
  config: () => request<{ googleAuthEnabled: boolean }>("/api/config"),
};

/**
 * Server-side fetch helper for React Server Components. Runs inside the
 * Next.js server, so it targets the API directly (never the browser).
 */
export async function serverRequest<T>(path: string, revalidate = 30): Promise<T | null> {
  const base = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:5000";
  try {
    const res = await fetch(`${base}${path}`, revalidate === 0 ? { cache: "no-store" } : { next: { revalidate } });
    const body = (await res.json()) as Envelope<T>;
    return body.success ? (body.data as T) : null;
  } catch {
    return null;
  }
}
