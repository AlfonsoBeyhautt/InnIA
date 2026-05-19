import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Insight } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const priorityVariant = {
  alta: "danger",
  media: "warning",
  baja: "secondary",
} as const;

export function AiInsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="ci-surface flex h-full flex-col gap-4 border-primary/15 p-5 transition-shadow hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          {insight.category && (
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {insight.category}
            </p>
          )}
          <h3 className="font-semibold leading-snug">{insight.title}</h3>
        </div>
        <Badge variant={priorityVariant[insight.priority]} className="shrink-0 text-[10px]">
          {insight.priority}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{insight.description}</p>
      {insight.source && (
        <p className="text-xs text-muted-foreground">
          Fuente: <span className="text-foreground">{insight.source}</span>
        </p>
      )}
      {insight.suggestedAction && (
        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Acción sugerida</p>
          <p className="mt-0.5">{insight.suggestedAction}</p>
        </div>
      )}
      {insight.ctaLabel && insight.ctaHref && (
        <Button asChild size="sm" className="mt-auto w-fit gap-2">
          <Link href={insight.ctaHref}>
            {insight.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </article>
  );
}
