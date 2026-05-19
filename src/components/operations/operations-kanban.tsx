"use client";

import { motion } from "framer-motion";
import { ArrowRight, SprayCan, Wrench } from "lucide-react";
import type { OperationTask, TaskStatus } from "@/types";
import { propertyName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const columns: { status: TaskStatus; title: string; bg: string }[] = [
  { status: "Pendiente", title: "Pendiente", bg: "bg-sand/70" },
  { status: "En curso", title: "En curso", bg: "bg-primary/8" },
  { status: "Completado", title: "Completado", bg: "bg-success/8" },
  { status: "Problema detectado", title: "Problema", bg: "bg-danger/8" },
];

function checklistProgress(task: OperationTask) {
  if (!task.checklist?.length) return null;
  const done = task.checklist.filter((c) => c.done).length;
  return `${done}/${task.checklist.length}`;
}

function priorityFromStatus(status: TaskStatus): { label: string; variant: "danger" | "warning" | "secondary" | "success" } {
  if (status === "Problema detectado") return { label: "Alta", variant: "danger" };
  if (status === "En curso") return { label: "Media", variant: "warning" };
  if (status === "Completado") return { label: "Baja", variant: "success" };
  return { label: "Normal", variant: "secondary" };
}

export function OperationsKanban({ tasks }: { tasks: OperationTask[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col, colIndex) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <motion.div
            key={col.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIndex * 0.06 }}
            className={cn("flex flex-col rounded-[20px] border border-border/70", col.bg)}
          >
            <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
                {colTasks.length}
              </span>
            </div>
            <ul className="space-y-2 p-3">
              {colTasks.map((task, i) => {
                const progress = checklistProgress(task);
                const priority = priorityFromStatus(task.status);
                const TypeIcon = task.type === "limpieza" ? SprayCan : Wrench;
                return (
                  <motion.li
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: colIndex * 0.05 + i * 0.03 }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={task.type === "limpieza" ? "default" : "secondary"}
                        className="gap-1 text-[10px]"
                      >
                        <TypeIcon className="h-3 w-3" />
                        {task.type === "limpieza" ? "Limpieza" : "Mantenimiento"}
                      </Badge>
                      <Badge variant={priority.variant} className="text-[10px]">
                        {priority.label}
                      </Badge>
                    </div>
                    <p className="mt-2 font-medium text-sm leading-snug">{task.title}</p>
                    <p className="mt-1 text-xs font-medium text-primary/90">
                      {propertyName(task.propertyId)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.assignee ?? "Sin asignar"} · {task.dueDate}
                    </p>
                    {progress && (
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        Checklist {progress}
                      </p>
                    )}
                    <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1 px-0 text-xs text-primary">
                      Ver detalle
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
}
