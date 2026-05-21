"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, Plus, SprayCan, Wrench } from "lucide-react";
import { useProperty } from "@/context/property-context";
import { filterByProperty } from "@/lib/utils";
import { preferApi } from "@/lib/prefer-api";
import { useApi, apiPatch } from "@/lib/hooks/use-api";
import type { OperationTask, TaskStatus } from "@/types";
import { OperationsKanban } from "@/components/operations/operations-kanban";
import { OperationsActivityFeed } from "@/components/operations/operations-activity-feed";
import { TaskDetailDialog } from "@/components/operations/task-detail-dialog";
import { CreateTaskDialog } from "@/components/operations/create-task-dialog";
import { PageSection } from "@/components/motion/page-section";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast-context";

export default function OperacionesPage() {
  const { toast } = useToast();
  const { selectedProperty } = useProperty();
  const { data, refetch } = useApi<OperationTask[]>(
    `/api/tasks${selectedProperty !== "all" ? `?property=${selectedProperty}` : ""}`,
    []
  );
  const operationTasks = preferApi(data);
  const [detailTask, setDetailTask] = useState<OperationTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const onReady = () => void refetch();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetch]);

  const filtered = useMemo(
    () => filterByProperty(operationTasks, selectedProperty),
    [selectedProperty, operationTasks]
  );

  const limpiezasHoy = filtered.filter((t) => t.type === "limpieza").length;
  const mantenimientos = filtered.filter((t) => t.type === "mantenimiento").length;
  const urgentes = filtered.filter((t) => t.status === "Problema detectado").length;
  const automaticas = filtered.filter((t) => t.assignee?.toLowerCase().includes("ia")).length;

  const metrics = [
    { label: "Limpiezas hoy", value: limpiezasHoy, icon: SprayCan },
    { label: "Mantenimientos abiertos", value: mantenimientos, icon: Wrench },
    { label: "Problemas urgentes", value: urgentes, icon: AlertTriangle, highlight: urgentes > 0 },
    { label: "Tareas automáticas", value: automaticas, icon: Bot },
  ];

  const handleMoveTask = async (taskId: string, status: TaskStatus) => {
    try {
      await apiPatch(`/api/tasks/${taskId}`, { status });
      toast(`Tarea movida a «${status}».`, "success");
      void refetch();
    } catch {
      toast("No se pudo actualizar el estado.", "error");
    }
  };

  return (
    <div className="ci-page space-y-8">
      <PageSection>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Limpieza y mantenimiento</h1>
            <p className="mt-1 text-muted-foreground">
              Centro de operaciones — tareas, asignaciones y actividad en tiempo real
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Crear tarea
          </Button>
        </header>
      </PageSection>

      <PageSection delay={0.05}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={`ci-metric-chip flex items-center gap-3 ${m.highlight ? "border-amber-300/60 bg-amber-50/50" : ""}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-primary">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection delay={0.1}>
        <OperationsKanban
          tasks={filtered}
          onSelectTask={(task) => {
            setDetailTask(task);
            setDetailOpen(true);
          }}
          onMoveTask={handleMoveTask}
        />
      </PageSection>

      <PageSection delay={0.15}>
        <OperationsActivityFeed />
      </PageSection>

      <TaskDetailDialog
        task={detailTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={() => void refetch()}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultPropertyId={selectedProperty !== "all" ? selectedProperty : "pdd"}
        onCreated={() => void refetch()}
      />
    </div>
  );
}
