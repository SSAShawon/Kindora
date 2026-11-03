import { CalendarCheck, HandHeart, Search, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const steps = [
  {
    icon: Search,
    title: "Discover Opportunities",
    body: "Browse events by cause, place, and date. Search across your city for the needs that move you.",
  },
  {
    icon: HandHeart,
    title: "Choose Your Cause",
    body: "Cleanup, plantation, education, healthcare — pick the cause that matches your heart and your hours.",
  },
  {
    icon: CalendarCheck,
    title: "Join an Event",
    body: "Reserve your spot in one click. Get the details, guidelines, and everything you need to show up ready.",
  },
  {
    icon: Sparkles,
    title: "Make an Impact",
    body: "Show up, lend a hand, and watch your small act ripple through the community. Track it all in your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section className="container py-20 lg:py-28">
      <SectionHeading
        align="center"
        eyebrow="How It Works"
        title="From intention to impact in four steps"
        sub="No paperwork, no gatekeeping. Just a clear path from caring about something to doing something about it."
      />
      <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div aria-hidden className="absolute left-[12%] right-[12%] top-8 hidden border-t-2 border-dashed border-burgundy-200 dark:border-burgundy-800 lg:block" />
        {steps.map(({ icon: Icon, title, body }, index) => (
          <div key={title} className="relative text-center lg:px-2">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary shadow-soft">
              <Icon className="h-7 w-7 text-primary" />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-xs font-extrabold text-primary-foreground">
                {index + 1}
              </span>
            </div>
            <h3 className="mt-6 font-display text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
