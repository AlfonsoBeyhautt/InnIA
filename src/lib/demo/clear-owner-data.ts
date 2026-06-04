import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ClearOwnerDataResult = {
  cleared: boolean;
  message: string;
};

/**
 * Removes all operational data for an owner (properties, guests, inbox, etc.).
 * Profile and auth user are kept.
 */
export async function clearOwnerOperationalData(
  userId: string
): Promise<ClearOwnerDataResult> {
  const supabase = await createServerSupabaseClient();

  const { data: props } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", userId);
  const propertyIds = (props ?? []).map((p) => p.id);

  const { data: convs } = await supabase
    .from("conversations")
    .select("id")
    .eq("owner_id", userId);
  const conversationIds = (convs ?? []).map((c) => c.id);

  if (conversationIds.length > 0) {
    await supabase
      .from("ai_response_logs")
      .delete()
      .in("conversation_id", conversationIds);
    await supabase.from("messages").delete().in("conversation_id", conversationIds);
  }

  await supabase.from("conversations").delete().eq("owner_id", userId);

  if (propertyIds.length > 0) {
    await supabase.from("reservations").delete().in("property_id", propertyIds);
    await supabase.from("knowledge_base_items").delete().in("property_id", propertyIds);
    await supabase.from("units").delete().in("property_id", propertyIds);
  }

  await supabase.from("operation_tasks").delete().eq("owner_id", userId);
  await supabase.from("notifications").delete().eq("owner_id", userId);
  await supabase.from("ad_campaigns").delete().eq("owner_id", userId);
  await supabase.from("properties").delete().eq("owner_id", userId);
  await supabase.from("guests").delete().eq("owner_id", userId);
  await supabase.from("integrations").delete().eq("owner_id", userId);

  return {
    cleared: true,
    message: "Datos operativos eliminados. Podés cargar el pack demo de nuevo.",
  };
}
