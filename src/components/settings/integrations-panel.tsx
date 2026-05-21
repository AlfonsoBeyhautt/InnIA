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
import { InstagramIntegrationPanel } from "@/components/settings/instagram-integration-panel";
import type { IntegrationRow } from "@/lib/integrations/whatsapp/types";

const partnerMeta = {
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
} as const;

const partnerProviders = ["airbnb", "booking"] as const;

const EMPTY: IntegrationRow[] = [];

export function IntegrationsPanel() {
  const { toast } = useToast();
  const { data, refetch } = useApi<IntegrationRow[]>("/api/integrations", EMPTY);
  const [syncing, setSyncing] = useState<IntegrationProvider | null>(null);
  const [configuring, setConfiguring] = useState<"airbnb" | "booking" | "email" | null>(
    null
  );
  const [emailOpen, setEmailOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rows = data ?? [];
  const whatsappRow = rows.find((r) => r.provider === "whatsapp_business");
  const instagramRow = rows.find((r) => r.provider === "instagram");
  const emailRow = rows.find((r) => r.provider === "email");

  const openConfig = (provider: "airbnb" | "booking" | "email") => {
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
    if (!configuring) return;
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
      toast("Integración desconectada.", "info");
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
        toast("Sincronizado.", "success");
      }
      await refetch();
    } catch {
      toast("No se pudo sincronizar.", "error");
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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Canales principales
        </p>
        <div className="mt-3 space-y-4">
          <WhatsAppIntegrationPanel row={whatsappRow} onRefetch={refetch} />
          <InstagramIntegrationPanel row={instagramRow} onRefetch={refetch} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Plataformas de reserva
        </p>
        <ul className="mt-3 space-y-3">
          {partnerProviders.map((provider) => {
            const row = rows.find((r) => r.provider === provider);
            const meta = partnerMeta[provider];
            const connected = row?.status === "connected" || row?.status === "pending";

            return (
              <li
                key={provider}
                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/70 bg-white p-4 shadow-sm"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.desc}</p>
                    <p className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-900/90">
                      {meta.partnerNote}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={connected ? "success" : "warning"} className="gap-1">
                    {connected ? (
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
                    ) : (
                      "Sincronizar calendario"
                    )}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setEmailOpen((o) => !o)}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Otros canales {emailOpen ? "▾" : "▸"} — Email (secundario)
        </button>
        {emailOpen && (
          <li className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 list-none">
            <div>
              <p className="font-medium text-sm">Email</p>
              <p className="text-xs text-muted-foreground">Resend · no prioritario en Centro de mensajes</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={emailRow?.status === "connected" ? "success" : "secondary"}>
                {statusLabel(emailRow)}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => openConfig("email")}>
                Configurar
              </Button>
            </div>
          </li>
        )}
      </div>

      <Dialog open={!!configuring} onOpenChange={(o) => !o && setConfiguring(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {configuring === "email"
                ? "Email"
                : configuring
                  ? partnerMeta[configuring].label
                  : "Integración"}
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
            <Input
              placeholder="Enlace iCal"
              value={form.ical_url}
              onChange={(e) => setForm((f) => ({ ...f, ical_url: e.target.value }))}
            />
          )}
          <Button className="mt-4 w-full" onClick={() => void saveConfig()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
