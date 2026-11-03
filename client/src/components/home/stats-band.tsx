import { CalendarDays, CheckCircle2, HeartHandshake, Users } from "lucide-react";
import type { PlatformStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const items = [
  { key: "volunteers", label: "Total Volunteers", icon: Users },
  { key: "events", label: "Community Events", icon: CalendarDays },
  { key: "completedInitiatives", label: "Completed Initiatives", icon: CheckCircle2 },
  { key: "peopleImpacted", label: "People Impacted", icon: HeartHandshake },
] as const;

export function StatsBand({ stats }: { stats: PlatformStats | null }) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]">
        <defs>
          <pattern id="stats-dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stats-dots)" />
      </svg>
      <div className="container relative grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-4 lg:py-16">
        {items.map(({ key, label, icon: Icon }) => (
          <div key={key} className="text-center lg:text-left">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 lg:mx-0">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-[42px]">
              {formatNumber(stats?.[key] ?? 0)}
            </p>
            <p className="mt-1.5 text-sm font-medium opacity-80">{label}</p>
          </div>
        ))}
      </div>
      <div className="container relative pb-6">
        <p className="text-center text-[11px] tracking-wide opacity-60 lg:text-left">
          Live figures from the Kindora database — participations in completed initiatives count toward people impacted.
        </p>
      </div>
    </section>
  );
}
