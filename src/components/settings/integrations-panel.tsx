"use client";

import { useState } from "react";
import { useToast } from "@/context/toast-context";
import { CheckCircle2, Loader2, MessageCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost } from "@/lib/hooks/use-api";
import { useApi } from "@/lib/hooks/use-api";
import type { IntegrationProvider } from "@/lib/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhatsAppIntegrationPanel } from "@/components/settings/whatsapp-integration-panel";
import type { IntegrationRow } from "@/lib/integrations/whatsapp/types";

const providerMeta: Record<
  Exclude<IntegrationProvider, "whatsapp_business">,
  { label: string; desc: string; partnerNote?: string }
> = {
  email: { label: "Email", desc: "Envío con Resend" },
  airbnb: {
    label: "Airbnb",
    desc: "Sincronización de calendario iCal",
    partnerNote:
      "Airbnb requiere acceso partner para sincronización completa de mensajes. Por ahora podés sincronizar calendario mediante iCal.",
  },
  booking: {
    label: "Booking.com",
    desc: "Preparado · calendario iCal",
    partnerNote:
      "Booking.com requiere Connectivity API para sincronización completa. Por ahora podés preparar la conexión o usar iCal.",
  },
};

const EMPTY: IntegrationRow[] = [];

const otherProviders = Object.keys(providerMeta) as Exclude<
  IntegrationProvider,
  "whatsapp_business"
>[];

export function IntegrationsPanel() {
  const { toast } = useToast();
  const { data, refetch } = useApi<IntegrationRow[]>("/api/integrations", EMPTY);
  const [syncing, setSyncing] = useState<IntegrationProvider | null>(null);
  const [configuring, setConfiguring] = useState<IntegrationProvider | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rows = data ?? [];
  const whatsappRow = rows.find((r) => r.provider === "whatsapp_business");

  const openConfig = (provider: IntegrationProvider) => {
    const row = rows.find((r) => r.provider === provider);
    const cfg = row?.config ?? {};
    setForm({
      from_email: String(cfg.from_email ?? ""),
      from_name: String(cfg.from_name ?? ""),
      api_key: "",
      ical_url: String(cfg.ical_url ?? ""),
    });
    setConfiguring(provider);
  };

  const saveConfig = async () => {
    if (!configuring || configuring === "whatsapp_business") return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { provider: configuring };
      if (configuring === "email") {
        body.config = {
          provider: "resend",
          from_email: form.from_email,
          from_name: form.from_name,
        };
        if (form.api_key) body.access_token = form.api_key;
      } else {
        body.config = { ical_url: form.ical_url };
      }
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al guardar");
      await refetch();
      toast("Configuración guardada.", "success");
      setConfiguring(null);
    } catch {
      toast("No se pudo guardar la configuración.", "error");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async (provider: IntegrationProvider) => {
    try {
      await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, status: "disconnected", sync_status: null }),
      });
      await refetch();
      toast(`${providerMeta[provider as keyof typeof providerMeta].label} desconectado.`, "info");
    } catch {
      toast("No se pudo desconectar.", "error");
    }
  };

  const sync = async (provider: IntegrationProvider) => {
    setSyncing(provider);
    try {
      if (provider === "airbnb" || provider === "booking") {
        const result = await apiPost<{ message: string }>("/api/integrations/ical/sync", {
          provider,
        });
        toast(result.message, "success");
      } else {
        await apiPost("/api/integrations/sync", { provider });
        toast(`${providerMeta[provider as keyof typeof providerMeta].label} sincronizado.`, "success");
      }
      await refetch();
    } catch {
      toast(`No se pudo sincronizar.`, "error");
    } finally {
      setSyncing(null);
    }
  };

  const statusLabel = (row?: IntegrationRow) => {
    if (!row || row.status === "disconnected") return "Desconectado";
    if (row.status === "pending") return "Pendiente";
    if (row.sync_status === "ical_configured") return "Calendario configurado";
    if (row.sync_status === "ical_synced") return "Calendario sincronizado";
    if (row.provider === "airbnb" || row.provider === "booking") {
      return row.status === "connected" ? "Preparado" : "Desconectado";
    }
    return row.status === "connected" ? "Conectado" : row.status;
  };

  return (
    <>
      <WhatsAppIntegrationPanel row={whatsappRow} onRefetch={refetch} />

      <ul className="space-y-3">
        {otherProviders.map((provider) => {
          const row = rows.find((r) => r.provider === provider);
          const meta = providerMeta[provider];
          const connected = row?.status === "connected" || row?.status === "pending";
          const isPartner = provider === "airbnb" || provider === "booking";

          return (
            <li
              key={provider}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/70 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  {meta.partnerNote && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-amber-900/90 bg-amber-50 rounded-lg px-2 py-1.5 border border-amber-100">
                      {meta.partnerNote}
                    </p>
                  )}
                  {isPartner && connected && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Mensajes requieren integración avanzada
                    </p>
                  )}
                  {row?.last_sync_at && (
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Último sync: {new Date(row.last_sync_at).toLocaleString("es-UY")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    connected && row?.status !== "pending" ? "success" : "warning"
                  }
                  className="gap-1"
                >
                  {connected && row?.status !== "pending" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {statusLabel(row)}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => openConfig(provider)}>
                  Configurar
                </Button>
                {connected && (
                  <Button variant="ghost" size="sm" onClick={() => disconnect(provider)}>
                    Desconectar
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={syncing === provider}
                  onClick={() => sync(provider)}
                >
                  {syncing === provider ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPartner ? (
                    "Sincronizar calendario"
                  ) : (
                    "Sincronizar"
                  )}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!configuring} onOpenChange={(o) => !o && setConfiguring(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {configuring ? providerMeta[configuring as keyof typeof providerMeta].label : "Integración"}
            </DialogTitle>
          </DialogHeader>
          {configuring === "email" && (
            <div className="space-y-2">
              <Input
                placeholder="Email remitente"
                value={form.from_email}
                onChange={(e) => setForm((f) => ({ ...f, from_email: e.target.value }))}
              />
              <Input
                placeholder="Nombre"
                value={form.from_name}
                onChange={(e) => setForm((f) => ({ ...f, from_name: e.target.value }))}
              />
              <Input
                placeholder="API Key Resend"
                type="password"
                value={form.api_key}
                onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
              />
            </div>
          )}
          {(configuring === "airbnb" || configuring === "booking") && (
            <div className="space-y-2">
              <Input
                placeholder="Enlace iCal"
                value={form.ical_url}
                onChange={(e) => setForm((f) => ({ ...f, ical_url: e.target.value }))}
              />
            </div>
          )}
          <Button className="w-full mt-4" onClick={() => void saveConfig()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
