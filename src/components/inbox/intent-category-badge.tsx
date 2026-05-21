import { cn } from "@/lib/utils";
import { INTENT_CATEGORY_LABELS } from "@/lib/conversations/intent-classifier";
import type { IntentCategory } from "@/types";

const variantStyles: Record<IntentCategory, string> = {
  nueva_consulta: "bg-sky-50 text-sky-800 border-sky-200",
  huesped_activo: "bg-emerald-50 text-emerald-800 border-emerald-200",
  comercial: "bg-violet-50 text-violet-800 border-violet-200",
  otro: "bg-muted text-muted-foreground border-border",
};

export function IntentCategoryBadge({
  category,
  className,
}: {
  category: IntentCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium",
        variantStyles[category],
        className
      )}
    >
      {INTENT_CATEGORY_LABELS[category]}
    </span>
  );
}
