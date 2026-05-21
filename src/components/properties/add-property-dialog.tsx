"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { useProperty } from "@/context/property-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AddPropertyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddPropertyDialog({ open, onOpenChange }: AddPropertyDialogProps) {
  const { toast } = useToast();
  const { refetchProperties } = useProperty();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    unitName: "",
    capacity: "2",
  });

  const reset = () => {
    setForm({ name: "", location: "", unitName: "", capacity: "2" });
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast("El nombre de la propiedad es obligatorio.", "error");
      return;
    }
    if (!form.location.trim()) {
      toast("La ubicación es obligatoria.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          location: form.location.trim(),
          unitName: form.unitName.trim() || "Unidad principal",
          capacity: Math.max(1, Number(form.capacity) || 2),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "No se pudo crear la propiedad");
      }
      await refetchProperties();
      window.dispatchEvent(new Event("innia:data-ready"));
      toast("Propiedad creada correctamente.", "success");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al crear propiedad.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar propiedad</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            placeholder="Nombre de la propiedad *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            placeholder="Ubicación / ciudad *"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <Input
            placeholder="Nombre de unidad (opcional)"
            value={form.unitName}
            onChange={(e) => setForm((f) => ({ ...f, unitName: e.target.value }))}
          />
          <Input
            type="number"
            min={1}
            placeholder="Capacidad de huéspedes"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
          <Button className="w-full" onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear propiedad
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
