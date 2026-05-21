"use client";

import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox } from "@/context/inbox-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { preferApi } from "@/lib/prefer-api";
import { useApi } from "@/lib/hooks/use-api";
import type { Reservation } from "@/types";
import { propertyName, formatCurrency } from "@/lib/utils";

const statusConfig = {
  auto_sent: {
    label: "Respondido automáticamente",
    variant: "success" as const,
    icon: CheckCircle2,
  },
  needs_review: {
    label: "Requiere revisión",
    variant: "warning" as const,
    icon: AlertCircle,
  },
  insufficient_info: {
    label: "Información insuficiente",
    variant: "warning" as const,
    icon: AlertCircle,
  },
  idle: {
    label: "Sin analizar",
    variant: "secondary" as const,
    icon: Sparkles,
  },
};

type AiCopilotPanelProps = {
  variant?: "sidebar" | "sheet";
  onClose?: () => void;
};

export function AiCopilotPanel({ variant = "sidebar", onClose }: AiCopilotPanelProps) {
  const {
    selected,
    getAnalysis,
    aiPanelOpen,
    setAiPanelOpen,
    aiPanelExpanded,
    setAiPanelExpanded,
    processWithAi,
    aiProcessingId,
    sendAiReply,
  } = useInbox();
  const { data: apiReservations } = useApi<Reservation[]>("/api/reservations", []);
  const reservations = preferApi(apiReservations);

  const isSheet = variant === "sheet";

  const analysis = selected ? getAnalysis(selected.id) : null;
  const isProcessing = selected ? aiProcessingId === selected.id : false;
  const status = analysis?.status ?? "idle";
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const reservation = selected?.reservationId
    ? reservations.find((r) => r.id === selected.reservationId)
    : null;

  if (!aiPanelOpen && !isSheet) {
    return (
      <aside className="flex w-11 shrink-0 flex-col border-l border-border/70 bg-white">
        <button
          type="button"
          onClick={() => setAiPanelOpen(true)}
          className="flex h-full flex-col items-center gap-2 py-4 text-primary hover:bg-sand/60"
          title="Abrir asistente IA"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-[10px] font-semibold [writing-mode:vertical-rl]">IA</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col bg-white transition-[width] duration-200",
        isSheet
          ? "h-full w-full border-0"
          : cn(
              "border-l border-border/70",
              aiPanelExpanded ? "w-[280px]" : "w-[220px]"
            )
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border/70 px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Asistente IA
        </span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setAiPanelExpanded(!aiPanelExpanded)}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            title={aiPanelExpanded ? "Compactar" : "Expandir"}
          >
            {aiPanelExpanded ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setAiPanelOpen(false);
              onClose?.();
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            title="Ocultar panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
        {!selected ? (
          <p className="text-center text-xs text-muted-foreground">Seleccioná una conversación</p>
        ) : (
          <div className="space-y-2.5">
            <div className="rounded-lg border border-border/70 bg-sand/60/80 p-2.5 text-xs">
              <p className="font-medium text-foreground">{selected.guestName}</p>
              {reservation && (
                <p className="mt-0.5 text-muted-foreground">
                  {propertyName(reservation.propertyId)} · {formatCurrency(reservation.amount)}
                </p>
              )}
              {analysis?.detectedIntent && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Intención: <span className="font-medium">{analysis.detectedIntent}</span>
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/70 p-2.5">
              <div className="flex items-start gap-2">
                <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <Badge variant={config.variant} className="text-[9px]">
                    {analysis?.autoReplyBadge ?? config.label}
                  </Badge>
                  {analysis?.autoSentAt && (
                    <p className="mt-1 text-[10px] text-emerald-700">
                      Enviado automáticamente a las {analysis.autoSentAt}
                    </p>
                  )}
                  {status === "auto_sent" && analysis?.reason && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Motivo: {analysis.reason}
                    </p>
                  )}
                  {analysis?.confidence != null && status !== "idle" && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Confianza: {Math.round(analysis.confidence * 100)}%
                    </p>
                  )}
                  {analysis?.reason && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      {analysis.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {analysis && analysis.sourcesUsed.length > 0 && (
              <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/50 p-2.5 text-xs">
                <p className="font-semibold text-emerald-900">Información utilizada</p>
                <ul className="mt-1 space-y-0.5">
                  {analysis.sourcesUsed.map((s) => (
                    <li key={s} className="flex items-start gap-1 text-[11px] text-emerald-950">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis && analysis.missingTopics.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs">
                <p className="font-semibold text-amber-950">Falta cargar</p>
                <ul className="mt-1 space-y-0.5">
                  {analysis.missingTopics.map((t) => (
                    <li key={t} className="text-[11px] text-amber-900">
                      · {t}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" size="sm" className="mt-2 h-7 w-full text-[10px]">
                  <Link href="/app/propiedades">
                    <BookOpen className="mr-1 h-3 w-3" />
                    Actualizar en Propiedades
                  </Link>
                </Button>
              </div>
            )}

            {analysis?.suggestedResponse && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs">
                <p className="font-semibold text-primary">Respuesta generada</p>
                <p className="mt-1 line-clamp-4 text-[11px] leading-relaxed text-foreground">
                  {analysis.suggestedResponse}
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <Button
                size="sm"
                className="h-8 w-full gap-1.5 text-[11px]"
                disabled={!selected || isProcessing}
                onClick={() => selected && void processWithAi(selected.id)}
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                {isProcessing ? "Procesando…" : "Reprocesar con IA"}
              </Button>
              {analysis?.suggestedResponse &&
                !analysis.autoSentAt &&
                analysis.status !== "auto_sent" &&
                (analysis.status === "needs_review" ||
                  analysis.status === "insufficient_info") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full text-[11px]"
                    disabled={isProcessing}
                    onClick={() => selected && void sendAiReply(selected.id)}
                  >
                    Enviar respuesta sugerida
                  </Button>
                )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
