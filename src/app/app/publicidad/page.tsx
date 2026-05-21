"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { PageSection } from "@/components/motion/page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApi, apiPost } from "@/lib/hooks/use-api";
import { useProperty } from "@/context/property-context";
import { useToast } from "@/context/toast-context";
import type { AdCampaign } from "@/types";

const OBJECTIVES = [
  "Promocionar propiedad",
  "Más consultas por WhatsApp",
  "Temporada alta",
  "Últimos cupos",
  "Descuentos",
];

const CTAS = ["Consultar por WhatsApp", "Ver disponibilidad", "Reservar"];

export default function PublicidadPage() {
  const { toast } = useToast();
  const { properties } = useProperty();
  const { data: campaigns, refetch } = useApi<AdCampaign[]>("/api/ad-campaigns", []);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    objective: OBJECTIVES[0],
    propertyId: "",
    budget: "",
    startDate: "",
    endDate: "",
    channel: "instagram",
    adCopy: "",
    cta: CTAS[0],
  });

  const submit = async (status: "borrador" | "listo_para_publicar") => {
    if (!form.name.trim()) {
      toast("Nombre de campaña obligatorio.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/ad-campaigns", {
        ...form,
        propertyId: form.propertyId || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        status,
      });
      await refetch();
      toast(
        status === "listo_para_publicar"
          ? "Campaña lista para publicar (simulación)."
          : "Borrador guardado.",
        "success"
      );
      setForm((f) => ({ ...f, name: "", adCopy: "" }));
    } catch {
      toast("No se pudo guardar la campaña.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ci-page ci-page-wide space-y-6">
      <PageSection>
        <header className="ci-header-band">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Megaphone className="h-4 w-4" />
            Publicidad
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
            Campañas para reservas
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Creá campañas simples orientadas a Instagram y Facebook. Por ahora se guardan en
            InnIA; la publicación en Meta Ads llegará en una próxima versión.
          </p>
        </header>
      </PageSection>

      <PageSection delay={0.05}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-semibold">Nueva campaña</h2>
            <Input
              placeholder="Nombre interno"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.objective}
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
            >
              {OBJECTIVES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.propertyId}
              onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
            >
              <option value="">Todas / sin propiedad específica</option>
              {properties.map((p) => (
                <option key={p.dbId ?? p.id} value={p.dbId}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Presupuesto (USD)"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="both">Instagram + Facebook</option>
            </select>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Texto del anuncio"
              value={form.adCopy}
              onChange={(e) => setForm((f) => ({ ...f, adCopy: e.target.value }))}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.cta}
              onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
            >
              {CTAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => void submit("borrador")}
              >
                Guardar borrador
              </Button>
              <Button disabled={saving} onClick={() => void submit("listo_para_publicar")}>
                <Plus className="mr-2 h-4 w-4" />
                Listo para publicar
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Campañas guardadas</h2>
            {(campaigns ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin campañas todavía.</p>
            ) : (
              <ul className="space-y-2">
                {(campaigns ?? []).map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-border/70 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{c.name}</p>
                      <Badge variant={c.status === "listo_para_publicar" ? "success" : "secondary"}>
                        {c.status === "listo_para_publicar" ? "Listo" : "Borrador"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.objective}</p>
                    {c.propertyName && (
                      <p className="text-xs text-muted-foreground">{c.propertyName}</p>
                    )}
                    {c.adCopy && (
                      <p className="mt-2 line-clamp-2 text-sm">{c.adCopy}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageSection>
    </div>
  );
}
