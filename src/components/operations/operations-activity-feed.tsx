"use client";

import { motion } from "framer-motion";
import { Bot, SprayCan, Wrench } from "lucide-react";
import { preferApi } from "@/lib/prefer-api";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";
import { propertyName } from "@/lib/utils";
import type { OperationTask, TaskType } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<
  TaskType | "ia",
  { icon: typeof SprayCan; className: string }
> = {
  limpieza: { icon: SprayCan, className: "bg-sand text-primary" },
  mantenimiento: { icon: Wrench, className: "bg-amber-50 text-amber-800" },
  ia: { icon: Bot, className: "bg-primary/10 text-primary" },
};

function taskToFeedItem(task: OperationTask) {
  const assignee = task.assignee ? ` · ${task.assignee}` : "";
  return {
    id: task.id,
    type: task.type as TaskType,
    text: `${task.title} — ${propertyName(task.propertyId)}${assignee}`,
    time: task.dueDate ? `Vence ${task.dueDate}` : "Sin fecha",
  };
}

export function OperationsActivityFeed() {
  const { user } = useSession();
  const { data } = useApi<OperationTask[]>(user ? "/api/tasks" : null, []);
  const tasks = preferApi(data);

  const items = tasks
    .filter((t) => t.status !== "Completado")
    .slice(0, 8)
    .map(taskToFeedItem);

  return (
    <section className="ci-warm-panel p-5">
      <h2 className="ci-section-title text-base">Actividad operativa</h2>
      <p className="ci-section-sub">Últimas actualizaciones del equipo y la IA</p>
      {items.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No hay tareas pendientes.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item, i) => {
            const cfg = iconMap[item.type] ?? iconMap.mantenimiento;
            const Icon = cfg.icon;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 rounded-xl border border-primary/8 bg-card px-3 py-2.5"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    cfg.className
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
