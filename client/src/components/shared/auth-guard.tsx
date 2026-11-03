"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import type { AppRole } from "@/lib/types";
import { LogoMark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Client-side route guard. While the session is being restored we show a
 * branded loader — an authenticated user is NEVER bounced to /login during
 * session hydration. The backend independently enforces every rule.
 */
export function AuthGuard({ children, role }: { children: React.ReactNode; role?: AppRole }) {
  const { user, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isPending, user, router, pathname]);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <LogoMark className="h-12 w-12 animate-pulse" />
        <p className="text-sm font-medium text-muted-foreground">Restoring your session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <LogoMark className="h-12 w-12" />
        <p className="text-sm font-medium text-muted-foreground">Redirecting you to sign in…</p>
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <ShieldAlert className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold">This space is for {role}s</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          You are signed in as a {user.role}. This page is only available to {role} accounts.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">Back to your dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
