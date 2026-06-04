"use client";

import { CalendarDays, Inbox, ListTodo, Percent } from "lucide-react";
import { KpiVisual } from "@/components/inicio/kpi-visual";
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
      visual: "occupancy" as const,
      percent: displayOccupancy,
      color: "#4d8a67",
    },
    {
      label: "Reservas hoy",
      value: String(reservationsToday || 0),
      delta: reservationsToday > 0 ? "activas hoy" : "sin movimientos",
      deltaTone: "text-muted-foreground",
      icon: CalendarDays,
      visual: "bars" as const,
      series: [2, 3, 4, 3, 5, 4, Math.max(reservationsToday, 1)],
      color: "#5c6b4a",
    },
    {
      label: "Mensajes importantes",
      value: String(importantMessages),
      delta: importantMessages > 0 ? "por revisar" : "al día",
      deltaTone: importantMessages > 0 ? "text-terracotta" : "text-muted-foreground",
      icon: Inbox,
      visual: "area" as const,
      series: [1, 2, 2, 3, 2, 4, Math.max(importantMessages, 1)],
      color: "#5c6b4a",
    },
    {
      label: "Tareas pendientes",
      value: String(pendingTasks),
      delta: pendingTasks > 0 ? "operativas" : "sin pendientes",
      deltaTone: pendingTasks > 0 ? "text-terracotta" : "text-muted-foreground",
      icon: ListTodo,
      visual: "dots" as const,
      series: [1, 2, 2, 3, 2, pendingTasks],
      color: "#3e4f3c",
      alert: pendingTasks > 0,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <article
            key={m.label}
            className="group relative overflow-hidden rounded-[24px] border border-border/65 bg-card/95 p-4 shadow-[0_22px_52px_-40px_rgba(46,58,42,0.5),0_1px_0_rgba(255,255,255,0.85)_inset] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_26px_62px_-42px_rgba(46,58,42,0.58),0_1px_0_rgba(255,255,255,0.9)_inset] max-lg:rounded-2xl"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/45 via-terracotta/35 to-transparent opacity-70" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {m.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {m.value}
                </p>
                <p className={`mt-1 text-xs font-medium ${m.deltaTone}`}>{m.delta}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <KpiVisual
              variant={m.visual}
              percent={m.percent}
              series={m.series}
              color={m.color}
              alert={"alert" in m ? m.alert : false}
              className="mt-auto pt-1"
            />
          </article>
        );
      })}
    </div>
  );
}
