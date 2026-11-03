import { createAuthClient } from "better-auth/react";
import type { AppRole } from "./types";

/**
 * The auth client talks to the same origin (/api/auth/*), which Next.js
 * proxies to the Express API. Sessions are httpOnly cookies managed by
 * Better Auth — nothing sensitive is stored in localStorage.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: AppRole;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Typed session hook — `role` is a Better Auth additional field. */
export function useSession() {
  const state = authClient.useSession();
  return {
    user: (state.data?.user ?? undefined) as SessionUser | undefined,
    isPending: state.isPending,
    error: state.error,
    refetch: state.refetch,
  };
}

/** Sign up with a role (additional field accepted by the API). */
export function signUpWithEmail(input: { name: string; email: string; password: string; role: AppRole }) {
  return authClient.signUp.email(input as Parameters<typeof authClient.signUp.email>[0]);
}

export function signInWithEmail(input: { email: string; password: string }) {
  return authClient.signIn.email(input);
}

export function signInWithGoogle(callbackURL: string) {
  return authClient.signIn.social({ provider: "google", callbackURL });
}

export function signOut() {
  return authClient.signOut();
}
