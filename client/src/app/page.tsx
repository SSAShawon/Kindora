import { Hero } from "@/components/home/hero";
import { StatsBand } from "@/components/home/stats-band";
import { AboutSection } from "@/components/home/about-section";
import { FeaturedEvents } from "@/components/home/featured-events";
import { HowItWorks } from "@/components/home/how-it-works";
import { ImpactSection } from "@/components/home/impact-section";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { Testimonials } from "@/components/home/testimonials";
import { CtaSection } from "@/components/home/cta-section";
import { serverRequest } from "@/lib/api";
import type { KindoraEvent, PlatformStats } from "@/lib/types";

export const revalidate = 30;

export default async function HomePage() {
  const [stats, featured] = await Promise.all([
    serverRequest<PlatformStats>("/api/stats"),
    serverRequest<{ events: KindoraEvent[] }>("/api/events/featured"),
  ]);

  return (
    <>
      <Hero stats={stats} />
      <StatsBand stats={stats} />
      <AboutSection />
      <FeaturedEvents events={featured?.events ?? []} />
      <HowItWorks />
      <ImpactSection />
      <GalleryPreview />
      <Testimonials />
      <CtaSection />
    </>
  );
}
