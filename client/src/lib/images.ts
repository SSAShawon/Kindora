/**
 * Kindora image system.
 *
 * Primary sources are real Pexels CDN URLs (a reliable, free-license image
 * source) served at the size each context needs. Every curated photo also
 * ships as a local copy under /public/images, and SmartImage automatically
 * falls back to it if the CDN is unreachable — so the product never shows
 * a broken image, in any network environment.
 */

/** Build a sized Pexels CDN URL (server-side resize + compression). */
export const pexels = (id: number, w = 1200, special?: string) =>
  `https://images.pexels.com/photos/${id}/${special ?? `pexels-photo-${id}.jpeg`}?auto=compress&cs=tinysrgb&w=${w}`;

/** CDN base URL -> bundled local copy of the same photograph. */
export const IMAGE_MANIFEST: Record<string, string> = {
  "https://images.pexels.com/photos/6646980/pexels-photo-6646980.jpeg": "/images/site/hero.jpg",
  "https://images.pexels.com/photos/8765841/pexels-photo-8765841.jpeg": "/images/site/about.jpg",
  "https://images.pexels.com/photos/10756919/pexels-photo-10756919.jpeg": "/images/site/impact-main.jpg",
  "https://images.pexels.com/photos/7710202/pexels-photo-7710202.jpeg": "/images/site/impact-small.jpg",
  "https://images.pexels.com/photos/8380086/pexels-photo-8380086.jpeg": "/images/site/auth.jpg",
  "https://images.pexels.com/photos/5029923/pexels-photo-5029923.jpeg": "/images/events/mangrove.jpg",
  "https://images.pexels.com/photos/10579215/pexels-photo-10579215.jpeg": "/images/gallery/kitchen.jpg",
  "https://images.pexels.com/photos/8543577/pexels-photo-8543577.jpeg": "/images/gallery/planting.jpg",
  "https://images.pexels.com/photos/9090747/pexels-photo-9090747.jpeg": "/images/events/evening-school.jpg",
  "https://images.pexels.com/photos/6591151/pexels-photo-6591151.jpeg": "/images/gallery/food-donation.jpg",
  "https://images.pexels.com/photos/33132346/pexels-photo-33132346/free-photo-of-healthcare-outreach-in-kaduna-nigeria.jpeg": "/images/gallery/health.jpg",
  "https://images.pexels.com/photos/12314915/pexels-photo-12314915.jpeg": "/images/gallery/seedling.jpg",
  "https://images.pexels.com/photos/8363124/pexels-photo-8363124.jpeg": "/images/gallery/children.jpg",
  "https://images.pexels.com/photos/6994831/pexels-photo-6994831.jpeg": "/images/gallery/sorting.jpg",
  "https://images.pexels.com/photos/7983561/pexels-photo-7983561.jpeg": "/images/gallery/digital.jpg",
  "https://images.pexels.com/photos/10484715/pexels-photo-10484715.jpeg": "/images/events/coastal-trees.jpg",
  "https://images.pexels.com/photos/9035238/pexels-photo-9035238.jpeg": "/images/events/cleanup-riverbank.jpg",
  "https://images.pexels.com/photos/7156188/pexels-photo-7156188.jpeg": "/images/events/winter-donation.jpg",
  "https://images.pexels.com/photos/33127835/pexels-photo-33127835/free-photo-of-community-medical-outreach-in-kaduna-nigeria.jpeg": "/images/events/health-camp.jpg",
  "https://images.pexels.com/photos/6647063/pexels-photo-6647063.jpeg": "/images/events/community-kitchen.jpg",
  "https://images.pexels.com/photos/8543586/pexels-photo-8543586.jpeg": "/images/events/park-restoration.jpg",
  "https://images.pexels.com/photos/9487229/pexels-photo-9487229.jpeg": "/images/events/blood-marathon.jpg",
  "https://images.pexels.com/photos/6738992/pexels-photo-6738992.jpeg": "/images/events/rooftop-garden.jpg",
  "https://images.pexels.com/photos/1148399/pexels-photo-1148399.jpeg": "/images/events/book-drive.jpg",
  "https://images.pexels.com/photos/7983581/pexels-photo-7983581.jpeg": "/images/events/digital-bootcamp.jpg",
  "https://images.pexels.com/photos/3794132/pexels-photo-3794132.jpeg": "/images/avatars/ayesha.jpg",
  "https://images.pexels.com/photos/5715795/pexels-photo-5715795.jpeg": "/images/avatars/tanvir.jpg",
  "https://images.pexels.com/photos/2709386/pexels-photo-2709386.jpeg": "/images/avatars/nusrat.jpg",
  "https://images.pexels.com/photos/6829574/pexels-photo-6829574.jpeg": "/images/avatars/rafiq.jpg",
  "https://images.pexels.com/photos/20591769/pexels-photo-20591769/free-photo-of-close-up-portrait-of-a-woman.jpeg": "/images/avatars/sadia.jpg",
  "https://images.pexels.com/photos/30494318/pexels-photo-30494318/free-photo-of-modern-headshot-of-smiling-young-man-in-casual-setting.jpeg": "/images/avatars/imran.jpg",
};

/** Resolve the local fallback for any curated image URL. */
export function localFallback(src: string): string | undefined {
  const base = src.split("?")[0];
  return IMAGE_MANIFEST[base];
}
