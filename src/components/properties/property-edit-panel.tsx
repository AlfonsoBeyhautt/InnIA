"use client";

import { useState } from "react";
import type { Property } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPatch } from "@/lib/hooks/use-api";
import { Loader2 } from "lucide-react";

export function PropertyEditPanel({
  property,
  onSaved,
}: {
  property: Property;
  onSaved?: (p: Property) => void;
}) {
  const [form, setForm] = useState({
    name: property.name,
    location: property.location,
    description: property.description ?? "",
    wifiName: property.wifiName ?? property.wifi?.split(" · ")[0] ?? "",
    wifiPassword: property.wifiPassword ?? "",
    houseRules: property.houseRules ?? "",
    checkInInstructions: property.checkInInstructions ?? "",
    lockInstructions: property.lockInstructions ?? "",
    parkingInfo: property.parkingInfo ?? "",
    petPolicy: property.petPolicy ?? "",
    emergencyContact: property.emergencyContact ?? "",
    internalNotes: property.internalNotes ?? "",
    checkInTime: property.checkInTime ?? "15:00",
    checkOutTime: property.checkOutTime ?? "10:00",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const id = property.dbId ?? property.id;
      const updated = await apiPatch<Property>(`/api/properties/${id}`, {
        dbId: property.dbId,
        ...form,
      });
      onSaved?.(updated);
    } catch {
      onSaved?.({ ...property, ...form });
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    multiline?: boolean
  ) =>
    multiline ? (
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <Textarea
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          rows={3}
          className="border-border/70"
        />
      </label>
    ) : (
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <Input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="border-border/70"
        />
      </label>
    );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Los cambios se guardan en Supabase y alimentan la base de conocimiento de la IA.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("Nombre", "name")}
        {field("Ubicación", "location")}
        {field("Check-in (hora)", "checkInTime")}
        {field("Check-out (hora)", "checkOutTime")}
        {field("WiFi (red)", "wifiName")}
        {field("WiFi (contraseña)", "wifiPassword")}
      </div>
      {field("Descripción", "description", true)}
      {field("Instrucciones de llegada", "checkInInstructions", true)}
      {field("Instrucciones cerradura", "lockInstructions", true)}
      {field("Estacionamiento", "parkingInfo", true)}
      {field("Política de mascotas", "petPolicy", true)}
      {field("Reglas de la casa", "houseRules", true)}
      {field("Contacto de emergencia", "emergencyContact")}
      {field("Notas internas", "internalNotes", true)}
      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Guardar en Supabase
      </Button>
    </div>
  );
}
