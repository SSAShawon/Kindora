import { BookOpen, Gift, HandHeart, HeartPulse, Shapes, Sparkles, Sprout, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Cleanup: Sparkles,
  Plantation: Sprout,
  Donation: Gift,
  Education: BookOpen,
  Healthcare: HeartPulse,
  "Community Service": Users,
  Other: Shapes,
};

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? HandHeart;
  return (
    <Badge variant="accent" className={cn("gap-1.5 py-1", className)}>
      <Icon className="h-3 w-3" />
      {category}
    </Badge>
  );
}
