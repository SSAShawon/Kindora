import Link from "next/link";
import { ArrowRight, CalendarHeart } from "lucide-react";
import type { KindoraEvent } from "@/lib/types";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/states";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";

export function FeaturedEvents({ events }: { events: KindoraEvent[] }) {
  return (
    <section className="bg-secondary/40 py-20 dark:bg-card/40 lg:py-28">
      <div className="container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Featured Events"
            title="Where you're needed next"
            sub="Hand-picked upcoming opportunities from organizers in your community. Reserve your spot — every pair of hands matters."
          />
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/events">
              View All Events <ArrowRight />
            </Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarHeart}
            className="mt-12 bg-card"
            title="No upcoming events yet"
            description="The calendar is waiting for its first chapter. Organizers can create an opportunity, and volunteers will be able to join right here."
            action={
              <Button asChild>
                <Link href="/register">Create the first event</Link>
              </Button>
            }
          />
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
