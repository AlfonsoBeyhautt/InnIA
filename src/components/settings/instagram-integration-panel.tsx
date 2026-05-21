"use client";

import { useState } from "react";
import { ExternalLink, Instagram, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/context/toast-context";
import type { IntegrationRow } from "@/lib/integrations/whatsapp/types";

type InstagramIntegrationPanelProps = {
  row: IntegrationRow | undefined;
  onRefetch: () => Promise<void>;
};

export function InstagramIntegrationPanel({ row, onRefetch }: InstagramIntegrationPanelProps) {
  const { toast } = useToast();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cfg = row?.config ?? {};
  const status = row?.status ?? "disconnected";
  const [form, setForm] = useState({
    instagram_business_account_id: String(cfg.instagram_business_account_id ?? ""),
    page_id: String(cfg.page_id ?? ""),
    access_token: "",
  });

  const saveAdvanced = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        provider: "instagram",
        config: {
          instagram_business_account_id: form.instagram_business_account_id.trim(),
          page_id: form.page_id.trim(),
          connection_method: "manual",
        },
      };
      if (form.access_token.trim()) body.access_token = form.access_token.trim();
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      await onRefetch();
      toast("Configuración de Instagram guardada.", "success");
    } catch {
      toast("No se pudo guardar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel =
    status === "connected"
      ? "Conectado"
      : status === "pending"
        ? "Requiere permisos Meta"
        : row
          ? "Preparado"
          : "No conectado";

  return (
    <article className="rounded-[20px] border border-border/70 bg-white p-5 shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white">
          <Instagram className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Instagram</h3>
          <Badge variant={status === "connected" ? "success" : "secondary"} className="mt-1">
            {statusLabel}
          </Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            Mensajes directos de Instagram Business vía Meta Messaging API.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button className="rounded-xl" disabled title="Próximamente: Embedded Signup Meta">
          <ExternalLink className="mr-2 h-4 w-4" />
          Continuar con Meta
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setAdvancedOpen((o) => !o)}>
          Configuración avanzada
        </Button>
      </div>

      {advancedOpen && (
        <div className="mt-4 space-y-3 rounded-xl border border-dashed p-4">
          <Input
            placeholder="Instagram Business Account ID"
            value={form.instagram_business_account_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, instagram_business_account_id: e.target.value }))
            }
          />
          <Input
            placeholder="Facebook Page ID"
            value={form.page_id}
            onChange={(e) => setForm((f) => ({ ...f, page_id: e.target.value }))}
          />
          <Input
            placeholder="Access Token"
            type="password"
            value={form.access_token}
            onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
          />
          <Button size="sm" onClick={() => void saveAdvanced()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Webhook: <code className="text-[10px]">/api/webhooks/instagram</code>
          </p>
        </div>
      )}
    </article>
  );
}
