"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CalendarPlus, Eye, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import type { KindoraEvent } from "@/lib/types";
import { formatDateShort, formatTime, isUpcoming } from "@/lib/utils";
import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { SmartImage } from "@/components/shared/smart-image";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageEventsPage() {
  const { data, isLoading, error, refetch } = useApi(() => api.users.createdEvents(), []);
  const [deleteTarget, setDeleteTarget] = useState<KindoraEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.events.remove(deleteTarget.id);
      toast.success(`“${deleteTarget.title}” was deleted.`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not delete this event.");
    } finally {
      setDeleting(false);
    }
  }

  const events = data?.events ?? [];

  return (
    <AuthGuard role="organizer">
      <div className="space-y-8">
        <DashboardHeader
          title="Manage Events"
          sub="Every initiative you've created — edit details, watch participation, or retire an event."
          action={
            <Button asChild>
              <Link href="/dashboard/create-event">
                <CalendarPlus /> Create New Event
              </Link>
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
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="You haven't created any events"
            description="Your community is waiting for its next opportunity. Publish your first event and let volunteers find you."
            action={
              <Button asChild>
                <Link href="/dashboard/create-event">Create your first event</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift sm:flex-row sm:items-center"
              >
                <Link href={`/events/${event.id}`} className="block shrink-0 overflow-hidden rounded-xl">
                  <SmartImage src={event.thumbnail} alt={event.title} className="h-32 w-full object-cover sm:h-24 sm:w-36" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={event.eventType} />
                    {isUpcoming(event.eventDate) ? <Badge variant="success">Upcoming</Badge> : <Badge variant="muted">Completed</Badge>}
                    {event.isSample && <Badge variant="outline" className="text-[10px] text-muted-foreground">Sample</Badge>}
                  </div>
                  <Link href={`/events/${event.id}`} className="mt-2 block">
                    <h3 className="truncate font-display text-base font-bold text-foreground transition-colors hover:text-primary">
                      {event.title}
                    </h3>
                  </Link>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {formatDateShort(event.eventDate)} · {formatTime(event.eventDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {event.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {event.participantCount} joined
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  <div className="flex flex-1 gap-2 sm:flex-none">
                    <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                      <Link href={`/events/${event.id}`}>
                        <Eye /> View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                      <Link href={`/dashboard/edit-event/${event.id}`}>
                        <Pencil /> Edit
                      </Link>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(event)}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete this event?"
          description={
            deleteTarget
              ? `“${deleteTarget.title}” and all ${deleteTarget.participantCount} participation record(s) will be permanently removed. This cannot be undone.`
              : ""
          }
          confirmLabel="Delete event"
          cancelLabel="Keep event"
          loading={deleting}
          onConfirm={handleDelete}
        />
      </div>
    </AuthGuard>
  );
}
