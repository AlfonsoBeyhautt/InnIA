"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  KeyRound,
  LogIn,
  LogOut,
  MessageCircle,
  SprayCan,
  Wrench,
} from "lucide-react";
import type { TimelineEvent, TimelineEventKind } from "@/lib/build-timeline";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const kindConfig: Record<
  TimelineEventKind,
  { icon: typeof MessageCircle; tone: string; action: string }
> = {
  "mensaje-urgente": { icon: AlertCircle, tone: "text-danger bg-red-50 border-red-200", action: "Responder" },
  mensaje: { icon: MessageCircle, tone: "text-primary bg-sand border-primary/20", action: "Ver conversación" },
  "check-in": { icon: LogIn, tone: "text-primary bg-accent border-primary/25", action: "Ver reserva" },
  "check-out": { icon: LogOut, tone: "text-muted-foreground bg-secondary border-border", action: "Ver reserva" },
  limpieza: { icon: SprayCan, tone: "text-amber-800 bg-amber-50 border-amber-200", action: "Ver tarea" },
  mantenimiento: { icon: Wrench, tone: "text-amber-900 bg-amber-50 border-amber-200", action: "Ver tarea" },
  ia: { icon: Bot, tone: "text-success bg-emerald-50 border-emerald-200", action: "Ver actividad" },
  cerradura: { icon: KeyRound, tone: "text-primary bg-accent border-primary/25", action: "Ver cerradura" },
};

const priorityVariant: Record<string, "danger" | "warning" | "secondary" | "success"> = {
  alta: "danger",
  media: "warning",
  baja: "secondary",
  info: "success",
};

export function TimelineEventRow({ event, index = 0 }: { event: TimelineEvent; index?: number }) {
  const cfg = kindConfig[event.kind];
  const Icon = cfg.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="relative pb-5 last:pb-0"
    >
      <span
        className={cn(
          "absolute -left-[1.65rem] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 ring-4 ring-warm-panel",
          cfg.tone
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <article className="group rounded-xl border border-primary/12 bg-card px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <motion.div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold tabular-nums text-primary">{event.time}</span>
              <Badge variant={priorityVariant[event.priority]} className="text-[10px]">
                {event.priorityLabel}
              </Badge>
            </div>
            <h4 className="font-semibold leading-snug text-foreground">{event.title}</h4>
            <p className="text-sm text-muted-foreground">{event.description}</p>
            <p className="text-xs font-medium text-primary/80">{event.propertyLabel}</p>
          </motion.div>
          <Button
            asChild
            size="sm"
            className="h-8 shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Link href={event.href}>{cfg.action}</Link>
          </Button>
        </div>
      </article>
    </motion.li>
  );
}
