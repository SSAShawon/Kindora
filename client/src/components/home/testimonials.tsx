import { Quote } from "lucide-react";
import { SmartImage } from "@/components/shared/smart-image";
import { SectionHeading } from "@/components/shared/section-heading";
import { AVATARS } from "@/lib/constants";

/**
 * Illustrative sample stories — clearly labeled. Real member voices will
 * replace these as the community grows. No real users are quoted here.
 */
const stories = [
  {
    quote:
      "I joined a riverbank cleanup expecting to pick up trash for two hours. I left with fifteen new friends and a neighborhood that finally felt like mine.",
    name: "Sample story · Volunteer",
    role: "Cleanup drive participant",
    avatar: AVATARS.nusrat,
  },
  {
    quote:
      "Organizing used to mean a hundred phone calls. Now I post an event, and by morning every slot is filled with people who genuinely care.",
    name: "Sample story · Organizer",
    role: "Community kitchen organizer",
    avatar: AVATARS.tanvir,
  },
  {
    quote:
      "Teaching at the evening school for one term changed how I see my city. These kids are brilliant — they just needed someone to show up.",
    name: "Sample story · Volunteer",
    role: "Evening school tutor",
    avatar: AVATARS.sadia,
  },
];

export function Testimonials() {
  return (
    <section className="container py-20 lg:py-28">
      <SectionHeading
        align="center"
        eyebrow="Community Voices"
        title="What small acts feel like"
        sub="Illustrative stories of the moments Kindora is built for. Real member voices will appear here as our community grows."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {stories.map((story) => (
          <figure key={story.quote} className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft">
            <Quote className="h-7 w-7 text-burgundy-300 dark:text-burgundy-700" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
              “{story.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
              <SmartImage src={story.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-foreground">{story.name}</p>
                <p className="text-xs text-muted-foreground">{story.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
