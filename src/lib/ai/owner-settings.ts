import { requireAuth } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/types";

import type { createServiceRoleClient } from "@/lib/supabase/server";

export type OwnerAiSettings = {
  ai_auto_classification?: boolean;
  ai_auto_reply_enabled?: boolean;
  /** Process each inbound guest message with AI without manual button */
  ai_auto_process_enabled?: boolean;
  channel_rules?: Record<string, { auto_reply?: boolean }>;
};

const DEFAULTS: OwnerAiSettings = {
  ai_auto_classification: true,
  ai_auto_reply_enabled: true,
  ai_auto_process_enabled: true,
  channel_rules: {
    whatsapp: { auto_reply: true },
    instagram: { auto_reply: true },
    airbnb: { auto_reply: false },
    booking: { auto_reply: false },
  },
};

export async function getOwnerAiSettingsForId(
  admin: ReturnType<typeof createServiceRoleClient>,
  ownerId: string
): Promise<OwnerAiSettings> {
  const { data } = await admin
    .from("profiles")
    .select("ai_settings")
    .eq("id", ownerId)
    .maybeSingle();

  const raw = (data?.ai_settings as OwnerAiSettings | null) ?? {};
  return { ...DEFAULTS, ...raw };
}

export async function getOwnerAiSettings(): Promise<OwnerAiSettings> {
  const { supabase, user } = await requireAuth();
  return getOwnerAiSettingsForId(supabase, user.id);
}

export async function updateOwnerAiSettings(
  patch: Partial<OwnerAiSettings>
): Promise<OwnerAiSettings> {
  const current = await getOwnerAiSettings();
  const next = { ...current, ...patch };
  const { supabase, user } = await requireAuth();
  await supabase
    .from("profiles")
    .update({ ai_settings: next as unknown as Json })
    .eq("id", user.id);
  return next;
}
