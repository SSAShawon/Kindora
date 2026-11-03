import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreClient } from "@/components/events/explore-client";
import { EventCardSkeleton } from "@/components/events/event-card";

export const metadata: Metadata = {
  title: "Explore Events",
  description: "Search and filter volunteering opportunities by cause, place, date, and organizer.",
};

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16">
          <div className="h-10 w-72 animate-pulse rounded-full bg-muted" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ExploreClient />
    </Suspense>
  );
}
