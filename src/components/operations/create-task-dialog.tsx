"use client";

import { useEffect, useState } from "react";
import type { Property, PropertyId, TaskType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";
import { Loader2 } from "lucide-react";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  defaultPropertyId?: PropertyId;
  onCreated: () => void;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  properties,
  defaultPropertyId,
  onCreated,
}: CreateTaskDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("limpieza");
  const [propertyDbId, setPropertyDbId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const preferred = properties.find(
      (p) => p.id === defaultPropertyId || p.dbId === defaultPropertyId
    );
    const first = properties[0];
    setPropertyDbId(preferred?.dbId ?? first?.dbId ?? "");
  }, [open, properties, defaultPropertyId]);

  const submit = async () => {
    if (!title.trim()) {
      toast("El título es obligatorio.", "error");
      return;
    }
    if (!propertyDbId) {
      toast("Seleccioná una propiedad.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/tasks", {
        title: title.trim(),
        type,
        propertyDbId,
        assignedTo: assignee || null,
        status: "Pendiente",
      });
      toast("Tarea creada.", "success");
      setTitle("");
      setAssignee("");
      onCreated();
      onOpenChange(false);
    } catch {
      toast("No se pudo crear la tarea.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva tarea operativa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Título de la tarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="limpieza">Limpieza</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyDbId} onValueChange={setPropertyDbId}>
            <SelectTrigger>
              <SelectValue placeholder="Propiedad" />
            </SelectTrigger>
            <SelectContent>
              {properties.length === 0 ? (
                <SelectItem value="_none" disabled>
                  Sin propiedades cargadas
                </SelectItem>
              ) : (
                properties.map((p) => (
                  <SelectItem key={p.dbId ?? p.id} value={p.dbId ?? p.id}>
                    {p.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Input
            placeholder="Responsable (opcional)"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={saving || !propertyDbId}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear tarea"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
