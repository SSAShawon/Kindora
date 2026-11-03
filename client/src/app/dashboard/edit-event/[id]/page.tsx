"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { useSession } from "@/lib/auth-client";
import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { EventForm } from "@/components/events/event-form";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useSession();
  const { data, isLoading, error, refetch } = useApi(() => api.events.get(id), [id]);

  return (
    <AuthGuard role="organizer">
      <div className="space-y-8">
        <Link
          href="/dashboard/manage-events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Manage Events
        </Link>
        <DashboardHeader title="Edit Event" sub="Update the details below. Volunteers see changes immediately." />

        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : error || !data ? (
          <ErrorState message={error ?? "This event could not be found."} onRetry={refetch} />
        ) : data.event.creatorId !== user?.id ? (
          <EmptyState
            title="This event belongs to another organizer"
            description="You can only edit events you created. Head back to your own events to make changes."
            action={
              <Button asChild>
                <Link href="/dashboard/manage-events">Go to my events</Link>
              </Button>
            }
          />
        ) : (
          <EventForm mode="edit" event={data.event} />
        )}
      </div>
    </AuthGuard>
  );
}
