import { z } from "zod";

export const EVENT_CATEGORIES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Education",
  "Healthcare",
  "Community Service",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

const httpUrl = (message: string) =>
  z
    .string()
    .trim()
    .url(message)
    .refine((value) => /^https?:\/\//i.test(value), message);

const futureDate = z.coerce
  .date({ invalid_type_error: "Please provide a valid event date." })
  .refine((date) => !Number.isNaN(date.getTime()), "Please provide a valid event date.")
  .refine((date) => date.getTime() > Date.now(), "Event date must be in the future.");

export const createEventSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters.")
    .max(5000, "Description must be 5000 characters or fewer."),
  eventType: z.enum(EVENT_CATEGORIES, { errorMap: () => ({ message: "Please choose a valid category." }) }),
  thumbnail: httpUrl("Thumbnail must be a valid http(s) image URL."),
  location: z.string().trim().min(3, "Location must be at least 3 characters.").max(160, "Location must be 160 characters or fewer."),
  eventDate: futureDate,
});

/** Full edit payload; the route decides whether a changed date must be future. */
export const updateEventSchema = createEventSchema.extend({
  eventDate: z.coerce
    .date({ invalid_type_error: "Please provide a valid event date." })
    .refine((date) => !Number.isNaN(date.getTime()), "Please provide a valid event date."),
});

export const listEventsQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  category: z.enum(["All Events", ...EVENT_CATEGORIES]).optional().default("All Events"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(24).optional().default(9),
  sort: z.enum(["soonest", "newest", "popular"]).optional().default("soonest"),
  status: z.enum(["upcoming", "past", "all"]).optional().default("upcoming"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be 80 characters or fewer."),
  image: z
    .union([httpUrl("Photo must be a valid http(s) URL."), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? null : value)),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z.string().trim().email("Please provide a valid email address."),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters.").max(120),
  message: z.string().trim().min(20, "Message must be at least 20 characters.").max(2000, "Message must be 2000 characters or fewer."),
});
