import { pexels } from "./images";

export const EVENT_CATEGORIES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Education",
  "Healthcare",
  "Community Service",
  "Other",
] as const;

export const CATEGORY_FILTERS = ["All Events", ...EVENT_CATEGORIES] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/* Curated photography — real Pexels photos with bundled local fallbacks. */
export const HERO_IMAGE = pexels(6646980, 1400);
export const ABOUT_IMAGE = pexels(8765841, 1100);
export const IMPACT_IMAGE_MAIN = pexels(10756919, 1100);
export const IMPACT_IMAGE_SMALL = pexels(7710202, 700);
export const AUTH_IMAGE = pexels(8380086, 1200);
export const TEAM_IMAGE = pexels(5029923, 1000);
export const FALLBACK_IMAGE = "/images/site/hero.jpg";

export const AVATARS = {
  ayesha: pexels(3794132, 256),
  tanvir: pexels(5715795, 256),
  nusrat: pexels(2709386, 256),
  rafiq: pexels(6829574, 256),
  sadia: pexels(20591769, 256, "pexels-photo-20591769/free-photo-of-close-up-portrait-of-a-woman.jpeg"),
  imran: pexels(30494318, 256, "pexels-photo-30494318/free-photo-of-modern-headshot-of-smiling-young-man-in-casual-setting.jpeg"),
} as const;

export interface GalleryImage {
  src: string;
  full: string;
  alt: string;
  category: string;
  span: "tall" | "wide" | "normal";
}

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: pexels(10579215, 900),
    full: pexels(10579215, 1600),
    alt: "Volunteers serving warm meals at a community gathering",
    category: "Community Service",
    span: "tall",
  },
  {
    src: pexels(8543577, 800),
    full: pexels(8543577, 1600),
    alt: "Gloved hands planting a young tree sapling in fresh soil",
    category: "Plantation",
    span: "normal",
  },
  {
    src: pexels(9090747, 800),
    full: pexels(9090747, 1600),
    alt: "Volunteers leading an educational session for children",
    category: "Education",
    span: "normal",
  },
  {
    src: pexels(6591151, 900),
    full: pexels(6591151, 1600),
    alt: "Three volunteers organizing food donations into boxes",
    category: "Donation",
    span: "wide",
  },
  {
    src: pexels(33132346, 800, "pexels-photo-33132346/free-photo-of-healthcare-outreach-in-kaduna-nigeria.jpeg"),
    full: pexels(33132346, 1600, "pexels-photo-33132346/free-photo-of-healthcare-outreach-in-kaduna-nigeria.jpeg"),
    alt: "A healthcare volunteer attending to a patient during community outreach",
    category: "Healthcare",
    span: "normal",
  },
  {
    src: pexels(12314915, 800),
    full: pexels(12314915, 1600),
    alt: "Hands planting a vegetable seedling in rich soil",
    category: "Plantation",
    span: "normal",
  },
  {
    src: pexels(8363124, 900),
    full: pexels(8363124, 1600),
    alt: "Children learning music together with their teacher",
    category: "Education",
    span: "tall",
  },
  {
    src: pexels(6994831, 800),
    full: pexels(6994831, 1600),
    alt: "Smiling volunteers sorting clothes into donation boxes",
    category: "Donation",
    span: "normal",
  },
  {
    src: pexels(7983561, 900),
    full: pexels(7983561, 1600),
    alt: "Seniors learning to use laptops in a digital literacy class",
    category: "Education",
    span: "wide",
  },
  {
    src: pexels(10484715, 800),
    full: pexels(10484715, 1600),
    alt: "Sunlight filtering through a restored forest canopy",
    category: "Cleanup",
    span: "normal",
  },
];

export const VOLUNTEER_GUIDELINES = [
  "Arrive 15 minutes early for check-in and a short safety briefing.",
  "Wear comfortable clothing and closed shoes suitable for the activity.",
  "Carry water, sun protection, and any personal medication you may need.",
  "Follow the organizer's instructions and stay with your assigned group.",
  "Treat every community member with dignity, patience, and respect.",
  "If you can no longer attend, cancel your participation so others can join.",
];

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Explore Events" },
  { href: "/about", label: "About Us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;
