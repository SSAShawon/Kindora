"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { SmartImage } from "@/components/shared/smart-image";
import { CategoryBadge } from "@/components/shared/category-badge";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/lib/constants";

interface GalleryGridProps {
  images: GalleryImage[];
  className?: string;
}

/**
 * Editorial asymmetric grid with an accessible keyboard-navigable lightbox.
 */
export function GalleryGrid({ images, className }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null) return current;
        return (current + direction + images.length) % images.length;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, close, step]);

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 [grid-auto-flow:dense]", className)}>
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Preview photo: ${image.alt}`}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-secondary text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              image.span === "tall" && "row-span-2",
              image.span === "wide" && "col-span-2",
            )}
          >
            <SmartImage
              src={image.src}
              alt={image.alt}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]",
                image.span === "tall" ? "aspect-[3/4.24] sm:aspect-auto sm:min-h-full" : "aspect-[4/3]",
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950/70 via-burgundy-950/0 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
              <CategoryBadge category={image.category} className="bg-white/95 text-burgundy-700 dark:bg-burgundy-950/90 dark:text-burgundy-200" />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Expand className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-50 flex flex-col bg-burgundy-950/95 backdrop-blur-sm animate-fade-in"
          onClick={close}
        >
          <div className="flex items-center justify-between p-4 text-white/80">
            <p className="text-xs font-semibold uppercase tracking-wider">
              {activeIndex! + 1} / {images.length} · {active.category}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close preview"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <figure className="max-h-full">
              <SmartImage
                src={active.full}
                alt={active.alt}
                loading="eager"
                className="max-h-[74vh] w-auto max-w-full rounded-xl object-contain shadow-lift"
              />
              <figcaption className="mt-4 text-center text-sm text-white/80">{active.alt}</figcaption>
            </figure>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
