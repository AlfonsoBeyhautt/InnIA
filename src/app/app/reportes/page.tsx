"use client";

import {
  insights,
  knowledgeBaseItems,
  suggestedAutoReplies,
} from "@/data/mock";
import { AiInsightCard } from "@/components/insights/ai-insight-card";
import { KnowledgeBaseStatus } from "@/components/insights/knowledge-base-status";
import { SuggestedAutoReplyCard } from "@/components/insights/suggested-auto-reply-card";
import { PageSection } from "@/components/motion/page-section";
import { Sparkles } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="ci-page ci-page-wide space-y-6">
      <PageSection>
        <header className="ci-header-band">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Análisis operativo
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Reportes</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Recomendaciones de IA sobre mensajes, operaciones, finanzas y experiencia del
            huésped. Priorizá acciones con mayor impacto en tu operación.
          </p>
        </header>
      </PageSection>

      <PageSection delay={0.04}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {insights.map((insight) => (
            <AiInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </PageSection>

      <PageSection delay={0.08}>
        <KnowledgeBaseStatus items={knowledgeBaseItems} />
      </PageSection>

      <PageSection delay={0.1}>
        <section className="ci-surface p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="font-semibold">Respuestas automáticas sugeridas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultas frecuentes detectadas en conversaciones recientes
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestedAutoReplies.map((item) => (
              <SuggestedAutoReplyCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </PageSection>
    </div>
  );
}
