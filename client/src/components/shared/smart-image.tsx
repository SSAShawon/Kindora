"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/lib/constants";
import { localFallback } from "@/lib/images";

const INLINE_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='800' height='500' fill='#F3DCE5'/><g transform='translate(400 250)'><path d='M0 42c-28-18-48-36-48-59 0-15 11-27 26-27 9 0 17 4 22 12 5-8 13-12 22-12 15 0 26 12 26 27 0 23-20 41-48 59z' fill='none' stroke='#873C56' stroke-width='6' stroke-linejoin='round'/></g></svg>`,
  );

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

/**
 * CDN-optimized image (Pexels serves resized/compressed variants via URL
 * params) with lazy loading and a graceful fallback chain:
 *   remote CDN -> bundled local copy of the same photo -> branded SVG.
 *
 * A broken remote URL never shows a broken image icon. We also recover from
 * the SSR hydration race: the server-rendered <img> can finish (and fail)
 * loading before React attaches onError, so the error event is missed. On
 * mount — and after every source swap — we inspect the element directly and
 * advance the fallback if it already failed (complete && naturalWidth === 0).
 */
export function SmartImage({ src, alt, fallback, className, loading = "lazy", onError, ...props }: SmartImageProps) {
  const resolvedFallback = fallback ?? localFallback(src) ?? FALLBACK_IMAGE;
  const ref = useRef<HTMLImageElement>(null);
  const [current, setCurrent] = useState(src);
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  // Reset the chain whenever the source prop changes (e.g. live URL preview).
  useEffect(() => {
    setCurrent(src);
    setStage(0);
  }, [src]);

  const advance = useCallback(() => {
    if (stage === 0) {
      setStage(1);
      setCurrent(resolvedFallback);
    } else if (stage === 1) {
      setStage(2);
      setCurrent(INLINE_FALLBACK);
    }
  }, [stage, resolvedFallback]);

  // Catch failures that happened before React hydrated (or before this effect
  // attached). Changing src resets `complete` to false while the new image
  // loads, so this only fires for an image that has genuinely already failed.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) advance();
  }, [current, advance]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={current}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={(event) => {
        onError?.(event);
        advance();
      }}
      className={cn(className)}
      {...props}
    />
  );
}
