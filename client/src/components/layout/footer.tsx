"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Facebook, Github, Linkedin, Mail, MapPin, Twitter } from "lucide-react";
import { Logo } from "./logo";
import { Separator } from "@/components/ui/separator";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Explore Events" },
  { href: "/about", label: "About Us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

const communityLinks = [
  { href: "/register", label: "Become a Volunteer" },
  { href: "/register", label: "Organize an Event" },
  { href: "/events", label: "Find a Cause" },
  { href: "/dashboard", label: "My Dashboard" },
];

function shareLinks(origin: string) {
  const url = encodeURIComponent(origin);
  const text = encodeURIComponent("Kindora — Small Acts. Stronger Communities. Join me in volunteering!");
  return [
    { label: "Share Kindora on X", href: `https://twitter.com/intent/tweet?text=${text}&url=${url}`, Icon: Twitter },
    { label: "Share Kindora on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, Icon: Facebook },
    { label: "Share Kindora on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, Icon: Linkedin },
    { label: "Kindora on GitHub", href: "https://github.com/SSAShawon/Kindora", Icon: Github },
  ];
}

export function Footer() {
  // Stable default for SSR + first client render (no hydration mismatch);
  // the real origin is applied after mount for accurate share links.
  const [origin, setOrigin] = useState("https://kindora.community");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Kindora connects volunteers, organizers, and communities through meaningful local
            action. Every small act — a cleaned riverbank, a planted tree, a warm meal — adds up
            to a stronger community.
          </p>
          <div className="mt-6 flex items-center gap-2">
            {shareLinks(origin).map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary/40 hover:bg-secondary hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Quick Links</h3>
          <ul className="mt-5 space-y-3">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="link-underline text-sm text-muted-foreground transition-colors hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Community</h3>
          <ul className="mt-5 space-y-3">
            {communityLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="link-underline text-sm text-muted-foreground transition-colors hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Contact</h3>
          <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Khulna, Bangladesh<br />Serving communities everywhere</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href="mailto:hello@kindora.community" className="link-underline hover:text-primary">
                hello@kindora.community
              </a>
            </li>
          </ul>
          <p className="mt-6 rounded-xl bg-secondary/60 px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
            Have a question or a cause to share?{" "}
            <Link href="/contact" className="font-semibold underline underline-offset-2">
              Write to us
            </Link>{" "}
            — we read every message.
          </p>
        </div>
      </div>

      <Separator />
      <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Kindora. All rights reserved.</p>
        <p className="font-medium tracking-wide">Small Acts. Stronger Communities.</p>
      </div>
    </footer>
  );
}
