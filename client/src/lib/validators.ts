import { z } from "zod";
import { EVENT_CATEGORIES } from "./constants";

const httpUrl = (message: string) =>
  z
    .string()
    .trim()
    .min(1, "This field is required.")
    .url(message)
    .refine((value) => /^https?:\/\//i.test(value), message);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters.").max(80, "Full name must be 80 characters or fewer."),
    email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
    role: z.enum(["volunteer", "organizer"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const eventFormSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters.")
    .max(5000, "Description must be 5000 characters or fewer."),
  eventType: z.enum(EVENT_CATEGORIES, { errorMap: () => ({ message: "Choose a category." }) }),
  thumbnail: httpUrl("Enter a valid http(s) image URL."),
  location: z.string().trim().min(3, "Location must be at least 3 characters.").max(160, "Location must be 160 characters or fewer."),
  eventDate: z
    .string()
    .min(1, "Event date is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date and time.")
    .refine((value) => new Date(value).getTime() > Date.now(), "Event date must be in the future."),
});
export type EventFormValues = z.infer<typeof eventFormSchema>;

/** Edit form: a past date is allowed only if it is unchanged (checked server-side too). */
export const editEventFormSchema = eventFormSchema.extend({
  eventDate: z
    .string()
    .min(1, "Event date is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date and time."),
});
export type EditEventFormValues = z.infer<typeof editEventFormSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be 80 characters or fewer."),
  image: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), "Enter a valid http(s) URL or leave empty.")
    .refine((value) => {
      if (value === "") return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid URL."),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be 80 characters or fewer."),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters.").max(120, "Subject must be 120 characters or fewer."),
  message: z.string().trim().min(20, "Message must be at least 20 characters.").max(2000, "Message must be 2000 characters or fewer."),
});
export type ContactValues = z.infer<typeof contactSchema>;

export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const label = score <= 1 ? "Weak" : score <= 3 ? "Good" : "Strong";
  return { score: Math.min(score, 4), label };
}
