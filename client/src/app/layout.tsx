import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Kindora — Small Acts. Stronger Communities.",
    template: "%s · Kindora",
  },
  description:
    "Kindora connects volunteers, organizers, and communities through meaningful social activities. Discover local volunteering opportunities, join events, and create real impact.",
  keywords: ["volunteering", "community service", "social impact", "events", "Kindora"],
  openGraph: {
    title: "Kindora — Small Acts. Stronger Communities.",
    description: "Discover volunteering opportunities and create real community impact.",
    type: "website",
    siteName: "Kindora",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF9FB" },
    { media: "(prefers-color-scheme: dark)", color: "#151116" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
