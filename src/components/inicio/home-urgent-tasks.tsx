"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { OperationTask } from "@/types";
import { cn, propertyName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HomeUrgentTasks({ tasks }: { tasks: OperationTask[] }) {
  const urgent = tasks
    .filter((t) => t.status === "Pendiente" || t.status === "Problema detectado")
    .sort((a, b) => {
      const rank = { "Problema detectado": 0, Pendiente: 1, "En curso": 2, Completado: 3 };
      return rank[a.status] - rank[b.status];
    });

  return (
    <section className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-[22px] border border-border/65 bg-card/95 p-3.5 shadow-[0_18px_48px_-42px_rgba(46,58,42,0.48),0_1px_0_rgba(255,255,255,0.85)_inset] max-lg:rounded-2xl lg:h-[350px] lg:min-h-0 lg:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Tareas urgentes
          </h2>
          <p className="text-xs text-muted-foreground">Acciones operativas pendientes</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl px-2 text-xs">
          <Link href="/app/operaciones">
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {urgent.length === 0 ? (
          <li className="flex h-full min-h-[110px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-sand/35 px-4 text-center text-sm text-muted-foreground">
            No hay tareas urgentes.
          </li>
        ) : (
          urgent.map((task) => (
            <li
              key={task.id}
              className="min-h-[62px] rounded-2xl border border-border/55 bg-cream/45 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{task.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {propertyName(task.propertyId)}
                    {task.assignee ? ` · ${task.assignee}` : ""}
                  </p>
                </div>
                <Badge
                  variant={task.status === "Problema detectado" ? "danger" : "warning"}
                  className="shrink-0 text-[10px]"
                >
                  {task.status === "Problema detectado" ? "Alta" : "Media"}
                </Badge>
              </div>
              <div
                className={cn(
                  "mt-1.5 flex items-center gap-1 text-[11px] font-medium",
                  task.status === "Problema detectado" ? "text-terracotta" : "text-muted-foreground"
                )}
              >
                <Clock3 className="h-3 w-3" />
                {task.dueDate || "Sin fecha"}
                <span className="mx-1">·</span>
                {task.type}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
