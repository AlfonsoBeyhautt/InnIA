"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KnowledgeBaseItem, Platform, Property, Unit } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiDelete, apiPatch, apiPost } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeStatus } from "@/types";

const ALL_PLATFORMS: Platform[] = ["Airbnb", "Booking", "WhatsApp", "Email", "Directa"];

const KB_LABELS: Record<string, string> = {
  wifi: "WiFi",
  check_in: "Check-in",
  check_out: "Check-out",
  parking: "Estacionamiento",
  pets: "Mascotas",
  house_rules: "Reglas de la casa",
  lock_instructions: "Cerradura",
  emergency: "Emergencias",
};

type PropertyForm = {
  name: string;
  location: string;
  description: string;
  platforms: Platform[];
  smartLockOnline: boolean;
  wifiName: string;
  wifiPassword: string;
  houseRules: string;
  checkInInstructions: string;
  checkOutNotes: string;
  lockInstructions: string;
  parkingInfo: string;
  petPolicy: string;
  emergencyContact: string;
  internalNotes: string;
  checkInTime: string;
  checkOutTime: string;
};

type FullPayload = {
  property: Property;
  units: Unit[];
  knowledge: KnowledgeBaseItem[];
};

function parseCheckOutNotes(knowledge: KnowledgeBaseItem[]): string {
  const kb = knowledge.find((k) => k.category === "check_out");
  if (!kb?.content) return "";
  const lines = kb.content.split("\n");
  if (lines[0]?.startsWith("Horario:")) return lines.slice(1).join("\n").trim();
  return kb.content.trim();
}

function buildForm(property: Property, knowledge: KnowledgeBaseItem[]): PropertyForm {
  return {
    name: property.name,
    location: property.location,
    description: property.description ?? "",
    platforms: [...property.platforms],
    smartLockOnline: property.smartLockOnline,
    wifiName: property.wifiName ?? "",
    wifiPassword: property.wifiPassword ?? "",
    houseRules: property.houseRules ?? "",
    checkInInstructions: property.checkInInstructions ?? "",
    checkOutNotes: parseCheckOutNotes(knowledge),
    lockInstructions: property.lockInstructions ?? "",
    parkingInfo: property.parkingInfo ?? "",
    petPolicy: property.petPolicy ?? "",
    emergencyContact: property.emergencyContact ?? "",
    internalNotes: property.internalNotes ?? "",
    checkInTime: property.checkInTime ?? "15:00",
    checkOutTime: property.checkOutTime ?? "10:00",
  };
}

function kbStatusFromContent(content: string): KnowledgeStatus {
  const t = content.trim();
  if (t.length >= 12) return "completo";
  if (t.length > 0) return "incompleto";
  return "faltante";
}

function notifyPropertyUpdated(property: Property) {
  window.dispatchEvent(
    new CustomEvent("innia:property-updated", {
      detail: { propertyId: property.id, dbId: property.dbId },
    })
  );
}

type PropertyEditorProps = {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (p: Property) => void;
  onDeleted?: (propertyId: string) => void;
};

export function PropertyEditor({
  property,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: PropertyEditorProps) {
  const { toast } = useToast();
  const propertyKey = property.dbId ?? property.id;
  const apiBase = `/api/properties/${propertyKey}`;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PropertyForm>(() => buildForm(property, []));
  const [units, setUnits] = useState<Unit[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeBaseItem[]>([]);
  const [kbDrafts, setKbDrafts] = useState<Record<string, string>>({});
  const [kbSaving, setKbSaving] = useState<string | null>(null);
  const snapshotRef = useRef<{ form: PropertyForm; units: Unit[]; knowledge: KnowledgeBaseItem[] } | null>(
    null
  );

  const [unitForm, setUnitForm] = useState({ name: "", capacity: "2", notes: "" });
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitBusy, setUnitBusy] = useState(false);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<Unit | null>(null);
  const [deletePropertyOpen, setDeletePropertyOpen] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(false);

  const loadFull = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/full`);
      if (!res.ok) throw new Error("No se pudo cargar la propiedad");
      const data = (await res.json()) as FullPayload;
      const nextForm = buildForm(data.property, data.knowledge);
      setForm(nextForm);
      setUnits(data.units);
      setKnowledge(data.knowledge);
      const drafts: Record<string, string> = {};
      for (const item of data.knowledge) {
        if (item.category) drafts[item.category] = item.content ?? "";
      }
      setKbDrafts(drafts);
      snapshotRef.current = {
        form: nextForm,
        units: data.units,
        knowledge: data.knowledge,
      };
    } catch {
      const nextForm = buildForm(property, []);
      setForm(nextForm);
      setUnits([]);
      setKnowledge([]);
      snapshotRef.current = { form: nextForm, units: [], knowledge: [] };
      toast("Usando datos locales. Iniciá sesión para sincronizar.", "info");
    } finally {
      setLoading(false);
    }
  }, [apiBase, property, toast]);

  useEffect(() => {
    if (open) void loadFull();
  }, [open, loadFull]);

  const dirty = useMemo(() => {
    const snap = snapshotRef.current;
    if (!snap) return false;
    return JSON.stringify(form) !== JSON.stringify(snap.form);
  }, [form]);

  const cancel = () => {
    const snap = snapshotRef.current;
    if (snap) {
      setForm(snap.form);
      setUnits(snap.units);
      setKnowledge(snap.knowledge);
      const drafts: Record<string, string> = {};
      for (const item of snap.knowledge) {
        if (item.category) drafts[item.category] = item.content ?? "";
      }
      setKbDrafts(drafts);
    }
    toast("Cambios descartados.", "info");
  };

  const saveProperty = async () => {
    if (!form.name.trim()) {
      toast("El nombre de la propiedad es obligatorio.", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await apiPatch<Property>(apiBase, {
        dbId: property.dbId,
        ...form,
        syncKnowledge: true,
      });
      const nextForm = buildForm(updated, knowledge);
      setForm(nextForm);
      snapshotRef.current = {
        form: nextForm,
        units,
        knowledge,
      };
      onSaved?.(updated);
      notifyPropertyUpdated(updated);
      toast("Propiedad guardada en Supabase.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo guardar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (p: Platform) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));
  };

  const addUnit = async () => {
    const name = unitForm.name.trim();
    const capacity = Number(unitForm.capacity);
    if (!name) {
      toast("Nombre de unidad obligatorio.", "error");
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      toast("Capacidad mínima: 1 huésped.", "error");
      return;
    }
    setUnitBusy(true);
    try {
      const created = await apiPost<Unit>(`${apiBase}/units`, {
        name,
        capacity,
        notes: unitForm.notes,
      });
      setUnits((u) => [...u, created]);
      setUnitForm({ name: "", capacity: "2", notes: "" });
      toast("Unidad agregada.", "success");
      notifyPropertyUpdated(property);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al crear unidad.", "error");
    } finally {
      setUnitBusy(false);
    }
  };

  const saveUnitEdit = async () => {
    if (!editingUnit) return;
    const name = editingUnit.name.trim();
    if (!name) {
      toast("Nombre obligatorio.", "error");
      return;
    }
    if (editingUnit.capacity < 1) {
      toast("Capacidad mínima: 1.", "error");
      return;
    }
    setUnitBusy(true);
    try {
      const updated = await apiPatch<Unit>(
        `${apiBase}/units/${editingUnit.id}`,
        editingUnit
      );
      setUnits((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUnit(null);
      toast("Unidad actualizada.", "success");
      notifyPropertyUpdated(property);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al guardar unidad.", "error");
    } finally {
      setUnitBusy(false);
    }
  };

  const confirmDeleteProperty = async () => {
    setDeletingProperty(true);
    try {
      await apiDelete(apiBase);
      toast("Propiedad eliminada.", "success");
      setDeletePropertyOpen(false);
      onOpenChange(false);
      onDeleted?.(property.id);
      window.dispatchEvent(new CustomEvent("innia:property-updated"));
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo eliminar la propiedad.", "error");
    } finally {
      setDeletingProperty(false);
    }
  };

  const confirmDeleteUnit = async () => {
    if (!deleteUnitTarget) return;
    setUnitBusy(true);
    try {
      await apiDelete(`${apiBase}/units/${deleteUnitTarget.id}`);
      setUnits((list) => list.filter((u) => u.id !== deleteUnitTarget.id));
      toast("Unidad eliminada.", "success");
      setDeleteUnitTarget(null);
      notifyPropertyUpdated(property);
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo eliminar.", "error");
    } finally {
      setUnitBusy(false);
    }
  };

  const saveKnowledgeItem = async (category: string) => {
    const content = kbDrafts[category] ?? "";
    const title = KB_LABELS[category] ?? category;
    const status = kbStatusFromContent(content);
    setKbSaving(category);
    try {
      await apiPost("/api/knowledge-base", {
        propertyDbId: property.dbId ?? propertyKey,
        category,
        title,
        content,
        status,
      });
      setKnowledge((items) => {
        const existing = items.find((i) => i.category === category);
        const next: KnowledgeBaseItem = {
          id: existing?.id ?? category,
          propertyDbId: property.dbId,
          topic: title,
          category,
          content,
          status,
        };
        if (existing) return items.map((i) => (i.category === category ? next : i));
        return [...items, next];
      });
      toast(`${title} guardado en base de conocimiento.`, "success");
      notifyPropertyUpdated(property);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al guardar conocimiento.", "error");
    } finally {
      setKbSaving(null);
    }
  };

  const field = (
    label: string,
    key: keyof PropertyForm,
    multiline?: boolean
  ) =>
    multiline ? (
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <Textarea
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          rows={3}
          className="border-border/70"
        />
      </label>
    ) : (
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <Input
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="border-border/70"
        />
      </label>
    );

  const kbStatusBadge = (status: KnowledgeStatus) => {
    const variant =
      status === "completo" ? "success" : status === "incompleto" ? "warning" : "secondary";
    const label =
      status === "completo" ? "Completo" : status === "incompleto" ? "Incompleto" : "Faltante";
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-4">
            <DialogTitle>{property.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Edición interna — los cambios alimentan mensajes, reservas e IA.
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs defaultValue="general">
                <TabsList className="mb-2 w-full flex-wrap">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="units">Unidades</TabsTrigger>
                  <TabsTrigger value="guest">Huéspedes</TabsTrigger>
                  <TabsTrigger value="notes">Notas y canales</TabsTrigger>
                  <TabsTrigger value="kb">Conocimiento IA</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field("Nombre", "name")}
                    {field("Ubicación", "location")}
                  </div>
                  {field("Descripción", "description", true)}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.smartLockOnline}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, smartLockOnline: e.target.checked }))
                      }
                      className="rounded border-border"
                    />
                    <span className="font-medium">Cerradura inteligente en línea</span>
                  </label>
                  <div className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-4">
                    <p className="text-sm font-medium text-danger">Zona de peligro</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Se eliminarán reservas, mensajes, tareas, unidades y todos los datos
                      asociados a esta propiedad. Esta acción no se puede deshacer.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 border-danger/40 text-danger hover:bg-danger/10"
                      onClick={() => setDeletePropertyOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar propiedad
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="units" className="space-y-4">
                  {units.length === 0 ? (
                    <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                      No hay unidades. Agregá apartamentos o habitaciones para vincular reservas.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {units.map((u) => (
                        <li
                          key={u.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3"
                        >
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Capacidad {u.capacity} · {u.status}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUnit({ ...u })}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-danger"
                              onClick={() => setDeleteUnitTarget(u)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="rounded-xl border border-dashed border-border/80 p-4 space-y-3">
                    <p className="text-sm font-medium">Agregar unidad</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        placeholder="Nombre (ej. Depto 2)"
                        value={unitForm.name}
                        onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                      />
                      <Input
                        type="number"
                        min={1}
                        placeholder="Capacidad"
                        value={unitForm.capacity}
                        onChange={(e) => setUnitForm((f) => ({ ...f, capacity: e.target.value }))}
                      />
                      <Button type="button" onClick={addUnit} disabled={unitBusy}>
                        {unitBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="guest" className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field("Check-in (hora)", "checkInTime")}
                    {field("Check-out (hora)", "checkOutTime")}
                    {field("WiFi (red)", "wifiName")}
                    {field("WiFi (contraseña)", "wifiPassword")}
                  </div>
                  {field("Instrucciones de llegada", "checkInInstructions", true)}
                  {field("Notas de check-out", "checkOutNotes", true)}
                  {field("Instrucciones de cerradura", "lockInstructions", true)}
                  {field("Estacionamiento", "parkingInfo", true)}
                  {field("Política de mascotas", "petPolicy", true)}
                  {field("Reglas de la casa", "houseRules", true)}
                  {field("Contacto de emergencia", "emergencyContact")}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  {field("Notas internas (solo equipo)", "internalNotes", true)}
                  <div>
                    <p className="mb-2 text-sm font-medium">Plataformas conectadas</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PLATFORMS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePlatform(p)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                            form.platforms.includes(p)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/70 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="kb" className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    La IA usa estos textos en el centro de mensajes. Al guardar la propiedad también
                    se sincronizan automáticamente; podés ajustarlos aquí con más detalle.
                  </p>
                  {knowledge.length === 0 && Object.keys(kbDrafts).length === 0 ? (
                    <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                      Sin entradas aún. Guardá la propiedad o editá una categoría abajo.
                    </p>
                  ) : null}
                  {Object.entries(KB_LABELS).map(([category, label]) => {
                    const item = knowledge.find((k) => k.category === category);
                    const content = kbDrafts[category] ?? item?.content ?? "";
                    const status = kbStatusFromContent(content);
                    return (
                      <div
                        key={category}
                        className="rounded-xl border border-border/60 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{label}</span>
                          {kbStatusBadge(status)}
                        </div>
                        <Textarea
                          value={content}
                          onChange={(e) =>
                            setKbDrafts((d) => ({ ...d, [category]: e.target.value }))
                          }
                          rows={2}
                          className="border-border/70 text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={kbSaving === category}
                          onClick={() => void saveKnowledgeItem(category)}
                        >
                          {kbSaving === category ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Guardar categoría"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={cancel} disabled={saving || !dirty}>
              Cancelar cambios
            </Button>
            <Button type="button" onClick={() => void saveProperty()} disabled={saving || loading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar propiedad
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUnit} onOpenChange={(o) => !o && setEditingUnit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar unidad</DialogTitle>
          </DialogHeader>
          {editingUnit && (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Nombre</span>
                <Input
                  value={editingUnit.name}
                  onChange={(e) =>
                    setEditingUnit((u) => (u ? { ...u, name: e.target.value } : u))
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Capacidad</span>
                <Input
                  type="number"
                  min={1}
                  value={editingUnit.capacity}
                  onChange={(e) =>
                    setEditingUnit((u) =>
                      u ? { ...u, capacity: Number(e.target.value) || 1 } : u
                    )
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Notas</span>
                <Textarea
                  value={editingUnit.notes ?? ""}
                  onChange={(e) =>
                    setEditingUnit((u) => (u ? { ...u, notes: e.target.value } : u))
                  }
                  rows={2}
                />
              </label>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingUnit(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveUnitEdit()} disabled={unitBusy}>
              {unitBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deletePropertyOpen} onOpenChange={setDeletePropertyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar propiedad?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Vas a eliminar <strong>{property.name}</strong> y todos sus datos: reservas, mensajes,
            conversaciones, tareas operativas, unidades y configuración de IA. Esta acción es
            permanente.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletePropertyOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="border-danger/40 text-danger hover:bg-danger/10"
              onClick={() => void confirmDeleteProperty()}
              disabled={deletingProperty}
            >
              {deletingProperty ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteUnitTarget} onOpenChange={(o) => !o && setDeleteUnitTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar unidad?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <strong>{deleteUnitTarget?.name}</strong>. No podés eliminarla si tiene
            reservas activas.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteUnitTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="border-danger/40 text-danger hover:bg-danger/10"
              onClick={() => void confirmDeleteUnit()}
              disabled={unitBusy}
            >
              {unitBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
