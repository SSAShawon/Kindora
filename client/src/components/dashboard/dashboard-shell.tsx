"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, CalendarPlus, ClipboardList, LayoutDashboard, LogOut, User, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";
import { AuthGuard } from "@/components/shared/auth-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ...(user?.role === "organizer"
      ? [
          { href: "/dashboard/manage-events", label: "Manage Events", icon: ClipboardList },
          { href: "/dashboard/create-event", label: "Create Event", icon: CalendarPlus },
        ]
      : [{ href: "/dashboard/joined-events", label: "Joined Events", icon: CalendarCheck }]),
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out. See you soon!");
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  return (
    <AuthGuard>
      <div className="container grid gap-8 py-10 lg:grid-cols-[260px_1fr] lg:py-12">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            {user && (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                  <AvatarFallback className="text-sm">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
                  <Badge variant="accent" className="mt-1 capitalize">{user.role}</Badge>
                </div>
              </div>
            )}

            {/* Desktop nav */}
            <nav className="mt-6 hidden flex-col gap-1 lg:flex" aria-label="Dashboard">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive(href)
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </nav>
          </div>

          {/* Mobile nav */}
          <nav className="scrollbar-thin mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Dashboard mobile">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                  isActive(href)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </AuthGuard>
  );
}

export function DashboardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
