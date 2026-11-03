import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({ eyebrow, title, sub, align = "left", className }: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", className)}>
      <p className="eyebrow">
        <span className="h-px w-6 bg-primary/60" aria-hidden />
        {eyebrow}
        {align === "center" && <span className="h-px w-6 bg-primary/60" aria-hidden />}
      </p>
      <h2 className="section-title mt-3 text-balance">{title}</h2>
      {sub && <p className={cn("section-sub", align === "center" && "mx-auto")}>{sub}</p>}
    </div>
  );
}
