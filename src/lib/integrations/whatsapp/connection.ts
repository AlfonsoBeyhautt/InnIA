import type { IntegrationRow } from "@/lib/integrations/whatsapp/types";
import { isWhatsAppConfigComplete } from "@/lib/integrations/config-types";

export type WhatsAppConnectionState =
  | "not_connected"
  | "pending"
  | "connected"
  | "error"
  | "meta_setup_required";

export type WhatsAppConnectionInfo = {
  state: WhatsAppConnectionState;
  label: string;
  lastSync: string | null;
  connectedPhone: string | null;
  errorMessage: string | null;
  credentialsConfigured: boolean;
  connectionMethod: "meta" | "manual" | null;
};

export function resolveWhatsAppConnection(
  row: IntegrationRow | undefined,
  metaServerConfigured: boolean
): WhatsAppConnectionInfo {
  const cfg = (row?.config ?? {}) as Record<string, unknown>;
  const credentialsConfigured = Boolean(cfg.credentials_configured);
  const hasToken = credentialsConfigured;
  const complete = isWhatsAppConfigComplete({
    phone_number_id: String(cfg.phone_number_id ?? ""),
    access_token: hasToken ? "configured" : "",
  });

  const connectedPhone =
    (cfg.display_phone_number as string | undefined) ??
    (cfg.connected_phone as string | undefined) ??
    null;

  const connectionMethod =
    cfg.connection_method === "meta" || cfg.connection_method === "manual"
      ? cfg.connection_method
      : null;

  const lastSync = row?.last_sync_at ?? null;
  const errorMessage = row?.error_message ?? null;

  if (errorMessage || row?.sync_status === "error") {
    return {
      state: "error",
      label: "Error de conexión",
      lastSync,
      connectedPhone,
      errorMessage,
      credentialsConfigured,
      connectionMethod,
    };
  }

  if (!row || row.status === "disconnected") {
    return {
      state: "not_connected",
      label: "No conectado",
      lastSync,
      connectedPhone,
      errorMessage,
      credentialsConfigured,
      connectionMethod,
    };
  }

  if (
    row.sync_status === "meta_pending" ||
    (connectionMethod === "meta" && !metaServerConfigured && !complete)
  ) {
    return {
      state: "meta_setup_required",
      label: "Requiere configuración en Meta",
      lastSync,
      connectedPhone,
      errorMessage,
      credentialsConfigured,
      connectionMethod,
    };
  }

  if (
    row.status === "pending" ||
    row.sync_status === "pending_oauth" ||
    row.sync_status === "pending_credentials"
  ) {
    return {
      state: "pending",
      label: "Pendiente de conexión",
      lastSync,
      connectedPhone,
      errorMessage,
      credentialsConfigured,
      connectionMethod,
    };
  }

  if (row.status === "connected" && complete) {
    return {
      state: "connected",
      label: "Conectado",
      lastSync,
      connectedPhone,
      errorMessage,
      credentialsConfigured,
      connectionMethod,
    };
  }

  return {
    state: "pending",
    label: "Pendiente de conexión",
    lastSync,
    connectedPhone,
    errorMessage,
    credentialsConfigured,
    connectionMethod,
  };
}
