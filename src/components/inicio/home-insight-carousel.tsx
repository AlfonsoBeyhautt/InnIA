"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildHomeInsights,
  INSIGHT_ACCENT,
  type HomeInsight,
  type HomeInsightKind,
} from "@/lib/home-insights";
import type { Conversation, OperationTask, Property, Reservation } from "@/types";
import { Button } from "@/components/ui/button";

const KIND_ICONS: Record<HomeInsightKind, typeof Sun> = {
  resumen_dia: Sun,
  sugerencia_ia: Sparkles,
  comparacion_plataformas: BarChart3,
  oportunidad: Target,
  alerta_operativa: AlertTriangle,
  rendimiento_semanal: TrendingUp,
};

type HomeInsightCarouselProps = {
  conversations: Conversation[];
  reservations: Reservation[];
  tasks: OperationTask[];
  properties: Property[];
  unitCount: number;
};

export function HomeInsightCarousel({
  conversations,
  reservations,
  tasks,
  properties,
  unitCount,
}: HomeInsightCarouselProps) {
  const insights = useMemo(
    () =>
      buildHomeInsights({
        conversations,
        reservations,
        tasks,
        properties,
        unitCount,
      }),
    [conversations, reservations, tasks, properties, unitCount]
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + insights.length) % insights.length);
    },
    [insights.length]
  );

  useEffect(() => {
    setIndex(0);
  }, [insights.length]);

  useEffect(() => {
    if (paused || insights.length <= 1) return;
    const t = window.setInterval(() => go(1), 7000);
    return () => window.clearInterval(t);
  }, [paused, insights.length, go]);

  const current = insights[index] ?? insights[0];
  if (!current) return null;

  return (
    <section
      className="ci-card-compact flex h-full min-h-0 flex-col max-lg:min-h-[160px] lg:min-h-[200px] lg:rounded-[20px] lg:p-4 lg:shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)] sm:lg:p-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="ci-section-title">Resumen del día</h2>
          <p className="ci-section-sub">Insights operativos e IA</p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sand/80 hover:text-foreground"
            aria-label="Insight anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sand/80 hover:text-foreground"
            aria-label="Siguiente insight"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <InsightSlide key={current.id} insight={current} />
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {insights.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-5 bg-olive" : "w-1.5 bg-border hover:bg-olive/40"
            )}
            aria-label={`Ver ${item.title}`}
            aria-current={i === index ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function InsightSlide({ insight }: { insight: HomeInsight }) {
  const accent = INSIGHT_ACCENT[insight.kind];
  const Icon = KIND_ICONS[insight.kind] ?? Lightbulb;

  return (
    <motion.article
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "flex h-full flex-col justify-between rounded-2xl border px-4 py-3.5",
        accent.bg,
        accent.border
      )}
    >
      <div>
        <div className={cn("mb-2 flex items-center gap-2", accent.icon)}>
          <Icon className="h-4 w-4 shrink-0" />
          <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{insight.content}</p>
      </div>
      {insight.href && insight.ctaLabel && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-3 w-fit rounded-xl border-border/60 bg-white/60 text-xs font-medium hover:bg-white"
        >
          <Link href={insight.href}>{insight.ctaLabel}</Link>
        </Button>
      )}
    </motion.article>
  );
}
