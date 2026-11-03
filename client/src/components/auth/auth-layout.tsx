import Link from "next/link";
import { Quote } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SmartImage } from "@/components/shared/smart-image";
import { AUTH_IMAGE } from "@/lib/constants";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      {/* Photography side */}
      <div className="relative hidden overflow-hidden lg:block">
        <SmartImage
          src={AUTH_IMAGE}
          alt="Community volunteers smiling together outdoors"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-burgundy-950/85 via-burgundy-950/30 to-burgundy-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <Quote className="h-8 w-8 text-burgundy-300" />
          <p className="mt-4 max-w-md font-display text-2xl font-bold leading-snug text-white">
            The best way to find yourself is to lose yourself in the service of others.
          </p>
          <p className="mt-3 text-sm text-white/70">— Mahatma Gandhi</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-10 text-center text-xs text-muted-foreground">
            <Link href="/" className="link-underline hover:text-primary">
              ← Back to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
