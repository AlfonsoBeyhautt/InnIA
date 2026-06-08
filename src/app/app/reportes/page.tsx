"use client";

import { PageSection } from "@/components/motion/page-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context/toast-context";
import { useApi } from "@/lib/hooks/use-api";
import { downloadCsv } from "@/lib/export-csv";
import type { ReportsMetrics } from "@/lib/db/reports-metrics";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  Download,
  LineChart,
  Megaphone,
  MessageSquareText,
  Target,
} from "lucide-react";
import Link from "next/link";

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

  const m = metrics ?? emptyMetrics;
  const totalChannelVolume = m.topChannels.reduce((sum, row) => sum + row.count, 0);
  const totalQuestions = m.frequentQuestions.reduce((sum, row) => sum + row.count, 0);
  const conversionRate =
    m.commercialProposals > 0
      ? Math.round((m.convertedInquiries / m.commercialProposals) * 100)
      : 0;
  const hasOperationalData =
    totalChannelVolume > 0 ||
    totalQuestions > 0 ||
    m.activeCampaigns > 0 ||
    m.commercialProposals > 0;

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
        <header className="border-b border-border/80 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Analytics operativo
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Reportes
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Señales de demanda, conversión comercial, automatización IA y salud de canales.
              Diseñado para decidir dónde invertir atención operativa.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          </div>
        </header>
      </PageSection>

      <PageSection delay={0.03}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Consultas Instagram", value: m.instagramInquiries, icon: MessageSquareText },
            { label: "Reservas Instagram", value: m.instagramReservations, icon: Target },
            { label: "Respuestas IA", value: m.aiAutoReplies, icon: Bot },
            { label: "Campañas activas", value: m.activeCampaigns, icon: Megaphone },
            { label: "Propuestas", value: m.commercialProposals, icon: ArrowUpRight },
            { label: "Conversión", value: `${conversionRate}%`, icon: LineChart },
          ].map((card) => (
            <div
              key={card.label}
              className="border-b border-border/80 bg-white px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                    {card.value}
                  </p>
                </div>
                <card.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection delay={0.05}>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border-b border-border/80 pb-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Canales con más consultas</h2>
                <p className="text-sm text-muted-foreground">Volumen omnicanal detectado.</p>
              </div>
              <Badge variant={totalChannelVolume > 0 ? "success" : "warning"}>
                {totalChannelVolume > 0 ? `${totalChannelVolume} eventos` : "Sin tráfico"}
              </Badge>
            </div>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-4">
              {m.topChannels.length === 0 ? (
                <PremiumAnalyticsEmpty
                  title="Sin consultas registradas"
                  description="Cuando los canales reciban mensajes, esta vista mostrará concentración por origen y alertas de dependencia."
                />
              ) : (
                m.topChannels.map((c) => {
                  const pct = totalChannelVolume > 0 ? Math.round((c.count / totalChannelVolume) * 100) : 0;
                  return (
                    <div key={c.channel} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{c.channel}</span>
                        <span className="font-semibold tabular-nums">{c.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-olive" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">{pct}% del volumen visible</p>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="border-b border-border/80 pb-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Preguntas frecuentes</h2>
                <p className="text-sm text-muted-foreground">Temas que impactan carga operativa.</p>
              </div>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
              {m.frequentQuestions.length === 0 ? (
                <div className="p-4">
                  <PremiumAnalyticsEmpty
                    title="Sin temas recurrentes"
                    description="Al acumular conversaciones, InnIA mostrará las preguntas que conviene convertir en respuestas automáticas."
                  />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-warm-panel text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Tema</th>
                      <th className="px-4 py-3 text-right font-semibold">Consultas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {m.frequentQuestions.map((q) => (
                      <tr key={q.topic} className="hover:bg-sand/35">
                        <td className="px-4 py-3 font-medium">{q.topic}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{q.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </PageSection>

      <PageSection delay={0.08}>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-border/70 bg-white p-5">
            <h2 className="text-lg font-semibold tracking-tight">Estado de madurez analítica</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Canales conectados", hasOperationalData ? "Con señales" : "Pendiente de volumen"],
                ["Automatización IA", m.aiAutoReplies > 0 ? "En uso" : "Sin respuestas automáticas"],
                ["Campañas", m.activeCampaigns > 0 ? `${m.activeCampaigns} activa` : "Sin campañas activas"],
                ["Conversión comercial", conversionRate > 0 ? `${conversionRate}%` : "Sin conversiones registradas"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-b-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-white p-5">
            <h2 className="text-lg font-semibold tracking-tight">Siguiente mejor acción</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {hasOperationalData
                ? "Usá estos reportes para decidir qué canal priorizar, qué preguntas automatizar y dónde reforzar campañas."
                : "Conectá canales y acumulá conversaciones para que InnIA genere reportes con señales útiles de demanda y operación."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/app/inbox">Revisar mensajes</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/app/configuracion?section=integraciones">Configurar canales</Link>
              </Button>
            </div>
          </section>
        </div>
      </PageSection>
    </div>
  );
}

function PremiumAnalyticsEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-warm-panel/40 p-4">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
