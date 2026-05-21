"use client";

import { useMemo, useState } from "react";
import { AiInsightCard } from "@/components/insights/ai-insight-card";
import { KnowledgeBaseStatus } from "@/components/insights/knowledge-base-status";
import { SuggestedAutoReplyCard } from "@/components/insights/suggested-auto-reply-card";
import { PageSection } from "@/components/motion/page-section";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast-context";
import { useApi } from "@/lib/hooks/use-api";
import { downloadCsv } from "@/lib/export-csv";
import type { ReportsMetrics } from "@/lib/db/reports-metrics";
import { Download, Sparkles } from "lucide-react";
import Link from "next/link";

const insights: import("@/types").Insight[] = [];
const knowledgeBaseItems: import("@/types").KnowledgeBaseItem[] = [];
const suggestedAutoReplies: import("@/types").SuggestedAutoReply[] = [];

const emptyMetrics: ReportsMetrics = {
  instagramInquiries: 0,
  instagramReservations: 0,
  aiAutoReplies: 0,
  activeCampaigns: 0,
  commercialProposals: 0,
  convertedInquiries: 0,
  topChannels: [],
  frequentQuestions: [],
};

export default function ReportesPage() {
  const { toast } = useToast();
  const { data: metrics } = useApi<ReportsMetrics>("/api/reports/metrics", emptyMetrics);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [createdReplies, setCreatedReplies] = useState<Set<string>>(new Set());

  const visibleInsights = useMemo(
    () => insights.filter((i) => !resolvedIds.has(i.id)),
    [resolvedIds]
  );

  const m = metrics ?? emptyMetrics;

  const handleExport = () => {
    downloadCsv(
      "metricas-innia",
      ["Métrica", "Valor"],
      [
        ["Consultas Instagram", String(m.instagramInquiries)],
        ["Reservas desde Instagram", String(m.instagramReservations)],
        ["Mensajes auto respondidos IA", String(m.aiAutoReplies)],
        ["Campañas activas", String(m.activeCampaigns)],
        ["Propuestas comerciales", String(m.commercialProposals)],
        ["Consultas convertidas en reserva", String(m.convertedInquiries)],
        ...m.topChannels.map((c) => [`Canal: ${c.channel}`, String(c.count)]),
        ...m.frequentQuestions.map((q) => [`Pregunta: ${q.topic}`, String(q.count)]),
      ]
    );
    toast("Métricas exportadas.", "success");
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
              Métricas omnicanal, IA y campañas para alquileres temporarios.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar métricas
          </Button>
        </header>
      </PageSection>

      <PageSection delay={0.03}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Consultas Instagram", value: m.instagramInquiries },
            { label: "Reservas Instagram", value: m.instagramReservations },
            { label: "Respuestas IA automáticas", value: m.aiAutoReplies },
            { label: "Campañas activas", value: m.activeCampaigns },
            { label: "Propuestas comerciales", value: m.commercialProposals },
            { label: "Consultas → reserva", value: m.convertedInquiries },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border/70 bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection delay={0.05}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <h3 className="font-semibold text-sm">Canales con más consultas</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {m.topChannels.length === 0 ? (
                <li className="text-muted-foreground">Sin datos aún</li>
              ) : (
                m.topChannels.map((c) => (
                  <li key={c.channel} className="flex justify-between">
                    <span className="capitalize">{c.channel}</span>
                    <span className="font-medium tabular-nums">{c.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-border/70 bg-white p-4">
            <h3 className="font-semibold text-sm">Preguntas frecuentes</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {m.frequentQuestions.length === 0 ? (
                <li className="text-muted-foreground">Sin datos aún</li>
              ) : (
                m.frequentQuestions.map((q) => (
                  <li key={q.topic} className="flex justify-between gap-2">
                    <span>{q.topic}</span>
                    <span className="font-medium tabular-nums">{q.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </PageSection>

      <PageSection delay={0.08}>
        {visibleInsights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin reportes de insights todavía.{" "}
            <Link href="/app/inbox" className="text-primary underline">
              Revisá el Centro de mensajes
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleInsights.map((insight) => (
              <div key={insight.id} className="relative">
                <AiInsightCard insight={insight} />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() =>
                    setResolvedIds((s) => new Set(s).add(insight.id))
                  }
                >
                  Marcar resuelto
                </Button>
              </div>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection delay={0.1}>
        <KnowledgeBaseStatus items={knowledgeBaseItems} />
      </PageSection>

      <PageSection delay={0.12}>
        <div className="grid gap-4 md:grid-cols-2">
          {suggestedAutoReplies.map((reply) => (
            <SuggestedAutoReplyCard
              key={reply.id}
              item={reply}
              created={createdReplies.has(reply.id)}
              onCreate={() =>
                setCreatedReplies((s) => new Set(s).add(reply.id))
              }
            />
          ))}
        </div>
      </PageSection>
    </div>
  );
}
