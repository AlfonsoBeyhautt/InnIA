"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Home, PlaneLanding, PlaneTakeoff } from "lucide-react";
import type { Conversation, OperationTask, Reservation } from "@/types";

type HomeOperationsStatusProps = {
  reservations: Reservation[];
  tasks: OperationTask[];
  conversations: Conversation[];
};

export function HomeOperationsStatus({
  reservations,
  tasks,
  conversations,
}: HomeOperationsStatusProps) {
  const today = new Date().toISOString().slice(0, 10);
  const checkIns = reservations.filter(
    (r) => r.checkIn === today && (r.status === "confirmada" || r.status === "check-in")
  ).length;
  const checkOuts = reservations.filter((r) => r.checkOut === today).length;
  const activeStays = reservations.filter((r) => r.status === "check-in").length;
  const blockers = tasks.filter((t) => t.status === "Problema detectado").length;
  const pendingMessages = conversations.filter((c) => c.unread || c.urgency !== "normal").length;
  const ready = blockers === 0 && pendingMessages === 0;

  const rows = [
    { label: "Check-ins hoy", value: checkIns, icon: PlaneLanding },
    { label: "Check-outs hoy", value: checkOuts, icon: PlaneTakeoff },
    { label: "Estadías activas", value: activeStays, icon: Home },
  ];

  return (
    <section className="flex h-full min-h-[190px] flex-col rounded-[20px] border border-border/65 bg-card/95 p-4 shadow-[0_14px_40px_-34px_rgba(46,58,42,0.42),0_1px_0_rgba(255,255,255,0.82)_inset] max-lg:rounded-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Estado de operaciones
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClipboardCheck className={ready ? "h-3.5 w-3.5 text-success" : "h-3.5 w-3.5 text-terracotta"} />
            {ready ? "Sin bloqueos críticos" : `${blockers + pendingMessages} asunto${blockers + pendingMessages === 1 ? "" : "s"} abierto${blockers + pendingMessages === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/app/operaciones"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sand/80 hover:text-foreground"
          aria-label="Ver operaciones"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-border/55 bg-cream/45 p-3">
            <row.icon className="h-3.5 w-3.5 text-primary" />
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {row.value}
            </p>
            <p className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">
              {row.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
