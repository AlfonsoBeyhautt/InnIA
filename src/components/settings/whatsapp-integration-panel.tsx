"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/context/toast-context";
import { useApi, apiPost } from "@/lib/hooks/use-api";
import { cn } from "@/lib/utils";
import {
  META_DEVELOPERS_URL,
  WHATSAPP_WEBHOOK_PUBLIC_URL,
} from "@/lib/integrations/whatsapp/constants";
import { resolveWhatsAppConnection } from "@/lib/integrations/whatsapp/connection";
import type { IntegrationRow } from "@/lib/integrations/whatsapp/types";

type MetaStatusResponse = {
  metaConfigured: boolean;
  missing: string[];
  webhookUrl: string;
};

type OAuthStartResponse =
  | { redirect: true; url: string }
  | { redirect: false; reason: string; missing: string[] };

const META_GUIDE_STEPS = [
  "Creá una app en Meta for Developers",
  "Agregá el producto WhatsApp",
  "Creá o seleccioná un Business Portfolio",
  "Configurá el webhook de InnIA",
  "Autorizá el número de WhatsApp Business",
];

function statusBadgeVariant(
  state: ReturnType<typeof resolveWhatsAppConnection>["state"]
): "success" | "warning" | "danger" | "secondary" {
  switch (state) {
    case "connected":
      return "success";
    case "error":
      return "danger";
    case "pending":
    case "meta_setup_required":
      return "warning";
    default:
      return "secondary";
  }
}

type WhatsAppIntegrationPanelProps = {
  row: IntegrationRow | undefined;
  onRefetch: () => Promise<void>;
};

export function WhatsAppIntegrationPanel({ row, onRefetch }: WhatsAppIntegrationPanelProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { data: metaStatus } = useApi<MetaStatusResponse>(
    "/api/integrations/whatsapp/meta-status",
    {
      metaConfigured: false,
      missing: [],
      webhookUrl: WHATSAPP_WEBHOOK_PUBLIC_URL,
    }
  );

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [missingEnvOpen, setMissingEnvOpen] = useState(false);
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAutoReply, setSavingAutoReply] = useState(false);
  const aiAutoReplyEnabled =
    (row?.config as Record<string, unknown> | undefined)?.ai_auto_reply_enabled !==
    false;
  const [form, setForm] = useState({
    phone_number_id: "",
    business_account_id: "",
    access_token: "",
    verify_token: "",
  });

  const connection = useMemo(
    () => resolveWhatsAppConnection(row, metaStatus?.metaConfigured ?? false),
    [row, metaStatus?.metaConfigured]
  );

  const webhookUrl = metaStatus?.webhookUrl ?? WHATSAPP_WEBHOOK_PUBLIC_URL;

  useEffect(() => {
    const cfg = row?.config ?? {};
    setForm({
      phone_number_id: String(cfg.phone_number_id ?? ""),
      business_account_id: String(cfg.business_account_id ?? ""),
      access_token: "",
      verify_token: "",
    });
  }, [row]);

  useEffect(() => {
    const wa = searchParams.get("whatsapp");
    if (!wa) return;
    const err = searchParams.get("whatsapp_error");
    if (wa === "connected") toast("WhatsApp Business conectado correctamente.", "success");
    else if (wa === "pending") toast("Conexión con Meta iniciada. Completá la autorización si falta un paso.", "info");
    else if (wa === "error") toast(err ?? "No se pudo completar la conexión con Meta.", "error");
    void onRefetch();
  }, [searchParams, toast, onRefetch]);

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast("Webhook copiado al portapapeles.", "success");
    } catch {
      toast("No se pudo copiar.", "error");
    }
  };

  const continueWithMeta = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/whatsapp/oauth/start");
      const json = (await res.json()) as OAuthStartResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al iniciar conexión");

      if ("redirect" in json && json.redirect === false) {
        setMissingVars(json.missing ?? []);
        setMissingEnvOpen(true);
        return;
      }

      if ("url" in json && json.url) {
        window.location.href = json.url;
        return;
      }

      setGuideOpen(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo iniciar la conexión.", "error");
    } finally {
      setConnecting(false);
    }
  };

  const saveAdvanced = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        provider: "whatsapp_business",
        config: {
          phone_number_id: form.phone_number_id.trim(),
          business_account_id: form.business_account_id.trim() || undefined,
          verify_token: form.verify_token.trim() || undefined,
          connection_method: "manual",
        },
      };
      if (form.access_token.trim()) body.access_token = form.access_token.trim();

      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al guardar");
      await onRefetch();
      toast("Configuración avanzada guardada.", "success");
      setAdvancedOpen(false);
    } catch {
      toast("No se pudo guardar la configuración.", "error");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = useCallback(async () => {
    try {
      await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "whatsapp_business",
          status: "disconnected",
          sync_status: null,
          error_message: null,
          config: {},
          access_token: "",
        }),
      });
      await onRefetch();
      toast("WhatsApp Business desconectado.", "info");
    } catch {
      toast("No se pudo desconectar.", "error");
    }
  }, [onRefetch, toast]);

  const toggleAiAutoReply = async (enabled: boolean) => {
    setSavingAutoReply(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "whatsapp_business",
          config: { ai_auto_reply_enabled: enabled },
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      await onRefetch();
      toast(
        enabled
          ? "Respuestas automáticas por IA activadas."
          : "Respuestas automáticas por IA desactivadas.",
        "success"
      );
    } catch {
      toast("No se pudo actualizar la preferencia.", "error");
    } finally {
      setSavingAutoReply(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await apiPost<{
        ok: boolean;
        displayPhoneNumber?: string;
        verifiedName?: string;
      }>("/api/integrations/whatsapp/test", {});
      const phone = result.displayPhoneNumber
        ? ` · ${result.displayPhoneNumber}`
        : "";
      toast(`Conexión verificada${phone}.`, "success");
      await onRefetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : "La prueba de conexión falló.", "error");
      await onRefetch();
    } finally {
      setTesting(false);
    }
  };

  const StatusIcon =
    connection.state === "connected"
      ? CheckCircle2
      : connection.state === "error"
        ? AlertCircle
        : XCircle;

  const showPrimaryConnect =
    connection.state === "not_connected" ||
    connection.state === "meta_setup_required" ||
    connection.state === "pending";

  return (
    <>
      <article className="rounded-[20px] border border-border/70 bg-white p-5 shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold">WhatsApp Business</h3>
              <Badge variant={statusBadgeVariant(connection.state)} className="mt-1.5 gap-1">
                <StatusIcon className="h-3 w-3" />
                {connection.label}
              </Badge>
              {connection.connectedPhone && (
                <p className="mt-2 text-sm text-foreground">
                  Número: <span className="font-medium">{connection.connectedPhone}</span>
                </p>
              )}
              {connection.lastSync && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Última sincronización:{" "}
                  {new Date(connection.lastSync).toLocaleString("es-UY")}
                </p>
              )}
              {connection.errorMessage && (
                <p className="mt-1.5 text-xs text-danger">{connection.errorMessage}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-border/60 pt-5">
          <div>
            <h4 className="text-sm font-semibold">Conectar WhatsApp Business</h4>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Conectá tu número de WhatsApp Business para centralizar mensajes en InnIA y
              permitir respuestas automáticas con IA.
            </p>
          </div>

          {showPrimaryConnect && (
            <Button
              className="w-full sm:w-auto rounded-xl"
              onClick={() => void continueWithMeta()}
              disabled={connecting}
            >
              {connecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Continuar con Meta
            </Button>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Serás redirigido a Meta para seleccionar tu cuenta de WhatsApp Business y autorizar
            la conexión.
          </p>

          {connection.state === "connected" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-sand/40 p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border"
                checked={aiAutoReplyEnabled}
                disabled={savingAutoReply}
                onChange={(e) => void toggleAiAutoReply(e.target.checked)}
              />
              <span className="text-sm leading-snug">
                <span className="font-medium text-foreground">
                  Respuestas automáticas por IA (WhatsApp)
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Si la IA tiene confianza alta en consultas simples, envía la respuesta por
                  WhatsApp sin esperar tu aprobación.
                </span>
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            {connection.state !== "not_connected" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => void testConnection()}
                  disabled={testing}
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Probar conexión"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setWebhookOpen(true)}
                >
                  Ver webhook
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-muted-foreground"
                  onClick={() => void disconnect()}
                >
                  Desconectar
                </Button>
              </>
            )}
            {connection.state === "not_connected" && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setWebhookOpen(true)}
              >
                Ver webhook
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left text-sm font-medium text-primary hover:underline"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
            />
            Configuración avanzada
          </button>

          {advancedOpen && (
            <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">
                Para pruebas manuales mientras Embedded Signup no esté completo. Los tokens no
                se muestran después de guardarlos.
              </p>
              <Input
                placeholder="Phone Number ID"
                value={form.phone_number_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_number_id: e.target.value }))
                }
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
                placeholder="Verify Token (opcional, para webhook)"
                value={form.verify_token}
                onChange={(e) => setForm((f) => ({ ...f, verify_token: e.target.value }))}
              />
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => void saveAdvanced()}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar configuración"}
              </Button>
            </div>
          )}
        </div>
      </article>

      <Dialog open={missingEnvOpen} onOpenChange={setMissingEnvOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar app de Meta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Para activar esta conexión falta configurar la app de Meta en el servidor de InnIA.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {missingVars.map((v) => (
              <li key={v} className="font-mono text-xs text-foreground">
                {v}
              </li>
            ))}
          </ul>
          <Button
            className="mt-4 w-full rounded-xl"
            variant="outline"
            onClick={() => {
              setMissingEnvOpen(false);
              setGuideOpen(true);
            }}
          >
            Ver guía de configuración
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp Business</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Para conectar WhatsApp Business necesitás:</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground">
            {META_GUIDE_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Webhook de InnIA:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{webhookUrl}</code>
          </p>
          <Button asChild className="mt-4 w-full rounded-xl">
            <a href={META_DEVELOPERS_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ir a Meta for Developers
            </a>
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Webhook de WhatsApp</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Configurá esta URL en Meta for Developers → WhatsApp → Configuration → Webhook.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-3">
            <code className="flex-1 break-all text-xs">{webhookUrl}</code>
            <Button type="button" variant="outline" size="icon" onClick={() => void copyWebhook()}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Verify Token: usá el valor de{" "}
            <span className="font-mono">WHATSAPP_VERIFY_TOKEN</span> en el servidor (o el que
            indiques en configuración avanzada).
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
