import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getIntegrations } from "@/lib/db/queries";
import { upsertIntegrationConfig } from "@/lib/db/mutations";
import {
  isEmailConfigComplete,
  isWhatsAppConfigComplete,
  sanitizeIntegrationForClient,
} from "@/lib/integrations/config-types";
import type { IntegrationProvider } from "@/lib/supabase/types";

export async function GET() {
  return withAuthApiHandler(async () => {
    const rows = await getIntegrations();
    const safe = rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      status: row.status,
      last_sync_at: row.last_sync_at,
      sync_status: row.sync_status,
      error_message: row.error_message,
      config: sanitizeIntegrationForClient(
        row.provider,
        (row.config as Record<string, unknown>) ?? {},
        Boolean(row.access_token_encrypted)
      ),
    }));
    return jsonOk(safe);
  });
}

export async function PATCH(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const provider = body.provider as IntegrationProvider;
    let config = body.config as Record<string, unknown> | undefined;

    let status = body.status as string | undefined;
    let sync_status = body.sync_status as string | undefined;

    if (config) {
      const rows = await getIntegrations();
      const existing = rows.find((i) => i.provider === provider);
      const prev = (existing?.config as Record<string, unknown>) ?? {};
      config = { ...prev, ...config };
      if (provider === "whatsapp_business") {
        const method =
          config.connection_method === "meta" ? "meta" : "manual";
        if (config.phone_number_id !== undefined) {
          config.phone_number_id = String(config.phone_number_id).trim();
        }
        const ok = isWhatsAppConfigComplete({
          phone_number_id: String(config.phone_number_id ?? ""),
          business_account_id: config.business_account_id as string | undefined,
          access_token:
            (body.access_token as string) ?? (config.access_token as string) ?? "",
          connection_method: method,
        });
        status = ok ? "connected" : "pending";
        sync_status = ok ? "ready" : "pending_credentials";
        config.connection_method = method;
      }
      if (provider === "email") {
        const ok = isEmailConfigComplete({
          ...config,
          api_key: (body.access_token as string) ?? (config.api_key as string),
        });
        status = ok ? "connected" : "pending";
        sync_status = ok ? "ready" : "pending_credentials";
      }
      if (provider === "airbnb" || provider === "booking") {
        status = config.ical_url ? "connected" : "disconnected";
        sync_status = config.ical_url ? "ical_configured" : undefined;
      }
    }

    const accessToken =
      body.access_token === null || body.access_token === ""
        ? null
        : (body.access_token as string | undefined);

    const row = await upsertIntegrationConfig(provider, {
      status,
      sync_status,
      error_message: body.error_message ?? null,
      config,
      accessToken:
        accessToken !== undefined ? accessToken : undefined,
    });

    return jsonOk({
      id: row.id,
      provider: row.provider,
      status: row.status,
      sync_status: row.sync_status,
      error_message: row.error_message,
      config: sanitizeIntegrationForClient(
        row.provider,
        (row.config as Record<string, unknown>) ?? {},
        Boolean(row.access_token_encrypted)
      ),
    });
  });
}
