"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, Link2, LogIn, MapPin, Pencil, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import type { KindoraEvent } from "@/lib/types";
import { formatDate, formatTime, initials, isUpcoming } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface JoinPanelProps {
  event: KindoraEvent;
  organizer: { id: string; name: string; image: string | null };
}

export function JoinPanel({ event, organizer }: JoinPanelProps) {
  const router = useRouter();
  const { user, isPending } = useSession();
  const [viewerJoined, setViewerJoined] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [count, setCount] = useState(event.participantCount);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const upcoming = isUpcoming(event.eventDate);

  const loadContext = useCallback(async () => {
    try {
      const detail = await api.events.get(event.id);
      setViewerJoined(detail.viewerJoined);
      setIsOwner(detail.isOwner);
      setCount(detail.event.participantCount);
    } catch {
      // Public detail failed — keep server-rendered values.
    } finally {
      setContextLoaded(true);
    }
  }, [event.id]);

  useEffect(() => {
    if (!isPending) void loadContext();
  }, [isPending, loadContext]);

  async function handleJoin() {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }
    setBusy(true);
    try {
      const result = await api.events.join(event.id);
      setViewerJoined(true);
      setCount(result.participantCount);
      toast.success("You're in! The organizer can't wait to meet you.", {
        description: "Find this event anytime under Dashboard → Joined Events.",
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not join this event. Please try again.");
      void loadContext();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      const result = await api.events.cancel(event.id);
      setViewerJoined(false);
      setCount(result.participantCount);
      setConfirmCancel(false);
      toast.success("Participation cancelled. Your spot is open for someone else.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not cancel participation.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to your clipboard.");
    } catch {
      toast.error("Couldn't copy the link — you can copy it from the address bar.");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <CalendarDays className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{formatDate(event.eventDate)}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {formatTime(event.eventDate)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <MapPin className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Location</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{event.location}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-border">
            {organizer.image ? <AvatarImage src={organizer.image} alt={organizer.name} /> : null}
            <AvatarFallback>{initials(organizer.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-foreground">{organizer.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <UserRound className="h-3 w-3" /> Event organizer
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          <span>
            <span className="font-display text-lg font-extrabold text-foreground">{count}</span>{" "}
            {count === 1 ? "volunteer" : "volunteers"} joined
          </span>
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {isPending || (user && !contextLoaded) ? (
          <Skeleton className="h-12 w-full rounded-full" />
        ) : !upcoming ? (
          <Button className="w-full" size="lg" disabled>
            <CheckCircle2 /> Event completed
          </Button>
        ) : isOwner ? (
          <>
            <Button className="w-full" size="lg" variant="secondary" disabled>
              <CheckCircle2 /> You organize this event
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/dashboard/edit-event/${event.id}`}>
                <Pencil /> Edit event
              </Link>
            </Button>
          </>
        ) : user?.role === "organizer" ? (
          <p className="rounded-xl bg-secondary/70 px-4 py-3 text-center text-xs leading-relaxed text-secondary-foreground">
            Organizer accounts manage events. To join as a participant, use a volunteer account.
          </p>
        ) : viewerJoined ? (
          <>
            <Button className="w-full" size="lg" variant="secondary" disabled>
              <CheckCircle2 /> You&apos;re joining this event
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setConfirmCancel(true)} disabled={busy}>
              Cancel participation
            </Button>
          </>
        ) : (
          <Button className="w-full" size="lg" onClick={handleJoin} loading={busy}>
            {user ? (
              <>
                <CheckCircle2 /> Join This Event
              </>
            ) : (
              <>
                <LogIn /> Join This Event
              </>
            )}
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={handleShare}>
          <Link2 /> Share event
        </Button>
      </div>

      {!user && !isPending && upcoming && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          You&apos;ll be asked to sign in first — we&apos;ll bring you right back here.
        </p>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel your participation?"
        description={`Your spot at “${event.title}” will be released for another volunteer. You can join again later if space allows.`}
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep my spot"
        loading={busy}
        onConfirm={handleCancel}
      />
    </div>
  );
}
