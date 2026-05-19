"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MessageSquare,
  Sparkles,
  SprayCan,
  User,
} from "lucide-react";
import type { Conversation } from "@/types";
import { propertyName, formatCurrency } from "@/lib/utils";
import { reservations, aiMissingInfoByConversation } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Sugerir respuesta", icon: MessageSquare },
  { label: "Enviar guía de llegada", icon: Calendar },
  { label: "Generar código de cerradura", icon: KeyRound },
  { label: "Crear tarea de limpieza", icon: SprayCan },
  { label: "Escalar al dueño", icon: AlertCircle },
];

type AiAssistantPanelProps = {
  conversation: Conversation | null;
  expanded: boolean;
  onToggleExpand: () => void;
};

export function AiAssistantPanel({
  conversation,
  expanded,
  onToggleExpand,
}: AiAssistantPanelProps) {
  const [tab, setTab] = useState("resumen");

  if (!conversation) {
    return (
      <div className="flex h-full w-[220px] items-center justify-center border-l border-primary/10 bg-card p-4 text-center text-sm text-muted-foreground">
        Copiloto IA
      </div>
    );
  }

  const reservation = reservations.find((r) => r.id === conversation.reservationId);
  const missingInfo =
    aiMissingInfoByConversation[conversation.id] ??
    aiMissingInfoByConversation.default ??
    [];

  const suggestedReply =
    conversation.urgency === "urgente"
      ? "Hola, lamentamos el inconveniente con la cerradura. Un técnico está en camino y te enviaremos un código nuevo en los próximos 15 minutos."
      : "¡Hola! Sí, hay estacionamiento gratuito a 2 cuadras de la propiedad. Te envío la ubicación exacta en un mensaje aparte.";

  const needsResponse =
    conversation.urgency !== "normal" || conversation.labels.includes("Requiere revisión");

  return (
    <motion.aside
      layout
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex h-full shrink-0 flex-col border-l border-primary/10 bg-card",
        expanded ? "w-[300px]" : "w-[220px]"
      )}
    >
      <div className="flex items-center justify-between border-b border-primary/15 bg-gradient-to-r from-sand/50 to-card px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          {expanded && (
            <>
              <span className="truncate text-sm font-semibold">Copiloto IA</span>
              <Badge variant="success" className="shrink-0 text-[9px]">
                Activo
              </Badge>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onToggleExpand}
          aria-label={expanded ? "Compactar panel" : "Expandir panel"}
        >
          {expanded ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-2 mt-2 grid h-8 grid-cols-4 gap-0.5 bg-muted/50 p-0.5">
          <TabsTrigger value="resumen" className="px-1 text-[10px]">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="respuesta" className="px-1 text-[10px]">
            Respuesta
          </TabsTrigger>
          <TabsTrigger value="datos" className="px-1 text-[10px]">
            Datos
          </TabsTrigger>
          <TabsTrigger value="acciones" className="px-1 text-[10px]">
            Acciones
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${conversation.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3"
            >
              <TabsContent value="resumen" className="mt-0 space-y-3 data-[state=inactive]:hidden">
                <section className="rounded-lg border border-primary/10 bg-background p-3 text-xs">
                  <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Huésped
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">{conversation.guestName}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Sentimiento:{" "}
                    <span className="capitalize text-foreground">
                      {conversation.sentiment ?? "neutral"}
                    </span>
                  </p>
                </section>
                {reservation && (
                  <section className="rounded-lg border border-primary/10 bg-background p-3 text-xs">
                    <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                      Reserva asociada
                    </p>
                    <p className="mt-1 font-medium">{propertyName(reservation.propertyId)}</p>
                    <p className="text-muted-foreground">
                      {reservation.checkIn} → {reservation.checkOut}
                    </p>
                    <p className="mt-0.5 font-semibold text-primary">
                      {formatCurrency(reservation.amount)}
                    </p>
                  </section>
                )}
                {needsResponse && expanded && (
                  <section className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-2.5 text-xs text-amber-950">
                    <p className="font-semibold">Qué necesita respuesta</p>
                    <p className="mt-1 line-clamp-3">{conversation.lastMessage}</p>
                  </section>
                )}
              </TabsContent>

              <TabsContent value="respuesta" className="mt-0 space-y-2 data-[state=inactive]:hidden">
                <p className="rounded-lg border border-primary/15 bg-sand/60 p-2.5 text-xs leading-relaxed">
                  {expanded ? suggestedReply : `${suggestedReply.slice(0, 90)}…`}
                </p>
                <Button size="sm" className="h-8 w-full text-xs">
                  Usar sugerencia
                </Button>
              </TabsContent>

              <TabsContent value="datos" className="mt-0 space-y-2 data-[state=inactive]:hidden">
                {missingInfo.map((msg) => (
                  <div
                    key={msg}
                    className="rounded-lg border border-dashed border-amber-300/70 bg-amber-50/40 p-2.5 text-xs"
                  >
                    <p className="leading-snug">{msg}</p>
                    <div className="mt-2 flex flex-col gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-[10px]">
                        Crear respuesta automática
                      </Button>
                      <Button asChild variant="outline" size="sm" className="h-7 text-[10px]">
                        <Link href="/app/reportes">
                          <BookOpen className="mr-1 h-3 w-3" />
                          Actualizar base de conocimiento
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="acciones" className="mt-0 space-y-1 data-[state=inactive]:hidden">
                {quickActions.map((a) => (
                  <Button
                    key={a.label}
                    variant="outline"
                    size="sm"
                    className="h-8 w-full justify-start gap-2 border-primary/10 text-xs"
                  >
                    <a.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{a.label}</span>
                  </Button>
                ))}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </Tabs>
    </motion.aside>
  );
}
