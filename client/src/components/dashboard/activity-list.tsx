import Link from "next/link";
import { CalendarPlus, UserPlus, HandHeart, Activity } from "lucide-react";
import type { ActivityItem } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/shared/states";

export function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        className="py-10"
        title="No activity yet"
        description="Your recent actions — joins, created events, and new participants — will appear here."
      />
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item, index) => {
        const Icon = item.type === "created_event" ? CalendarPlus : item.type === "participant_joined" ? UserPlus : HandHeart;
        const text =
          item.type === "created_event"
            ? "You created"
            : item.type === "participant_joined"
              ? `${item.participantName ?? "A volunteer"} joined`
              : "You joined";
        return (
          <li key={`${item.eventId}-${item.at}-${index}`}>
            <Link
              href={`/events/${item.eventId}`}
              className="flex items-start gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/60"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-foreground">
                  {text} <span className="font-semibold">{item.eventTitle}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{timeAgo(item.at)}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
