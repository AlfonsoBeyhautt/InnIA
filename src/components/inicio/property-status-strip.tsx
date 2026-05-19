"use client";

import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import type { Conversation, OperationTask, Property, Reservation } from "@/types";
import { cn } from "@/lib/utils";

type PropertyStatusStripProps = {
  properties: Property[];
  reservations: Reservation[];
  tasks: OperationTask[];
  urgentByProperty: Record<string, boolean>;
};

function shortLabel(name: string) {
  if (name.includes("Punta del Diablo")) return "Casa Punta del Diablo";
  if (name.includes("Cabaña")) return "Cabaña Rocha";
  if (name.includes("Paloma")) return "Apartamento La Paloma";
  return name;
}

function statusLine(
  p: Property,
  needsAttention: boolean,
  nextRes: Reservation | undefined,
  task: OperationTask | undefined
) {
  if (needsAttention && !p.smartLockOnline)
    return "Atención requerida · Cerradura offline";
  if (needsAttention) return "Atención requerida";
  if (p.status === "limpieza" && task)
    return `Limpieza pendiente · ${task.assignee ?? "Sin asignar"}`;
  if (p.status === "ocupada" && nextRes)
    return `Todo OK · Próximo check-in ${nextRes.checkIn.includes("17") ? "15:00" : nextRes.checkIn}`;
  if (p.status === "disponible") return "Todo OK · Disponible";
  return "Todo OK";
}

export function PropertyStatusStrip({
  properties,
  reservations,
  tasks,
  urgentByProperty,
}: PropertyStatusStripProps) {
  return (
    <section className="ci-warm-panel p-5 sm:p-6">
      <h2 className="ci-section-title text-base">Estado por propiedad</h2>
      <ul className="mt-4 space-y-2">
        {properties.map((p) => {
          const needsAttention = urgentByProperty[p.id];
          const nextRes = reservations.find(
            (r) => r.propertyId === p.id && r.status !== "cancelada"
          );
          const task = tasks.find((t) => t.propertyId === p.id && t.type === "limpieza");
          const line = statusLine(p, needsAttention, nextRes, task);
          const dot = needsAttention
            ? "bg-danger"
            : p.status === "limpieza"
              ? "bg-warning"
              : "bg-success";

          return (
            <li key={p.id}>
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 bg-card px-4 py-3.5 transition-all hover:border-primary/25 hover:shadow-sm",
                  needsAttention && "border-danger/25 bg-red-50/30"
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dot)} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {shortLabel(p.name)}
                      <span className="font-normal text-muted-foreground"> · {line}</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <KeyRound className="h-3 w-3" />
                      {p.smartLockOnline ? "Cerradura en línea" : "Cerradura offline"}
                    </p>
                  </div>
                </div>
                <Link
                  href={needsAttention ? "/app/inbox" : "/app/propiedades"}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {needsAttention ? "Resolver" : "Ver"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function buildUrgentByProperty(conversations: Conversation[]) {
  const map: Record<string, boolean> = {};
  conversations.forEach((c) => {
    if (c.urgency === "urgente" || c.labels.includes("Problema mantenimiento")) {
      map[c.propertyId] = true;
    }
  });
  if (!map.paloma) map.paloma = true;
  return map;
}
