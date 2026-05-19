"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { OperationTask } from "@/types";
import { propertyName } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function HomeUrgentTasks({ tasks }: { tasks: OperationTask[] }) {
  const urgent = tasks.filter(
    (t) => t.status === "Pendiente" || t.status === "Problema detectado"
  );

  return (
    <section className="flex h-full min-h-[180px] flex-col justify-between gap-4 rounded-[20px] border border-border/70 bg-card p-5 shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)]">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-terracotta">Tareas urgentes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {urgent.length > 0
              ? `${urgent.length} ${urgent.length === 1 ? "tarea requiere" : "tareas requieren"} tu atención`
              : "No hay tareas urgentes por ahora"}
          </p>
          {urgent[0] && (
            <p className="mt-1 text-xs text-muted-foreground">
              {urgent[0].title} · {propertyName(urgent[0].propertyId)}
            </p>
          )}
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        className="shrink-0 rounded-xl border-terracotta/30 text-terracotta hover:bg-terracotta/10"
      >
        <Link href="/app/operaciones">
          Ver tareas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </section>
  );
}
