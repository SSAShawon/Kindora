import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <LogoMark className="h-14 w-14" />
      <p className="mt-8 font-display text-7xl font-extrabold tracking-tight text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">This path doesn&apos;t lead anywhere yet</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for may have been moved, removed, or never existed.
        Let&apos;s get you back to the community.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">
            <Home /> Back to Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/events">
            <Compass /> Explore Events
          </Link>
        </Button>
      </div>
    </div>
  );
}
