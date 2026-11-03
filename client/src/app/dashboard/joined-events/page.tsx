"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarDays, Eye, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import type { JoinedEventItem } from "@/lib/types";
import { formatDateShort, formatTime } from "@/lib/utils";
import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { SmartImage } from "@/components/shared/smart-image";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function JoinedEventsPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useApi(() => api.users.joinedEvents(), []);
  const [cancelTarget, setCancelTarget] = useState<JoinedEventItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.events.cancel(cancelTarget.event.id);
      toast.success("Participation cancelled. Your spot is open for someone else.");
      setCancelTarget(null);
      refetch();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not cancel participation.");
    } finally {
      setCancelling(false);
    }
  }

  const items = data?.items ?? [];

  return (
    <AuthGuard role="volunteer">
      <div className="space-y-8">
        <DashboardHeader
          title="Joined Events"
          sub="Everything you've signed up for — upcoming commitments and completed initiatives."
          action={
            <Button asChild variant="outline">
              <Link href="/events">Find more events</Link>
            </Button>
          }
        />

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="You haven't joined any events yet"
            description="Your volunteering journey starts with one small act. Explore what's happening near you and reserve your first spot."
            action={
              <Button asChild>
                <Link href="/events">Explore opportunities</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.event.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift sm:flex-row sm:items-center"
              >
                <Link href={`/events/${item.event.id}`} className="block shrink-0 overflow-hidden rounded-xl">
                  <SmartImage
                    src={item.event.thumbnail}
                    alt={item.event.title}
                    className="h-32 w-full object-cover sm:h-24 sm:w-36"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={item.event.eventType} />
                    {item.status === "upcoming" ? (
                      <Badge variant="success">Upcoming</Badge>
                    ) : (
                      <Badge variant="muted">Completed</Badge>
                    )}
                    {item.event.isSample && <Badge variant="outline" className="text-[10px] text-muted-foreground">Sample</Badge>}
                  </div>
                  <Link href={`/events/${item.event.id}`} className="mt-2 block">
                    <h3 className="truncate font-display text-base font-bold text-foreground transition-colors hover:text-primary">
                      {item.event.title}
                    </h3>
                  </Link>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {formatDateShort(item.event.eventDate)} · {formatTime(item.event.eventDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {item.event.location}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                    <Link href={`/events/${item.event.id}`}>
                      <Eye /> View Details
                    </Link>
                  </Button>
                  {item.status === "upcoming" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-muted-foreground hover:text-destructive sm:flex-none"
                      onClick={() => setCancelTarget(item)}
                    >
                      <XCircle /> Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <ConfirmDialog
          open={Boolean(cancelTarget)}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          title="Cancel your participation?"
          description={
            cancelTarget
              ? `Your spot at “${cancelTarget.event.title}” will be released for another volunteer. You can join again later if the event is still open.`
              : ""
          }
          confirmLabel="Yes, cancel it"
          cancelLabel="Keep my spot"
          loading={cancelling}
          onConfirm={handleCancel}
        />
      </div>
    </AuthGuard>
  );
}
