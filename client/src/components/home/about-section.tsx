import Link from "next/link";
import { ArrowRight, Eye, HeartHandshake, Target } from "lucide-react";
import { SmartImage } from "@/components/shared/smart-image";
import { SectionHeading } from "@/components/shared/section-heading";
import { ABOUT_IMAGE } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Target,
    title: "Our Mission",
    body: "Make volunteering effortless and local — so anyone can turn goodwill into a few concrete hours of help.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    body: "Communities where helping each other is the default, and every neighborhood has the tools to organize it.",
  },
  {
    icon: HeartHandshake,
    title: "Why Kindora Exists",
    body: "Good intentions stall without a place to act. Kindora is that place — discover, join, and show up.",
  },
];

export function AboutSection() {
  return (
    <section className="container py-20 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-2 lg:order-1">
          <div aria-hidden className="absolute -left-4 -top-4 h-28 w-28 rounded-2xl bg-secondary" />
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift">
            <SmartImage
              src={ABOUT_IMAGE}
              alt="A volunteer holding hands with a child, symbolizing care and connection"
              className="aspect-[4/3.4] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 right-4 max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-lift sm:right-8">
            <p className="font-display text-sm font-bold leading-snug text-foreground">
              “Alone we can do so little; together we can do so much.”
            </p>
            <p className="mt-2 text-xs text-muted-foreground">— Helen Keller</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="About Kindora"
            title={<>A kinder world, built <span className="text-primary">one act at a time</span></>}
            sub="Kindora is a community platform where volunteers and organizers meet around real, local needs. We handle the coordination so people can focus on the care."
          />
          <div className="mt-9 space-y-5">
            {pillars.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" asChild className="mt-9">
            <Link href="/about">
              Learn more about us <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
