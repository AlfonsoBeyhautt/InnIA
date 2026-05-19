"use client";

import Link from "next/link";
import { BookOpen, ChevronUp, Sparkles } from "lucide-react";
import type { Conversation } from "@/types";
import { propertyName, formatCurrency } from "@/lib/utils";
import { reservations, aiMissingInfoByConversation } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type AiCopilotStripProps = {
  conversation: Conversation | null;
  open: boolean;
  onToggle: () => void;
};

export function AiCopilotStrip({ conversation, open, onToggle }: AiCopilotStripProps) {
  if (!conversation) return null;

  const reservation = reservations.find((r) => r.id === conversation.reservationId);
  const missing =
    aiMissingInfoByConversation[conversation.id] ??
    aiMissingInfoByConversation.default ??
    [];
  const suggestedReply =
    conversation.urgency === "urgente"
      ? "Un técnico está en camino. Código nuevo en 15 min."
      : "Sí, hay estacionamiento a 2 cuadras. Te envío ubicación.";

  return (
    <div className="shrink-0 border-t border-border/70 bg-sand/60/90">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left hover:bg-muted/80"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Copiloto IA
        </span>
        <ChevronUp
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/70/80"
          >
            <div className="grid gap-3 p-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-white p-3 text-xs">
                <p className="font-semibold uppercase text-muted-foreground">Resumen</p>
                <p className="mt-1 font-medium">{conversation.guestName}</p>
                {reservation && (
                  <p className="mt-0.5 text-muted-foreground">
                    {propertyName(reservation.propertyId)} · {formatCurrency(reservation.amount)}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs">
                <p className="font-semibold uppercase text-primary">Respuesta sugerida</p>
                <p className="mt-1 line-clamp-2 text-foreground">{suggestedReply}</p>
                <Button size="sm" className="mt-2 h-7 w-full text-[10px]">
                  Usar sugerencia
                </Button>
              </div>
              <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-3 text-xs">
                <p className="font-semibold text-amber-900">Datos faltantes</p>
                <p className="mt-1 line-clamp-2 text-amber-950">{missing[0]}</p>
                <div className="mt-2 flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 flex-1 text-[10px]">
                    Crear respuesta
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-7 flex-1 text-[10px]">
                    <Link href="/app/reportes">
                      <BookOpen className="mr-0.5 h-3 w-3" />
                      Base IA
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
