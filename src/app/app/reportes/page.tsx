"use client";

import { useMemo, useState } from "react";
const insights: import("@/types").Insight[] = [];
const knowledgeBaseItems: import("@/types").KnowledgeBaseItem[] = [];
const suggestedAutoReplies: import("@/types").SuggestedAutoReply[] = [];
import { AiInsightCard } from "@/components/insights/ai-insight-card";
import { KnowledgeBaseStatus } from "@/components/insights/knowledge-base-status";
import { SuggestedAutoReplyCard } from "@/components/insights/suggested-auto-reply-card";
import { PageSection } from "@/components/motion/page-section";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast-context";
import { downloadCsv } from "@/lib/export-csv";
import { Download, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ReportesPage() {
  const { toast } = useToast();
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [createdReplies, setCreatedReplies] = useState<Set<string>>(new Set());

  const visibleInsights = useMemo(
    () => insights.filter((i) => !resolvedIds.has(i.id)),
    [resolvedIds]
  );

  const handleExport = () => {
    if (visibleInsights.length === 0) {
      toast("No hay reportes activos para exportar.", "info");
      return;
    }
    downloadCsv(
      "reportes-innia",
      ["Título", "Categoría", "Prioridad", "Descripción", "Acción sugerida"],
      visibleInsights.map((i) => [
        i.title,
        i.category ?? "",
        i.priority,
        i.description,
        i.suggestedAction ?? "",
      ])
    );
    toast(`Exportados ${visibleInsights.length} reportes.`, "success");
  };

  return (
    <div className="ci-page ci-page-wide space-y-6">
      <PageSection>
        <header className="ci-header-band flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Análisis operativo
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Reportes</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Recomendaciones de IA sobre mensajes, operaciones, finanzas y experiencia del
              huésped.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </header>
      </PageSection>

      <PageSection delay={0.04}>
        {visibleInsights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin reportes todavía. Conectá canales y cargá propiedades para generar análisis con IA.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleInsights.map((insight) => (
              <div key={insight.id} className="relative">
                <AiInsightCard insight={insight} />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-5 right-5 h-7 text-[11px]"
                  onClick={() => {
                    setResolvedIds((prev) => new Set(prev).add(insight.id));
                    toast("Reporte marcado como resuelto.", "success");
                  }}
                >
                  Marcar resuelto
                </Button>
              </div>
            ))}
          </div>
        )}
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
              <SuggestedAutoReplyCard
                key={item.id}
                item={item}
                created={createdReplies.has(item.id)}
                onCreate={() => {
                  setCreatedReplies((prev) => new Set(prev).add(item.id));
                  toast("Borrador de respuesta automática guardado.", "success");
                }}
              />
            ))}
          </div>
          <Button asChild variant="ghost" className="mt-3 px-0 text-primary">
            <Link href="/app/inbox">Gestionar en centro de mensajes</Link>
          </Button>
        </section>
      </PageSection>
    </div>
  );
}
