import { mapConversation, mapGuest, mapKnowledgeItem, mapMessage, mapProperty, mapUnit } from "@/lib/db/mappers";
import type { createServiceRoleClient } from "@/lib/supabase/server";
import type { Conversation, Guest, KnowledgeBaseItem, Message, Property, Unit } from "@/types";
import type { Tables } from "@/lib/supabase/types";
import type { ConversationGuestContext } from "@/lib/ai/conversation-entities";

type Admin = ReturnType<typeof createServiceRoleClient>;

export async function loadConversationForOwner(
  admin: Admin,
  ownerId: string,
  conversationId: string
): Promise<{
  conversation: Conversation;
  guestContext: ConversationGuestContext;
  property: Property | null;
  guest: Guest | null;
  knowledge: KnowledgeBaseItem[];
  messages: Message[];
  reservation: Tables<"reservations"> | null;
  unit: Unit | null;
} | null> {
  const { data: row, error } = await admin
    .from("conversations")
    .select("*, guest:guests(*), property:properties(*)")
    .eq("id", conversationId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !row) return null;

  type ConvRow = Tables<"conversations"> & {
    guest?: Tables<"guests"> | null;
    property?: Tables<"properties"> | null;
    guest_context?: ConversationGuestContext;
  };
  const convRow = row as ConvRow;

  const { data: msgRows } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages = (msgRows ?? []).map(mapMessage);
  const conv = mapConversation(convRow, messages);
  const guestContext = convRow.guest_context ?? {};
  const property = convRow.property ? mapProperty(convRow.property) : null;
  const guest = convRow.guest ? mapGuest(convRow.guest) : null;

  let knowledge: KnowledgeBaseItem[] = [];
  if (property?.dbId) {
    const { data: kb } = await admin
      .from("knowledge_base_items")
      .select("*")
      .eq("property_id", property.dbId);
    knowledge = (kb ?? []).map(mapKnowledgeItem);
  }

  let reservation: Tables<"reservations"> | null = null;
  let unit: Unit | null = null;
  if (convRow.reservation_id) {
    const { data: res } = await admin
      .from("reservations")
      .select("*")
      .eq("id", convRow.reservation_id)
      .maybeSingle();
    reservation = res;
    if (res?.unit_id) {
      const { data: unitRow } = await admin
        .from("units")
        .select("*")
        .eq("id", res.unit_id)
        .maybeSingle();
      if (unitRow) unit = mapUnit(unitRow);
    }
  }

  return {
    conversation: conv,
    guestContext,
    property,
    guest,
    knowledge,
    messages,
    reservation,
    unit,
  };
}

export async function getIntegrationsForOwner(admin: Admin, ownerId: string) {
  const { data } = await admin
    .from("integrations")
    .select("*")
    .eq("owner_id", ownerId);
  return data ?? [];
}
