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
    <section className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-white lg:h-[350px] lg:min-h-0">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
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

      <ul className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
        {urgent.length === 0 ? (
          <li className="flex h-full min-h-[160px] items-center justify-center px-5 text-center text-sm text-muted-foreground">
            No hay tareas urgentes.
          </li>
        ) : (
          urgent.map((task) => (
            <li
              key={task.id}
              className="min-h-[62px] px-4 py-2.5 transition-colors hover:bg-sand/35"
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
