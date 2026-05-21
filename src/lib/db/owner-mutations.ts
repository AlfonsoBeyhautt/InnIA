import type { createServiceRoleClient } from "@/lib/supabase/server";
import type { AiDecision, Database, Json } from "@/lib/supabase/types";

type ConversationUpdate = Database["public"]["Tables"]["conversations"]["Update"];
import type { ConversationGuestContext } from "@/lib/ai/conversation-entities";

type Admin = ReturnType<typeof createServiceRoleClient>;

export async function updateConversationForOwner(
  admin: Admin,
  ownerId: string,
  conversationId: string,
  patch: ConversationUpdate
) {
  const { error } = await admin
    .from("conversations")
    .update(patch)
    .eq("id", conversationId)
    .eq("owner_id", ownerId);
  if (error) throw error;
}

export async function updateGuestContextForOwner(
  admin: Admin,
  ownerId: string,
  conversationId: string,
  guestContext: ConversationGuestContext
) {
  await updateConversationForOwner(admin, ownerId, conversationId, {
    guest_context: guestContext as unknown as Json,
  });
}

export async function insertMessageForOwner(
  admin: Admin,
  input: {
    conversationId: string;
    senderType: string;
    body: string;
    senderName?: string;
    channel?: string;
    externalMessageId?: string;
    aiGenerated?: boolean;
    aiAutoSent?: boolean;
  }
) {
  const { data, error } = await admin
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_type: input.senderType,
      sender_name: input.senderName ?? null,
      body: input.body,
      channel: input.channel ?? null,
      external_message_id: input.externalMessageId ?? null,
      ai_generated: input.aiGenerated ?? false,
      ai_auto_sent: input.aiAutoSent ?? false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function createAiLogForOwner(
  admin: Admin,
  ownerId: string,
  input: {
    conversationId: string;
    messageId?: string;
    generatedResponse: string;
    usedKnowledge: string[];
    missingInformation: string[];
    aiDecision: AiDecision;
    autoSent: boolean;
  }
) {
  const { data: conv } = await admin
    .from("conversations")
    .select("id")
    .eq("id", input.conversationId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!conv) throw new Error("Conversación no encontrada");

  const { data, error } = await admin
    .from("ai_response_logs")
    .insert({
      conversation_id: input.conversationId,
      message_id: input.messageId ?? null,
      generated_response: input.generatedResponse,
      used_knowledge: input.usedKnowledge,
      missing_information: input.missingInformation,
      ai_decision: input.aiDecision,
      auto_sent: input.autoSent,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function createNotificationForOwner(
  admin: Admin,
  ownerId: string,
  input: {
    type: string;
    title: string;
    body: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }
) {
  await admin.from("notifications").insert({
    owner_id: ownerId,
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
  });
}
