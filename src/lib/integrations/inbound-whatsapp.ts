import { createServiceRoleClient } from "@/lib/supabase/server";
import type { WhatsAppIntegrationConfig } from "@/lib/integrations/config-types";

type WebhookEntry = {
  id: string;
  changes?: {
    value?: {
      metadata?: { phone_number_id?: string; display_phone_number?: string };
      contacts?: { profile?: { name?: string }; wa_id?: string }[];
      messages?: {
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: { body?: string };
      }[];
    };
    field?: string;
  }[];
};

export async function processWhatsAppWebhookPayload(payload: {
  object?: string;
  entry?: WebhookEntry[];
}): Promise<{ processed: number }> {
  if (payload.object !== "whatsapp_business_account") {
    return { processed: 0 };
  }

  const admin = createServiceRoleClient();
  let processed = 0;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const { data: integrations } = await admin
        .from("integrations")
        .select("id, owner_id, config, access_token_encrypted")
        .eq("provider", "whatsapp_business")
        .in("status", ["connected", "pending"]);

      const integration = (integrations ?? []).find(
        (row) =>
          (row.config as Record<string, unknown> | null)?.phone_number_id ===
          phoneNumberId
      );
      if (!integration) continue;

      const config = {
        ...(integration.config as Record<string, unknown>),
        access_token:
          integration.access_token_encrypted ??
          (integration.config as WhatsAppIntegrationConfig)?.access_token,
      } as WhatsAppIntegrationConfig;

      const propertyId =
        config.default_property_id ??
        (await getDefaultPropertyId(admin, integration.owner_id));
      if (!propertyId) continue;

      for (const msg of value?.messages ?? []) {
        if (msg.type !== "text" || !msg.text?.body) continue;

        const contact = value.contacts?.find((c) => c.wa_id === msg.from);
        const guestName =
          contact?.profile?.name ?? `Huésped ${msg.from.slice(-4)}`;

        const guestId = await findOrCreateGuest(admin, {
          ownerId: integration.owner_id,
          phone: msg.from,
          name: guestName,
        });

        const conversationId = await findOrCreateConversation(admin, {
          ownerId: integration.owner_id,
          guestId,
          propertyId,
          guestPhone: msg.from,
        });

        const { data: existing } = await admin
          .from("messages")
          .select("id")
          .eq("external_message_id", msg.id)
          .maybeSingle();

        if (existing) continue;

        await admin.from("messages").insert({
          conversation_id: conversationId,
          sender_type: "guest",
          sender_name: guestName,
          body: msg.text.body,
          channel: "whatsapp_business",
          external_message_id: msg.id,
          ai_generated: false,
          ai_auto_sent: false,
        });

        await admin
          .from("conversations")
          .update({
            last_message_preview: msg.text.body.slice(0, 120),
            last_message_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
            unread: true,
          })
          .eq("id", conversationId);

        processed += 1;
      }
    }
  }

  return { processed };
}

async function getDefaultPropertyId(
  admin: ReturnType<typeof createServiceRoleClient>,
  ownerId: string
): Promise<string | null> {
  const { data } = await admin
    .from("properties")
    .select("id")
    .eq("owner_id", ownerId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function findOrCreateGuest(
  admin: ReturnType<typeof createServiceRoleClient>,
  input: { ownerId: string; phone: string; name: string }
): Promise<string> {
  const normalized = input.phone.replace(/\D/g, "");
  const { data: existing } = await admin
    .from("guests")
    .select("id")
    .eq("owner_id", input.ownerId)
    .or(`phone.eq.${input.phone},phone.eq.+${normalized}`)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("guests")
    .insert({
      owner_id: input.ownerId,
      full_name: input.name,
      phone: input.phone,
      origin_platform: "whatsapp",
      validation_status: "pendiente",
    })
    .select("id")
    .single();

  if (error || !created) throw error ?? new Error("No se pudo crear huésped");
  return created.id;
}

async function findOrCreateConversation(
  admin: ReturnType<typeof createServiceRoleClient>,
  input: {
    ownerId: string;
    guestId: string;
    propertyId: string;
    guestPhone: string;
  }
): Promise<string> {
  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("owner_id", input.ownerId)
    .eq("guest_id", input.guestId)
    .eq("property_id", input.propertyId)
    .eq("channel", "whatsapp_business")
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("conversations")
    .insert({
      owner_id: input.ownerId,
      guest_id: input.guestId,
      property_id: input.propertyId,
      channel: "whatsapp_business",
      status: "abierta",
      priority: "normal",
      unread: true,
    })
    .select("id")
    .single();

  if (error || !created) throw error ?? new Error("No se pudo crear conversación");
  return created.id;
}

