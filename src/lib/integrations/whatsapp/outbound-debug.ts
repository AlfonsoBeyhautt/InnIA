import type { Json } from "@/lib/supabase/types";
import type { createServiceRoleClient } from "@/lib/supabase/server";

export type OutboundDebugEntry = {
  at: string;
  recipient: string;
  phone_number_id: string;
  status: "success" | "error";
  message_length: number;
  meta_error?: string;
  meta_code?: number | string;
};

export function logOutbound(
  event: string,
  detail: Record<string, unknown>
) {
  console.info("[whatsapp:outbound]", { event, ...detail });
}

export async function appendOutboundDebug(
  admin: ReturnType<typeof createServiceRoleClient>,
  integrationId: string,
  entry: Omit<OutboundDebugEntry, "at">
) {
  const { data: row } = await admin
    .from("integrations")
    .select("config")
    .eq("id", integrationId)
    .maybeSingle();

  const cfg = (row?.config as Record<string, unknown>) ?? {};
  const prev = Array.isArray(cfg.outbound_debug_log)
    ? (cfg.outbound_debug_log as OutboundDebugEntry[])
    : [];

  const next: OutboundDebugEntry[] = [
    { ...entry, at: new Date().toISOString() },
    ...prev,
  ].slice(0, 15);

  await admin
    .from("integrations")
    .update({
      config: { ...cfg, outbound_debug_log: next as unknown as Json },
    })
    .eq("id", integrationId);
}
