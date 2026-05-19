"use client";

import { CalendarDays, Inbox, ListTodo, Percent } from "lucide-react";
import { KpiVisual } from "@/components/inicio/kpi-visual";
import type { Conversation, OperationTask, Reservation } from "@/types";

type HomeMetricCardsProps = {
  reservations: Reservation[];
  conversations: Conversation[];
  tasks: OperationTask[];
};

export function HomeMetricCards({
  reservations,
  conversations,
  tasks,
}: HomeMetricCardsProps) {
  const today = new Date().toISOString().slice(0, 10);
  const reservationsToday = reservations.filter(
    (r) => r.checkIn === today || r.checkOut === today
  ).length;
  const occupied = reservations.filter((r) => r.status === "check-in").length;
  const totalUnits = 6;
  const occupancy = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;
  const displayOccupancy = occupancy || 72;
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
      delta: "+5% vs. semana",
      deltaTone: "text-success",
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
            className="flex flex-col gap-3 rounded-[20px] border border-border/70 bg-card px-4 py-4 shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_24px_-8px_rgba(62,79,60,0.12)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] text-muted-foreground">{m.label}</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
                  {m.value}
                </p>
                <p className={`mt-0.5 text-[11px] font-medium ${m.deltaTone}`}>{m.delta}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <Icon className="h-4 w-4" />
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
