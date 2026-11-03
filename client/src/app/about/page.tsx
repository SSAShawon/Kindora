import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Compass, Eye, HandHeart, HeartHandshake, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { SmartImage } from "@/components/shared/smart-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ABOUT_IMAGE, IMPACT_IMAGE_MAIN, TEAM_IMAGE } from "@/lib/constants";
import { serverRequest } from "@/lib/api";
import type { PlatformStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us",
  description: "Kindora's mission, vision, and the belief that small acts build stronger communities.",
};

const values = [
  { icon: HandHeart, title: "Compassion first", body: "Every feature exists to make helping easier — never to perform charity, but to practice care." },
  { icon: ShieldCheck, title: "Trust by design", body: "Real accounts, real organizers, transparent participation. Communities run on trust, and we build for it." },
  { icon: Users, title: "Everyone belongs", body: "Two hours or twenty, skilled or curious — there is a role for every person willing to show up." },
  { icon: Compass, title: "Local roots", body: "Change is strongest close to home. We start in neighborhoods and grow outward, together." },
  { icon: Sparkles, title: "Small acts, honored", body: "We celebrate the ordinary gestures — the sorted box, the planted sapling, the patient lesson." },
  { icon: HeartHandshake, title: "Shared ownership", body: "Organizers lead, volunteers power, communities decide. Kindora simply brings them into one room." },
];

export default async function AboutPage() {
  const stats = await serverRequest<PlatformStats>("/api/stats");

  return (
    <div>
      {/* Intro */}
      <section className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow">
            <span className="h-px w-6 bg-primary/60" aria-hidden /> About Kindora
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Kindness, <span className="text-primary">organized.</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Kindora began with a simple observation: most people want to help, and most
            communities need help — yet the two rarely find each other at the right moment.
            A riverbank needs cleaning on Saturday; a classroom needs tutors on Tuesday;
            someone willing exists three streets away. The missing piece is coordination.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            So we built the place where goodwill becomes a plan. Organizers publish real needs.
            Volunteers discover them, join in one click, and show up. Small acts, repeated
            across a city, become something no one could do alone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/events">
                Explore Opportunities <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div aria-hidden className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-secondary" />
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift">
            <SmartImage src={ABOUT_IMAGE} alt="Hands joined together in care" className="aspect-[4/3.6] w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="bg-secondary/40 py-16 dark:bg-card/40 lg:py-24">
        <div className="container grid gap-6 md:grid-cols-2">
          <Card className="border-none bg-primary text-primary-foreground shadow-lift">
            <CardContent className="p-8 lg:p-10">
              <Target className="h-8 w-8" />
              <h2 className="mt-5 font-display text-2xl font-extrabold">Our Mission</h2>
              <p className="mt-3 leading-relaxed opacity-85">
                To make volunteering effortless and local — removing every excuse between a
                willing person and a community that needs them. One platform, one click,
                countless small acts of care.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8 lg:p-10">
              <Eye className="h-8 w-8 text-primary" />
              <h2 className="mt-5 font-display text-2xl font-extrabold">Our Vision</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                A world where helping each other is the default setting of every neighborhood —
                where communities organize their own care, and no good intention is ever wasted
                for lack of a place to act.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="container py-16 lg:py-24">
        <SectionHeading
          align="center"
          eyebrow="What We Stand For"
          title="Values that shape every decision"
          sub="These aren't posters on a wall. They are the product requirements we build against."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="transition-shadow hover:shadow-lift">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Story image + numbers */}
      <section className="container pb-16 lg:pb-24">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft lg:grid-cols-2">
          <SmartImage
            src={IMPACT_IMAGE_MAIN}
            alt="Volunteers gathered together after a community event"
            className="h-full min-h-[280px] w-full object-cover"
          />
          <div className="p-8 lg:p-12">
            <SectionHeading eyebrow="The Journey So Far" title="Growing, one act at a time" />
            <div className="mt-8 grid grid-cols-2 gap-6">
              {[
                { label: "Volunteers", value: stats?.volunteers ?? 0 },
                { label: "Events created", value: stats?.events ?? 0 },
                { label: "Initiatives completed", value: stats?.completedInitiatives ?? 0 },
                { label: "People impacted", value: stats?.peopleImpacted ?? 0 },
              ].map((item) => (
                <div key={item.label}>
                  <p className="font-display text-3xl font-extrabold text-primary">{formatNumber(item.value)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Live figures from the platform database. Sample content is clearly labeled throughout the site.
            </p>
          </div>
        </div>
      </section>

      {/* Team note */}
      <section className="container pb-20 lg:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <SmartImage
            src={TEAM_IMAGE}
            alt="A small team collaborating around a table"
            className="mx-auto aspect-[16/8] w-full rounded-[2rem] object-cover shadow-lift"
          />
          <h2 className="mt-10 font-display text-2xl font-extrabold sm:text-3xl">Built by people who show up</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Kindora is crafted by a small team of designers, engineers, and lifelong volunteers
            who believe technology should bring neighbors closer — not replace them. We build
            in the open, listen to every message, and measure success in mornings well spent.
          </p>
          <Button asChild className="mt-8">
            <Link href="/register">
              Join our community <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
