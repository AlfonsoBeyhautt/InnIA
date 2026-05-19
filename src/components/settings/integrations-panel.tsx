"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/hooks/use-api";
import { useApi } from "@/lib/hooks/use-api";
import type { IntegrationProvider } from "@/lib/supabase/types";

const providerMeta: Record<
  IntegrationProvider,
  { label: string; desc: string }
> = {
  airbnb: { label: "Airbnb", desc: "Calendario y mensajes" },
  booking: { label: "Booking.com", desc: "Reservas y disponibilidad" },
  whatsapp_business: { label: "WhatsApp Business", desc: "Mensajes unificados" },
  email: { label: "Email", desc: "IMAP / SMTP" },
};

type IntegrationRow = {
  id: string;
  provider: IntegrationProvider;
  status: string;
  last_sync_at: string | null;
  sync_status: string | null;
  error_message: string | null;
};

const EMPTY_INTEGRATIONS: IntegrationRow[] = [];

export function IntegrationsPanel() {
  const { data, refetch } = useApi<IntegrationRow[]>(
    "/api/integrations",
    EMPTY_INTEGRATIONS
  );
  const [syncing, setSyncing] = useState<IntegrationProvider | null>(null);

  const rows = data ?? [];
  const providers = Object.keys(providerMeta) as IntegrationProvider[];

  const sync = async (provider: IntegrationProvider) => {
    setSyncing(provider);
    try {
      await apiPost("/api/integrations/sync", { provider });
      await refetch();
    } finally {
      setSyncing(null);
    }
  };

  const toggle = async (provider: IntegrationProvider, connect: boolean) => {
    await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        status: connect ? "connected" : "disconnected",
      }),
    });
    await refetch();
  };

  return (
    <ul className="space-y-3">
      {providers.map((provider) => {
        const row = rows.find((r) => r.provider === provider);
        const meta = providerMeta[provider];
        const connected = row?.status === "connected";

        return (
          <li
            key={provider}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{meta.desc}</p>
                {row?.last_sync_at && (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Último sync: {new Date(row.last_sync_at).toLocaleString("es-UY")}
                    {row.sync_status && ` · ${row.sync_status}`}
                  </p>
                )}
                {row?.error_message && (
                  <p className="mt-0.5 text-[10px] text-red-600">{row.error_message}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {connected ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Desconectado
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggle(provider, !connected)}
              >
                {connected ? "Desconectar" : "Conectar"}
              </Button>
              <Button
                size="sm"
                disabled={syncing === provider}
                onClick={() => sync(provider)}
              >
                {syncing === provider ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sincronizar ahora"
                )}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
