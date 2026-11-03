import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="container pb-20 lg:pb-28">
      <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground shadow-lift sm:px-12 lg:py-20">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]">
          <defs>
            <pattern id="cta-hearts" width="56" height="56" patternUnits="userSpaceOnUse">
              <path
                d="M28 38c-7-4.5-12-9-12-14.5 0-3.7 2.8-6.5 6.4-6.5 2.2 0 4.2 1 5.6 2.9 1.4-1.9 3.4-2.9 5.6-2.9 3.6 0 6.4 2.8 6.4 6.5C40 29 35 33.5 28 38z"
                fill="currentColor"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-hearts)" />
        </svg>

        <div className="relative mx-auto max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Join the movement</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[44px]">
            Your Small Action Can Create a Big Change.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed opacity-85 sm:text-base">
            Whether you have two hours or two hands, there is a place for you here. Explore what
            is happening near you — or start something of your own.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild className="bg-white text-burgundy-700 hover:bg-white/90 dark:bg-white dark:text-burgundy-700">
              <Link href="/events">
                Explore Events <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/register">
                <HeartHandshake /> Join Our Community
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
