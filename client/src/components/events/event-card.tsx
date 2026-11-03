import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import type { KindoraEvent } from "@/lib/types";
import { cn, formatDateShort, formatTime, initials } from "@/lib/utils";
import { SmartImage } from "@/components/shared/smart-image";
import { CategoryBadge } from "@/components/shared/category-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function EventCard({ event, className }: { event: KindoraEvent; className?: string }) {
  const past = new Date(event.eventDate).getTime() <= Date.now();

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <Link href={`/events/${event.id}`} className="relative block aspect-[16/10] overflow-hidden bg-secondary">
        <SmartImage
          src={event.thumbnail}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <CategoryBadge category={event.eventType} className="bg-card/95 shadow-soft backdrop-blur dark:bg-card/90" />
        </div>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          {past ? (
            <Badge variant="muted" className="bg-card/95 shadow-soft backdrop-blur dark:bg-card/90">Completed</Badge>
          ) : (
            <Badge className="bg-card/95 text-foreground shadow-soft backdrop-blur dark:bg-card/90">
              {formatDateShort(event.eventDate)}
            </Badge>
          )}
          {event.isSample && (
            <Badge variant="outline" className="border-border bg-card/90 text-[10px] text-muted-foreground backdrop-blur">
              Sample
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {formatDateShort(event.eventDate)} · {formatTime(event.eventDate)}
          </span>
        </div>
        <h3 className="mt-2.5 font-display text-lg font-bold leading-snug tracking-tight text-foreground">
          <Link href={`/events/${event.id}`} className="line-clamp-2 transition-colors hover:text-primary">
            {event.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="line-clamp-1">{event.location}</span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7 border border-border">
              <AvatarFallback className="text-[9px]">{initials(event.creatorName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{event.creatorName}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" /> {event.participantCount} joined
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0 gap-1 text-primary hover:text-primary">
            <Link href={`/events/${event.id}`}>
              View Details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="flex-1 space-y-3 p-5">
        <div className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded-full bg-muted" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
