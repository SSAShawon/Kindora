import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SmartImage } from "@/components/shared/smart-image";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { IMPACT_IMAGE_MAIN, IMPACT_IMAGE_SMALL } from "@/lib/constants";

const outcomes = [
  "Cleaner rivers, parks, and coastlines — cared for by the people who live beside them.",
  "Thousands of saplings planted and maintained by trained neighborhood committees.",
  "Children tutored, elders connected, and warm meals shared across the city.",
];

export function ImpactSection() {
  return (
    <section className="overflow-hidden bg-secondary/40 py-20 dark:bg-card/40 lg:py-28">
      <div className="container grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Community Impact"
            title={<>Change grows where people <span className="text-primary">show up</span></>}
            sub="Behind every statistic is a morning someone chose to give. These are the moments that make a community feel like home."
          />
          <ul className="mt-8 space-y-4">
            {outcomes.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-9">
            <Link href="/events">
              Be part of the next one <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="overflow-hidden rounded-[2rem] shadow-lift">
            <SmartImage
              src={IMPACT_IMAGE_MAIN}
              alt="A group of friends and volunteers gathered at sunset after a community event"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-8 -left-2 w-40 overflow-hidden rounded-2xl border-4 border-background shadow-lift sm:-left-8 sm:w-52">
            <SmartImage
              src={IMPACT_IMAGE_SMALL}
              alt="Volunteers stacking hands together in solidarity"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div aria-hidden className="absolute -right-3 -top-3 h-24 w-24 rounded-full border-[6px] border-burgundy-200/70 dark:border-burgundy-800" />
        </div>
      </div>
    </section>
  );
}
