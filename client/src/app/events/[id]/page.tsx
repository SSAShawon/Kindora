import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, ShieldCheck, Users } from "lucide-react";
import { serverRequest } from "@/lib/api";
import type { EventDetail, Participant } from "@/lib/types";
import { formatDateShort, formatTime, initials, isUpcoming, timeAgo } from "@/lib/utils";
import { VOLUNTEER_GUIDELINES } from "@/lib/constants";
import { SmartImage } from "@/components/shared/smart-image";
import { CategoryBadge } from "@/components/shared/category-badge";
import { JoinPanel } from "@/components/events/join-panel";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/states";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await serverRequest<EventDetail>(`/api/events/${id}`, 0);
  if (!detail) return { title: "Event not found" };
  return {
    title: detail.event.title,
    description: detail.event.description.slice(0, 160),
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [detail, participantData] = await Promise.all([
    serverRequest<EventDetail>(`/api/events/${id}`, 0),
    serverRequest<{ total: number; participants: Participant[] }>(`/api/events/${id}/participants`, 0),
  ]);

  if (!detail) notFound();

  const { event, organizer } = detail;
  const participants = participantData?.participants ?? [];
  const upcoming = isUpcoming(event.eventDate);

  return (
    <div className="container py-10 lg:py-14">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to all events
      </Link>

      {/* Cover */}
      <div className="relative mt-6 overflow-hidden rounded-[2rem] shadow-lift">
        <SmartImage
          src={event.thumbnail}
          alt={event.title}
          loading="eager"
          className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-burgundy-950/80 via-burgundy-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={event.eventType} className="bg-white/95 text-burgundy-700 dark:bg-burgundy-950/90 dark:text-burgundy-200" />
            {upcoming ? (
              <Badge className="bg-white/95 text-burgundy-700 dark:bg-burgundy-950/90 dark:text-burgundy-200">
                {formatDateShort(event.eventDate)} · {formatTime(event.eventDate)}
              </Badge>
            ) : (
              <Badge variant="muted" className="bg-white/90 text-burgundy-900">Completed initiative</Badge>
            )}
            {event.isSample && (
              <Badge variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur">
                Sample event
              </Badge>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px]">
            {event.title}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/85">
            <MapPin className="h-4 w-4" /> {event.location}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="font-display text-xl font-extrabold tracking-tight">About this event</h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-lg font-extrabold tracking-tight">Volunteer guidelines</h2>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {VOLUNTEER_GUIDELINES.map((guideline) => (
                <li key={guideline} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {guideline}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                Joined volunteers{" "}
                <span className="ml-1 rounded-full bg-secondary px-2.5 py-0.5 text-sm font-bold text-secondary-foreground">
                  {participants.length}
                </span>
              </h2>
            </div>
            {participants.length === 0 ? (
              <EmptyState
                icon={Users}
                className="mt-5 py-12"
                title="No volunteers yet"
                description="Be the first to raise your hand — the organizer is waiting for people like you."
              />
            ) : (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {participants.map((participant) => (
                  <li
                    key={participant.userId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft"
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      {participant.image ? <AvatarImage src={participant.image} alt={participant.name} /> : null}
                      <AvatarFallback>{initials(participant.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{participant.name}</p>
                      <p className="text-xs text-muted-foreground">Joined {timeAgo(participant.joinedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sticky action panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <JoinPanel event={event} organizer={organizer} />
          <p className="mt-4 flex items-start gap-2 px-2 text-xs leading-relaxed text-muted-foreground">
            <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Participation can be cancelled any time before the event starts. One spot per volunteer.
          </p>
        </aside>
      </div>
    </div>
  );
}
