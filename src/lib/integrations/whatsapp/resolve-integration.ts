import type { createServiceRoleClient } from "@/lib/supabase/server";
import { logWebhook } from "@/lib/integrations/whatsapp/webhook-debug";

export type WhatsAppIntegrationRow = {
  id: string;
  owner_id: string;
  status: string;
  config: Record<string, unknown> | null;
  access_token_encrypted: string | null;
};

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

function configPhoneId(config: Record<string, unknown> | null): string {
  return normalizeId(config?.phone_number_id);
}

/**
 * Resolves owner/integration from webhook metadata.phone_number_id.
 * Never throws — returns null if no match (caller should log and return 200).
 */
export async function resolveWhatsAppIntegration(
  admin: ReturnType<typeof createServiceRoleClient>,
  phoneNumberId: string
): Promise<WhatsAppIntegrationRow | null> {
  const target = normalizeId(phoneNumberId);
  if (!target) {
    logWebhook("warn", "resolve_integration_no_phone_number_id");
    return null;
  }

  const { data: rows, error } = await admin
    .from("integrations")
    .select("id, owner_id, status, config, access_token_encrypted")
    .eq("provider", "whatsapp_business");

  if (error) {
    logWebhook("error", "resolve_integration_query_failed", { message: error.message });
    return null;
  }

  const all = (rows ?? []) as WhatsAppIntegrationRow[];
  const active = all.filter((r) => r.status === "connected" || r.status === "pending");

  const exact = active.find((r) => configPhoneId(r.config) === target);
  if (exact) {
    logWebhook("info", "resolve_integration_exact_match", {
      integrationId: exact.id,
      ownerId: exact.owner_id,
      phoneNumberId: target,
    });
    return exact;
  }

  const exactAnyStatus = all.find((r) => configPhoneId(r.config) === target);
  if (exactAnyStatus) {
    logWebhook("warn", "resolve_integration_match_inactive_status", {
      integrationId: exactAnyStatus.id,
      status: exactAnyStatus.status,
      phoneNumberId: target,
    });
    return exactAnyStatus;
  }

  const withToken = active.filter((r) => Boolean(r.access_token_encrypted));
  if (withToken.length === 1) {
    logWebhook("warn", "resolve_integration_fallback_single_active", {
      integrationId: withToken[0]!.id,
      configuredPhoneId: configPhoneId(withToken[0]!.config),
      webhookPhoneNumberId: target,
    });
    return withToken[0]!;
  }

  logWebhook("warn", "resolve_integration_not_found", {
    webhookPhoneNumberId: target,
    activeIntegrations: active.map((r) => ({
      id: r.id,
      status: r.status,
      phone_number_id: configPhoneId(r.config),
    })),
    totalIntegrations: all.length,
  });

  return null;
}
