import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { WHATSAPP_WEBHOOK_PUBLIC_URL } from "@/lib/integrations/whatsapp/constants";
import type { WebhookDebugEntry } from "@/lib/integrations/whatsapp/webhook-debug";

export async function GET() {
  return withAuthApiHandler(async () => {
    const { user } = await requireAuth();
    const supabase = await createServerSupabaseClient();

    const { data: row } = await supabase
      .from("integrations")
      .select("id, status, sync_status, error_message, config, last_sync_at, updated_at")
      .eq("owner_id", user.id)
      .eq("provider", "whatsapp_business")
      .maybeSingle();

    const cfg = (row?.config as Record<string, unknown>) ?? {};
    const events = Array.isArray(cfg.webhook_debug_log)
      ? (cfg.webhook_debug_log as WebhookDebugEntry[])
      : [];

    return jsonOk({
      webhookUrl: WHATSAPP_WEBHOOK_PUBLIC_URL,
      integration: row
        ? {
            id: row.id,
            status: row.status,
            sync_status: row.sync_status,
            error_message: row.error_message,
            phone_number_id: cfg.phone_number_id ?? null,
            display_phone_number: cfg.display_phone_number ?? cfg.connected_phone ?? null,
            credentials_configured: Boolean(cfg.credentials_configured),
            last_sync_at: row.last_sync_at,
            updated_at: row.updated_at,
          }
        : null,
      recentEvents: events,
      hint:
        "Si recentEvents está vacío tras enviar un mensaje, revisá que phone_number_id en la integración coincida con metadata.phone_number_id del webhook (Vercel Logs: [whatsapp:webhook]).",
    });
  });
}
