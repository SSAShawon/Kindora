import Link from "next/link";
import { ArrowRight, HeartHandshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/shared/smart-image";
import { AVATARS, HERO_IMAGE } from "@/lib/constants";
import type { PlatformStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const trustAvatars = [AVATARS.ayesha, AVATARS.tanvir, AVATARS.nusrat, AVATARS.rafiq];

export function Hero({ stats }: { stats: PlatformStats | null }) {
  const volunteers = stats?.volunteers ?? 0;

  return (
    <section className="relative overflow-hidden">
      {/* Decorative wash */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-secondary/70 blur-3xl dark:bg-burgundy-900/30" />
      <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-secondary/50 blur-3xl dark:bg-burgundy-900/20" />

      <div className="container relative grid items-center gap-14 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-24">
        {/* Left — editorial copy */}
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Build a Better Tomorrow
          </p>

          <h1 className="mt-6 font-display text-[44px] font-extrabold leading-[1.06] tracking-tight text-foreground sm:text-6xl lg:text-[64px]">
            Small Acts.
            <br />
            <span className="relative inline-block text-primary">
              Stronger Communities.
              <svg
                aria-hidden
                viewBox="0 0 320 12"
                className="absolute -bottom-2 left-0 w-full text-burgundy-400/70"
                preserveAspectRatio="none"
              >
                <path d="M4 8.5C60 3 140 2.5 316 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Kindora brings volunteers, organizers, and neighbors together around causes that
            matter — from riverbank cleanups to evening classrooms. Find an opportunity near
            you, lend a few hours, and watch small acts grow into lasting change.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild>
              <Link href="/events">
                Explore Opportunities <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">
                <HeartHandshake /> Become a Volunteer
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-2.5">
              {trustAvatars.map((src, i) => (
                <SmartImage
                  key={src}
                  src={src}
                  alt=""
                  loading={i < 2 ? "eager" : "lazy"}
                  className="h-9 w-9 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {volunteers > 0 ? (
                <>
                  <span className="font-bold text-foreground">{formatNumber(volunteers)} volunteers</span> already making an impact
                </>
              ) : (
                <>
                  <span className="font-bold text-foreground">Be the first volunteer</span> — every movement starts with one
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right — composed photography */}
        <div className="relative animate-fade-up lg:pl-6" style={{ animationDelay: "120ms" }}>
          <div aria-hidden className="absolute -right-4 -top-4 hidden h-full w-full rounded-[2rem] border-2 border-burgundy-200/70 dark:border-burgundy-800 sm:block" />
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift">
            <SmartImage
              src={HERO_IMAGE}
              alt="Volunteers working together to pack food for their community"
              loading="eager"
              className="aspect-[4/4.6] w-full object-cover sm:aspect-[4/4.2]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-burgundy-950/30 via-transparent to-transparent" />
          </div>

          {/* Floating impact card — live database values */}
          <div className="absolute -left-3 bottom-8 flex items-center gap-3.5 rounded-2xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur sm:-left-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <HeartHandshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold leading-none text-foreground">
                {formatNumber(stats?.events ?? 0)} community events
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats && stats.completedInitiatives > 0
                  ? `${formatNumber(stats.completedInitiatives)} initiatives completed together`
                  : "The first chapter starts with you"}
              </p>
            </div>
          </div>

          <div className="absolute -right-2 top-8 rounded-full border border-border bg-card/95 px-4 py-2 text-xs font-semibold text-primary shadow-soft backdrop-blur sm:right-6">
            Every act counts
          </div>
        </div>
      </div>
    </section>
  );
}
