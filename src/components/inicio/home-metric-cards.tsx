"use client";

import { CalendarDays, Home, Inbox, Percent } from "lucide-react";
import type { Conversation, OperationTask, Reservation } from "@/types";

type HomeMetricCardsProps = {
  reservations: Reservation[];
  conversations: Conversation[];
  tasks: OperationTask[];
  unitCount?: number;
};

export function HomeMetricCards({
  reservations,
  conversations,
  tasks,
  unitCount = 0,
}: HomeMetricCardsProps) {
  const today = new Date().toISOString().slice(0, 10);
  const reservationsToday = reservations.filter(
    (r) => r.checkIn === today || r.checkOut === today
  ).length;
  const occupied = reservations.filter((r) => r.status === "check-in").length;
  const totalUnits = unitCount;
  const displayOccupancy =
    totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;
  const importantMessages = conversations.filter(
    (c) => c.unread || c.urgency !== "normal"
  ).length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "Pendiente" || t.status === "Problema detectado"
  ).length;

  const metrics = [
    {
      label: "Ocupación actual",
      value: `${displayOccupancy}%`,
      delta: totalUnits > 0 ? `${occupied} de ${totalUnits} unidades` : "sin unidades",
      deltaTone: "text-muted-foreground",
      icon: Percent,
    },
    {
      label: "Movimientos hoy",
      value: String(reservationsToday || 0),
      delta: reservationsToday > 0 ? "activas hoy" : "sin movimientos",
      deltaTone: "text-muted-foreground",
      icon: CalendarDays,
    },
    {
      label: "Mensajes importantes",
      value: String(importantMessages),
      delta: importantMessages > 0 ? "por revisar" : "al día",
      deltaTone: importantMessages > 0 ? "text-terracotta" : "text-muted-foreground",
      icon: Inbox,
    },
    {
      label: "Unidades activas",
      value: String(totalUnits),
      delta: pendingTasks > 0 ? `${pendingTasks} tareas abiertas` : "sin pendientes",
      deltaTone: pendingTasks > 0 ? "text-terracotta" : "text-muted-foreground",
      icon: Home,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <article
            key={m.label}
            className="border-b border-border/80 bg-white px-4 py-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {m.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {m.value}
                </p>
                <p className={`truncate text-[11px] font-medium ${m.deltaTone}`}>{m.delta}</p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-warm-panel text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
