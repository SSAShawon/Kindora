"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarDays, CalendarPlus, CheckCircle2, ClipboardList, HeartHandshake, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useApi } from "@/hooks/use-api";
import { formatDateShort } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { ActivityList } from "@/components/dashboard/activity-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/states";
import { CategoryBadge } from "@/components/shared/category-badge";

export default function DashboardPage() {
  const { user } = useSession();
  const { data, isLoading, error, refetch } = useApi(() => api.users.stats(), []);

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={`Welcome back, ${firstName}`}
        sub={
          user?.role === "organizer"
            ? "Here's how your initiatives are shaping the community."
            : "Here's a look at the impact you've been part of."
        }
        action={
          user?.role === "organizer" ? (
            <Button asChild>
              <Link href="/dashboard/create-event">
                <CalendarPlus /> Create New Event
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/events">
                <HeartHandshake /> Find an Event
              </Link>
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {isLoading || !data ? (
              Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : data.role === "volunteer" ? (
              <>
                <StatCard icon={CalendarCheck} label="Joined events" value={data.stats.joinedTotal} hint="All time" />
                <StatCard icon={CalendarDays} label="Upcoming" value={data.stats.upcomingJoined} hint="On your calendar" />
                <StatCard icon={CheckCircle2} label="Completed" value={data.stats.completedParticipation} hint="Initiatives you attended" />
              </>
            ) : (
              <>
                <StatCard icon={ClipboardList} label="Created events" value={data.stats.createdTotal} hint="All time" />
                <StatCard icon={CalendarDays} label="Upcoming" value={data.stats.upcomingCreated} hint="Accepting volunteers" />
                <StatCard icon={Users} label="Total participants" value={data.stats.totalParticipants} hint="Across your events" />
              </>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Upcoming */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{data?.role === "organizer" ? "Your next events" : "Coming up for you"}</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-primary">
                  <Link href={data?.role === "organizer" ? "/dashboard/manage-events" : "/dashboard/joined-events"}>
                    View all <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading || !data ? (
                  Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                ) : data.upcomingEvents.length === 0 ? (
                  <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                    {data.role === "organizer"
                      ? "No upcoming events. Create one and rally your community."
                      : "Nothing on your calendar yet. Explore events and join one!"}
                  </p>
                ) : (
                  data.upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3.5 transition-all hover:border-primary/40 hover:shadow-soft"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateShort(event.eventDate)} · {event.location}
                        </p>
                      </div>
                      <CategoryBadge category={event.eventType} className="shrink-0" />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !data ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <ActivityList items={data.recentActivity} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card className="bg-secondary/50 dark:bg-card">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
              <div>
                <p className="font-display text-base font-bold text-foreground">
                  {data?.role === "organizer" ? "Ready to lead the next initiative?" : "Every small act counts."}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data?.role === "organizer"
                    ? "Publish an event and watch your community show up."
                    : "Browse new opportunities and keep your impact growing."}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {data?.role === "organizer" ? (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/manage-events">Manage Events</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/dashboard/create-event">
                        <CalendarPlus /> New Event
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/joined-events">
                        <CalendarCheck /> Joined Events
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/events">Explore</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
