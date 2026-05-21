import { classifyConversationIntent } from "@/lib/conversations/intent-classifier";
import type { IntentCategory } from "@/types";
import type { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";

type AdminClient = ReturnType<typeof createServiceRoleClient>;

export async function applyIntentToConversation(
  conversationId: string,
  input: {
    messageText: string;
    hasReservation: boolean;
    channel?: string;
    force?: boolean;
  },
  client?: AdminClient
): Promise<IntentCategory> {
  const category = classifyConversationIntent({
    messageText: input.messageText,
    hasReservation: input.hasReservation,
    channel: input.channel,
  });

  if (client) {
    const { data: row } = await client
      .from("conversations")
      .select("intent_manual_override")
      .eq("id", conversationId)
      .maybeSingle();

    if (row?.intent_manual_override && !input.force) {
      return category;
    }

    await client
      .from("conversations")
      .update({ intent_category: category })
      .eq("id", conversationId);

    return category;
  }

  const { supabase, user } = await requireAuth();
  const { data: row } = await supabase
    .from("conversations")
    .select("intent_manual_override, intent_category")
    .eq("id", conversationId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (row?.intent_manual_override && !input.force) {
    return (row.intent_category as IntentCategory) ?? category;
  }

  await supabase
    .from("conversations")
    .update({ intent_category: category })
    .eq("id", conversationId)
    .eq("owner_id", user.id);

  return category;
}
