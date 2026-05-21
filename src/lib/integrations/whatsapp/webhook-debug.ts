import type { Json } from "@/lib/supabase/types";
import type { createServiceRoleClient } from "@/lib/supabase/server";

export type WebhookDebugEntry = {
  at: string;
  level: "info" | "warn" | "error";
  event: string;
  detail?: Record<string, unknown>;
};

const MAX_EVENTS = 15;

export function logWebhook(
  level: WebhookDebugEntry["level"],
  event: string,
  detail?: Record<string, unknown>
) {
  const line = { level, event, ...detail };
  if (level === "error") console.error("[whatsapp:webhook]", line);
  else if (level === "warn") console.warn("[whatsapp:webhook]", line);
  else console.info("[whatsapp:webhook]", line);
}

export function safePayloadSummary(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return { type: typeof payload };
  }
  const p = payload as {
    object?: string;
    entry?: {
      id?: string;
      changes?: {
        field?: string;
        value?: {
          metadata?: { phone_number_id?: string; display_phone_number?: string };
          messages?: { id?: string; from?: string; type?: string }[];
          statuses?: unknown[];
        };
      }[];
    }[];
  };

  const entries = p.entry ?? [];
  const changes = entries.flatMap((e) => e.changes ?? []);
  return {
    object: p.object,
    entryCount: entries.length,
    changes: changes.map((c) => ({
      field: c.field,
      phone_number_id: c.value?.metadata?.phone_number_id,
      display_phone_number: c.value?.metadata?.display_phone_number,
      messageCount: c.value?.messages?.length ?? 0,
      statusCount: c.value?.statuses?.length ?? 0,
      messageTypes: (c.value?.messages ?? []).map((m) => m.type),
      from: (c.value?.messages ?? []).map((m) => m.from),
    })),
  };
}

export async function appendWebhookDebug(
  admin: ReturnType<typeof createServiceRoleClient>,
  integrationId: string | null,
  entry: Omit<WebhookDebugEntry, "at">
) {
  if (!integrationId) return;

  const { data: row } = await admin
    .from("integrations")
    .select("config")
    .eq("id", integrationId)
    .maybeSingle();

  const cfg = (row?.config as Record<string, unknown>) ?? {};
  const prev = Array.isArray(cfg.webhook_debug_log)
    ? (cfg.webhook_debug_log as WebhookDebugEntry[])
    : [];

  const next: WebhookDebugEntry[] = [
    { ...entry, at: new Date().toISOString() },
    ...prev,
  ].slice(0, MAX_EVENTS);

  await admin
    .from("integrations")
    .update({
      config: { ...cfg, webhook_debug_log: next as unknown as Json },
    })
    .eq("id", integrationId);
}
