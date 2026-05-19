"use client";

import { useEffect, useState } from "react";
import type { OperationTask, TaskStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { propertyName } from "@/lib/utils";
import { apiPatch } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";
import { Loader2 } from "lucide-react";

const statuses: TaskStatus[] = [
  "Pendiente",
  "En curso",
  "Completado",
  "Problema detectado",
];

type TaskDetailDialogProps = {
  task: OperationTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onUpdated,
}: TaskDetailDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TaskStatus>("Pendiente");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) setStatus(task.status);
  }, [task]);

  if (!task) return null;

  const save = async () => {
    setSaving(true);
    try {
      await apiPatch(`/api/tasks/${task.id}`, { status });
      toast("Tarea actualizada.", "success");
      onUpdated();
      onOpenChange(false);
    } catch {
      toast("No se pudo actualizar la tarea.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{propertyName(task.propertyId)}</p>
        <p className="text-sm">
          {task.assignee ?? "Sin asignar"} · Vence {task.dueDate}
        </p>
        {task.description && (
          <p className="rounded-lg bg-sand/60 p-3 text-sm">{task.description}</p>
        )}
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Estado</span>
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
