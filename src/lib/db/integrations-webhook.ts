import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getWhatsAppVerifyTokensFromDb(): Promise<string[]> {
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("integrations")
      .select("config")
      .eq("provider", "whatsapp_business");

    return (data ?? [])
      .map((row) => (row.config as Record<string, unknown> | null)?.verify_token)
      .filter((t): t is string => typeof t === "string" && t.length > 0);
  } catch {
    return [];
  }
}
