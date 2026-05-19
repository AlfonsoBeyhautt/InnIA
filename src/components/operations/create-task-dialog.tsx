"use client";

import { useState } from "react";
import type { PropertyId, TaskType } from "@/types";
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
import { DEMO_PROPERTY_IDS } from "@/lib/demo/constants";
import { apiPost } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";
import { Loader2 } from "lucide-react";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPropertyId?: PropertyId;
  onCreated: () => void;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultPropertyId = "pdd",
  onCreated,
}: CreateTaskDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("limpieza");
  const [propertyId, setPropertyId] = useState<PropertyId>(defaultPropertyId);
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      toast("El título es obligatorio.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/tasks", {
        title: title.trim(),
        type,
        propertyDbId: DEMO_PROPERTY_IDS[propertyId as keyof typeof DEMO_PROPERTY_IDS],
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
          <Select value={propertyId} onValueChange={(v) => setPropertyId(v as PropertyId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdd">Casa Punta del Diablo</SelectItem>
              <SelectItem value="rocha">Cabaña Rocha</SelectItem>
              <SelectItem value="paloma">Apartamento La Paloma</SelectItem>
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
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear tarea"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
