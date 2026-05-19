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

const providerMeta: Record<
  IntegrationProvider,
  { label: string; desc: string; partnerNote?: string }
> = {
  whatsapp_business: {
    label: "WhatsApp Business",
    desc: "Mensajes reales vía Meta Cloud API",
  },
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

type IntegrationRow = {
  id: string;
  provider: IntegrationProvider;
  status: string;
  last_sync_at: string | null;
  sync_status: string | null;
  error_message: string | null;
  config: Record<string, unknown>;
};

const EMPTY: IntegrationRow[] = [];

export function IntegrationsPanel() {
  const { toast } = useToast();
  const { data, refetch } = useApi<IntegrationRow[]>("/api/integrations", EMPTY);
  const [syncing, setSyncing] = useState<IntegrationProvider | null>(null);
  const [configuring, setConfiguring] = useState<IntegrationProvider | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rows = data ?? [];
  const providers = Object.keys(providerMeta) as IntegrationProvider[];

  const openConfig = (provider: IntegrationProvider) => {
    const row = rows.find((r) => r.provider === provider);
    const cfg = row?.config ?? {};
    setForm({
      phone_number_id: String(cfg.phone_number_id ?? ""),
      business_account_id: String(cfg.business_account_id ?? ""),
      verify_token: "",
      access_token: "",
      from_email: String(cfg.from_email ?? ""),
      from_name: String(cfg.from_name ?? ""),
      api_key: "",
      ical_url: String(cfg.ical_url ?? ""),
    });
    setConfiguring(provider);
  };

  const saveConfig = async () => {
    if (!configuring) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { provider: configuring };
      if (configuring === "whatsapp_business") {
        body.config = {
          phone_number_id: form.phone_number_id,
          business_account_id: form.business_account_id,
          verify_token: form.verify_token || undefined,
        };
        if (form.access_token) body.access_token = form.access_token;
      } else if (configuring === "email") {
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
      toast(`${providerMeta[provider].label} desconectado.`, "info");
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
        toast(`${providerMeta[provider].label} sincronizado.`, "success");
      }
      await refetch();
    } catch {
      toast(`No se pudo sincronizar ${providerMeta[provider].label}.`, "error");
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
      <ul className="space-y-3">
        {providers.map((provider) => {
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
              {configuring ? providerMeta[configuring].label : "Integración"}
            </DialogTitle>
          </DialogHeader>
          {configuring === "whatsapp_business" && (
            <div className="space-y-2">
              <Input
                placeholder="Phone Number ID"
                value={form.phone_number_id}
                onChange={(e) => setForm((f) => ({ ...f, phone_number_id: e.target.value }))}
              />
              <Input
                placeholder="Business Account ID"
                value={form.business_account_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_account_id: e.target.value }))
                }
              />
              <Input
                placeholder="Access Token"
                type="password"
                value={form.access_token}
                onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
              />
              <Input
                placeholder="Verify Token"
                value={form.verify_token}
                onChange={(e) => setForm((f) => ({ ...f, verify_token: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Webhook: {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/whatsapp` : "/api/webhooks/whatsapp"}
              </p>
            </div>
          )}
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
