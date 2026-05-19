"use client";

import { useEffect, useState } from "react";
import type { Guest, GuestValidationStatus, Platform, PropertyId } from "@/types";
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
import { apiPatch, apiPost } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";
import { Loader2 } from "lucide-react";

type GuestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest?: Guest | null;
  onSaved: () => void;
};

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  documentId: "",
  passportNumber: "",
  nationality: "Uruguay",
  originPlatform: "Airbnb" as Platform,
  validationStatus: "pendiente" as GuestValidationStatus,
  marketingConsent: false,
  preferredPropertyId: "pdd" as PropertyId,
};

export function GuestFormDialog({
  open,
  onOpenChange,
  guest,
  onSaved,
}: GuestFormDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (guest) {
      setForm({
        fullName: guest.fullName,
        email: guest.email ?? "",
        phone: guest.phone ?? "",
        documentId: guest.documentId ?? "",
        passportNumber: guest.passportNumber ?? "",
        nationality: guest.nationality ?? "Uruguay",
        originPlatform: guest.originPlatform ?? "Airbnb",
        validationStatus: guest.validationStatus,
        marketingConsent: guest.marketingConsent,
        preferredPropertyId: guest.preferredPropertyId ?? "pdd",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, guest]);

  const save = async () => {
    if (!form.fullName.trim()) {
      toast("El nombre es obligatorio.", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        fullName: form.fullName.trim(),
        email: form.email || null,
        phone: form.phone || null,
        documentNumber: form.documentId || null,
        passportNumber: form.passportNumber || null,
        nationality: form.nationality,
        originPlatform: form.originPlatform,
        validationStatus: form.validationStatus,
        marketingConsent: form.marketingConsent,
        preferredPropertySlug: form.preferredPropertyId,
      };
      if (guest) {
        await apiPatch(`/api/guests/${guest.id}`, body);
        toast("Huésped actualizado.", "success");
      } else {
        await apiPost("/api/guests", body);
        toast("Huésped agregado.", "success");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast("No se pudo guardar. Revisá la conexión.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guest ? "Editar huésped" : "Agregar huésped"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nombre completo</span>
            <Input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Teléfono</span>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Documento</span>
            <Input
              value={form.documentId}
              onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Pasaporte</span>
            <Input
              value={form.passportNumber}
              onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nacionalidad</span>
            <Input
              value={form.nationality}
              onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Plataforma</span>
            <Select
              value={form.originPlatform}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, originPlatform: v as Platform }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Airbnb">Airbnb</SelectItem>
                <SelectItem value="Booking">Booking</SelectItem>
                <SelectItem value="Directa">Directa</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <Select
              value={form.validationStatus}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, validationStatus: v as GuestValidationStatus }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="validado">Validado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Propiedad</span>
            <Select
              value={form.preferredPropertyId}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, preferredPropertyId: v as PropertyId }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdd">Casa Punta del Diablo</SelectItem>
                <SelectItem value="rocha">Cabaña Rocha</SelectItem>
                <SelectItem value="paloma">Apartamento La Paloma</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) =>
                setForm((f) => ({ ...f, marketingConsent: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">Consentimiento de marketing</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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
