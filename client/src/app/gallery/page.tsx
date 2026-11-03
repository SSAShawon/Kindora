"use client";

import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { GALLERY_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { EmptyState } from "@/components/shared/states";

const categories = ["All", ...Array.from(new Set(GALLERY_IMAGES.map((image) => image.category)))];

export default function GalleryPage() {
  const [category, setCategory] = useState("All");

  const images = useMemo(
    () => (category === "All" ? GALLERY_IMAGES : GALLERY_IMAGES.filter((image) => image.category === category)),
    [category],
  );

  return (
    <div className="container py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">
          <span className="h-px w-6 bg-primary/60" aria-hidden />
          Photo Gallery
        </p>
        <h1 className="section-title mt-3">The community, in frames</h1>
        <p className="section-sub">
          Mud on boots, paint on hands, meals in boxes, and the smiles in between. Click any
          photograph to open the full preview — use arrow keys to wander.
        </p>
      </div>

      <div className="scrollbar-thin mt-9 flex gap-2 overflow-x-auto pb-2">
        {categories.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
              category === value
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {images.length === 0 ? (
        <EmptyState icon={Camera} className="mt-8" title="No photos in this category yet" description="Check back after the next initiative — the album grows with every event." />
      ) : (
        <GalleryGrid images={images} className="mt-8" />
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Photography via Unsplash, used to illustrate the kinds of moments Kindora communities create.
      </p>
    </div>
  );
}
