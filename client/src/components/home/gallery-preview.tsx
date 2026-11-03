import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Button } from "@/components/ui/button";
import { GALLERY_IMAGES } from "@/lib/constants";

export function GalleryPreview() {
  return (
    <section className="bg-secondary/40 py-20 dark:bg-card/40 lg:py-28">
      <div className="container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Photo Gallery"
            title="Moments that made us"
            sub="A glimpse of the mornings, the mud, the meals, and the smiles. Click any photo to see it up close."
          />
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/gallery">
              View Full Gallery <ArrowRight />
            </Link>
          </Button>
        </div>
        <GalleryGrid images={GALLERY_IMAGES.slice(0, 6)} className="mt-12" />
      </div>
    </section>
  );
}
