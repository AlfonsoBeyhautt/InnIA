import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import {
  appendWebhookDebug,
  logWebhook,
  safePayloadSummary,
} from "@/lib/integrations/whatsapp/webhook-debug";
import { resolveWhatsAppIntegration } from "@/lib/integrations/whatsapp/resolve-integration";
import { applyIntentToConversation } from "@/lib/conversations/apply-intent";

/** DB channel value — mapped to platform "WhatsApp" in UI */
export const WHATSAPP_CHANNEL = "whatsapp";

const WHATSAPP_CHANNEL_LEGACY = "whatsapp_business";

type WebhookMessage = {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body?: string };
};

type WebhookChangeValue = {
  messaging_product?: string;
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: WebhookMessage[];
  statuses?: unknown[];
};

type WebhookPayload = {
  object?: string;
  entry?: {
    id?: string;
    changes?: { field?: string; value?: WebhookChangeValue }[];
  }[];
};

export type WebhookProcessResult = {
  processed: number;
  skipped: number;
  errors: number;
  summary: Record<string, unknown>;
};

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function messageBody(msg: WebhookMessage): string | null {
  if (msg.type === "text" && msg.text?.body) return msg.text.body;
  const button = (msg as { button?: { text?: string } }).button;
  if (msg.type === "button" && button?.text) return button.text;
  return null;
}

async function getDefaultPropertyId(
  admin: ReturnType<typeof createServiceRoleClient>,
  ownerId: string
): Promise<string | null> {
  const { data, error } = await admin
    .from("properties")
    .select("id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    logWebhook("error", "property_lookup_failed", { ownerId, message: error.message });
    return null;
  }
  return data?.id ?? null;
}

async function findOrCreateGuest(
  admin: ReturnType<typeof createServiceRoleClient>,
  input: { ownerId: string; phone: string; name: string }
): Promise<string> {
  const digits = normalizePhoneDigits(input.phone);
  const { data: guests, error: listErr } = await admin
    .from("guests")
    .select("id, phone")
    .eq("owner_id", input.ownerId);

  if (listErr) throw listErr;

  const existing = (guests ?? []).find(
    (g) => g.phone && normalizePhoneDigits(g.phone) === digits
  );
  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("guests")
    .insert({
      owner_id: input.ownerId,
      full_name: input.name,
      phone: input.phone.startsWith("+") ? input.phone : `+${digits}`,
      origin_platform: "whatsapp",
      validation_status: "pendiente",
    })
    .select("id")
    .single();

  if (error) {
    logWebhook("error", "guest_insert_failed", { message: error.message, code: error.code });
    throw error;
  }
  if (!created) throw new Error("No se pudo crear huésped");
  return created.id;
}

async function findOrCreateConversation(
  admin: ReturnType<typeof createServiceRoleClient>,
  input: {
    ownerId: string;
    guestId: string;
    propertyId: string;
    waId: string;
  }
): Promise<string> {
  const channels = [WHATSAPP_CHANNEL, WHATSAPP_CHANNEL_LEGACY];

  for (const channel of channels) {
    const { data: existing } = await admin
      .from("conversations")
      .select("id")
      .eq("owner_id", input.ownerId)
      .eq("guest_id", input.guestId)
      .eq("property_id", input.propertyId)
      .eq("channel", channel)
      .maybeSingle();

    if (existing?.id) return existing.id;
  }

  const { data: created, error } = await admin
    .from("conversations")
    .insert({
      owner_id: input.ownerId,
      guest_id: input.guestId,
      property_id: input.propertyId,
      channel: WHATSAPP_CHANNEL,
      status: "abierta",
      priority: "normal",
      unread: true,
      labels: [`wa:${input.waId}`],
    })
    .select("id")
    .single();

  if (error) {
    logWebhook("error", "conversation_insert_failed", {
      message: error.message,
      code: error.code,
    });
    throw error;
  }
  if (!created) throw new Error("No se pudo crear conversación");
  return created.id;
}

async function processInboundMessage(
  admin: ReturnType<typeof createServiceRoleClient>,
  integration: { id: string; owner_id: string },
  value: WebhookChangeValue,
  msg: WebhookMessage
): Promise<"processed" | "skipped" | "error"> {
  const body = messageBody(msg);
  if (!body) {
    logWebhook("info", "message_skipped_non_text", { type: msg.type, id: msg.id });
    return "skipped";
  }

  const contact = value.contacts?.find((c) => c.wa_id === msg.from);
  const guestName = contact?.profile?.name ?? `Huésped ${msg.from.slice(-4)}`;

  const propertyId = await getDefaultPropertyId(admin, integration.owner_id);
  if (!propertyId) {
    logWebhook("warn", "no_property_for_owner", { ownerId: integration.owner_id });
    await appendWebhookDebug(admin, integration.id, {
      level: "warn",
      event: "no_property",
      detail: { ownerId: integration.owner_id, from: msg.from },
    });
    return "skipped";
  }

  try {
    const guestId = await findOrCreateGuest(admin, {
      ownerId: integration.owner_id,
      phone: msg.from,
      name: guestName,
    });

    const conversationId = await findOrCreateConversation(admin, {
      ownerId: integration.owner_id,
      guestId,
      propertyId,
      waId: msg.from,
    });

    const { data: existing } = await admin
      .from("messages")
      .select("id")
      .eq("external_message_id", msg.id)
      .maybeSingle();

    if (existing) {
      logWebhook("info", "message_duplicate", { messageId: msg.id });
      return "skipped";
    }

    const createdAt = msg.timestamp
      ? new Date(Number(msg.timestamp) * 1000).toISOString()
      : new Date().toISOString();

    const { error: msgErr } = await admin.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "guest",
      sender_name: guestName,
      body,
      channel: WHATSAPP_CHANNEL,
      external_message_id: msg.id,
      ai_generated: false,
      ai_auto_sent: false,
    });

    if (msgErr) {
      logWebhook("error", "message_insert_failed", {
        message: msgErr.message,
        code: msgErr.code,
      });
      return "error";
    }

    const { error: convErr } = await admin
      .from("conversations")
      .update({
        last_message_preview: body.slice(0, 120),
        last_message_at: createdAt,
        unread: true,
      })
      .eq("id", conversationId);

    if (convErr) {
      logWebhook("error", "conversation_update_failed", { message: convErr.message });
    }

    const { error: notifErr } = await admin.from("notifications").insert({
      owner_id: integration.owner_id,
      type: "mensaje",
      title: "Nuevo mensaje de WhatsApp",
      body: body.slice(0, 200),
      read: false,
      related_entity_type: "conversation",
      related_entity_id: conversationId,
    });

    if (notifErr) {
      logWebhook("warn", "notification_insert_failed", { message: notifErr.message });
    }

    const { data: convMeta } = await admin
      .from("conversations")
      .select("reservation_id")
      .eq("id", conversationId)
      .maybeSingle();

    const { data: profile } = await admin
      .from("profiles")
      .select("ai_settings")
      .eq("id", integration.owner_id)
      .maybeSingle();
    const aiSettings = (profile?.ai_settings as { ai_auto_classification?: boolean }) ?? {};
    if (aiSettings.ai_auto_classification !== false) {
      await applyIntentToConversation(
        conversationId,
        {
          messageText: body,
          hasReservation: Boolean(convMeta?.reservation_id),
          channel: WHATSAPP_CHANNEL,
        },
        admin
      );
    }

    logWebhook("info", "message_saved", {
      conversationId,
      messageId: msg.id,
      from: msg.from,
    });

    return "processed";
  } catch (e) {
    logWebhook("error", "message_handler_exception", {
      message: e instanceof Error ? e.message : String(e),
      from: msg.from,
    });
    return "error";
  }
}

export async function processWhatsAppWebhookPayload(
  payload: WebhookPayload
): Promise<WebhookProcessResult> {
  const summary = safePayloadSummary(payload);
  logWebhook("info", "webhook_post_received", summary);

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let lastIntegrationId: string | null = null;

  if (payload.object !== "whatsapp_business_account") {
    logWebhook("warn", "ignored_object_type", { object: payload.object });
    return { processed, skipped, errors, summary: { ...summary, ignored: true } };
  }

  const admin = createServiceRoleClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") {
        logWebhook("info", "change_skipped_field", { field: change.field });
        continue;
      }

      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;

      if (value?.statuses?.length && !value?.messages?.length) {
        logWebhook("info", "statuses_only_ignored", {
          count: value.statuses.length,
          phoneNumberId,
        });
        skipped += value.statuses.length;
        continue;
      }

      if (!phoneNumberId) {
        logWebhook("warn", "missing_metadata_phone_number_id", {
          messaging_product: value?.messaging_product,
        });
        continue;
      }

      const integration = await resolveWhatsAppIntegration(admin, phoneNumberId);
      if (!integration) {
        logWebhook("warn", "owner_not_resolved", { phoneNumberId });
        continue;
      }

      lastIntegrationId = integration.id;

      const cfg = (integration.config ?? {}) as Record<string, unknown>;
      if (String(cfg.phone_number_id ?? "").trim() !== String(phoneNumberId).trim()) {
        const syncedConfig = {
          ...cfg,
          phone_number_id: phoneNumberId,
          display_phone_number:
            value.metadata?.display_phone_number ?? cfg.display_phone_number,
        };
        await admin
          .from("integrations")
          .update({ config: syncedConfig as Json })
          .eq("id", integration.id);
        logWebhook("info", "phone_number_id_synced_from_webhook", { phoneNumberId });
      }
      await appendWebhookDebug(admin, integration.id, {
        level: "info",
        event: "webhook_received",
        detail: summary,
      });

      const messages = value.messages ?? [];
      if (messages.length === 0) {
        logWebhook("info", "no_messages_in_change", { phoneNumberId });
        continue;
      }

      for (const msg of messages) {
        const result = await processInboundMessage(admin, integration, value, msg);
        if (result === "processed") processed += 1;
        else if (result === "error") errors += 1;
        else skipped += 1;
      }
    }
  }

  const result = { processed, skipped, errors, summary };
  logWebhook("info", "webhook_post_complete", result);

  if (lastIntegrationId) {
    await appendWebhookDebug(admin, lastIntegrationId, {
      level: errors > 0 ? "warn" : "info",
      event: "webhook_complete",
      detail: result,
    });
  }

  return result;
}
