import { getIntegrations, getConversationById } from "@/lib/db/queries";
import { sendMessage } from "@/lib/db/mutations";
import { insertMessageForOwner } from "@/lib/db/owner-mutations";
import { mapMessage } from "@/lib/db/mappers";
import {
  sendWhatsAppTextMessage,
  WhatsAppSendError,
  type WhatsAppSendResult,
} from "@/lib/integrations/whatsapp-cloud";
import type { WhatsAppIntegrationConfig } from "@/lib/integrations/config-types";
import { isWhatsAppConfigComplete } from "@/lib/integrations/config-types";
import { normalizeWhatsAppPhone } from "@/lib/integrations/whatsapp/phone";
import {
  appendOutboundDebug,
  logOutbound,
} from "@/lib/integrations/whatsapp/outbound-debug";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import type { Conversation } from "@/types";

export function isWhatsAppChannel(conversation: {
  platform: string;
}): boolean {
  return conversation.platform === "WhatsApp";
}

export function getWhatsAppIntegrationConfig(
  integrations: Awaited<ReturnType<typeof getIntegrations>>
): WhatsAppIntegrationConfig | null {
  const row = integrations.find((i) => i.provider === "whatsapp_business");
  if (!row) return null;
  const config = {
    ...(row.config as Record<string, unknown>),
    access_token: row.access_token_encrypted ?? undefined,
  } as WhatsAppIntegrationConfig;
  if (!row.access_token_encrypted?.trim()) {
    return null;
  }
  return config;
}

export { WhatsAppSendError };

export async function deliverWhatsAppMessage(input: {
  conversationId: string;
  text: string;
  senderType: "owner" | "ai";
  senderName?: string;
  aiGenerated?: boolean;
  aiAutoSent?: boolean;
}): Promise<{
  message: ReturnType<typeof mapMessage>;
  conversation: Conversation;
  meta: WhatsAppSendResult;
}> {
  const messageBody = input.text.trim();
  if (!messageBody) {
    throw new WhatsAppSendError("El mensaje está vacío.");
  }

  const conversation = await getConversationById(input.conversationId);
  if (!conversation) {
    throw new WhatsAppSendError("Conversación no encontrada.");
  }
  if (!isWhatsAppChannel(conversation)) {
    throw new WhatsAppSendError("Esta conversación no es de WhatsApp.");
  }

  const integrations = await getIntegrations();
  const row = integrations.find((i) => i.provider === "whatsapp_business");
  const config = getWhatsAppIntegrationConfig(integrations);

  if (!config || !isWhatsAppConfigComplete(config)) {
    throw new WhatsAppSendError(
      "Token de WhatsApp faltante o vencido. Volvé a conectar WhatsApp."
    );
  }

  const { supabase } = await requireAuth();
  const { data: guest, error: guestErr } = await supabase
    .from("guests")
    .select("phone")
    .eq("id", conversation.guestId)
    .maybeSingle();

  if (guestErr) {
    logOutbound("guest_lookup_failed", { message: guestErr.message });
  }

  const rawPhone = guest?.phone?.trim();
  if (!rawPhone) {
    throw new WhatsAppSendError(
      "El huésped no tiene teléfono asociado. No se puede enviar por WhatsApp."
    );
  }

  const normalizedPhone = normalizeWhatsAppPhone(rawPhone);
  const phoneNumberId = String(config.phone_number_id).trim();

  logOutbound("send_attempt", {
    conversationId: input.conversationId,
    phone_number_id: phoneNumberId,
    recipient_raw: rawPhone.replace(/\d(?=\d{4})/g, "*"),
    recipient_normalized: normalizedPhone.replace(/\d(?=\d{4})/g, "*"),
    message_length: messageBody.length,
    sender_type: input.senderType,
  });

  let meta: WhatsAppSendResult;
  const admin = createServiceRoleClient();

  try {
    meta = await sendWhatsAppTextMessage(config, normalizedPhone, messageBody);
    if (row?.id) {
      await appendOutboundDebug(admin, row.id, {
        recipient: normalizedPhone,
        phone_number_id: phoneNumberId,
        status: "success",
        message_length: messageBody.length,
      });
    }
    logOutbound("send_success", {
      phone_number_id: phoneNumberId,
      meta_message_id: meta.messageId,
      status: meta.httpStatus,
    });
  } catch (e) {
    const err =
      e instanceof WhatsAppSendError
        ? e
        : new WhatsAppSendError(e instanceof Error ? e.message : "Error al enviar por WhatsApp");

    if (row?.id) {
      await appendOutboundDebug(admin, row.id, {
        recipient: normalizedPhone,
        phone_number_id: phoneNumberId,
        status: "error",
        message_length: messageBody.length,
        meta_error: err.message,
        meta_code: err.metaCode,
      });
    }

    logOutbound("send_failed", {
      phone_number_id: phoneNumberId,
      error: err.message,
      meta_code: err.metaCode,
      meta_type: err.metaType,
      status_code: err.statusCode,
    });

    throw err;
  }

  const msgRow = await sendMessage({
    conversationId: input.conversationId,
    senderType: input.senderType,
    body: messageBody,
    senderName: input.senderName ?? (input.senderType === "ai" ? "InnIA" : "Anfitrión"),
    aiGenerated: input.aiGenerated ?? input.senderType === "ai",
    aiAutoSent: input.aiAutoSent ?? false,
    channel: "whatsapp",
    externalMessageId: meta.messageId,
  });

  const conv = await getConversationById(input.conversationId);
  if (!conv) {
    throw new WhatsAppSendError("Mensaje enviado a Meta pero no se pudo actualizar la conversación.");
  }

  return {
    message: mapMessage(msgRow),
    conversation: conv,
    meta,
  };
}

/** Service-role send for webhook auto-reply (no user session) */
export async function deliverWhatsAppForOwner(input: {
  admin: ReturnType<typeof createServiceRoleClient>;
  ownerId: string;
  conversationId: string;
  text: string;
  senderType: "owner" | "ai";
  senderName?: string;
  aiGenerated?: boolean;
  aiAutoSent?: boolean;
}): Promise<{ messageId: string; metaMessageId: string }> {
  const messageBody = input.text.trim();
  if (!messageBody) {
    throw new WhatsAppSendError("El mensaje está vacío.");
  }

  const { data: convRow } = await input.admin
    .from("conversations")
    .select("id, guest_id, channel")
    .eq("id", input.conversationId)
    .eq("owner_id", input.ownerId)
    .maybeSingle();

  if (!convRow) throw new WhatsAppSendError("Conversación no encontrada.");
  const channel = String(convRow.channel ?? "").toLowerCase();
  if (channel !== "whatsapp" && channel !== "whatsapp_business") {
    throw new WhatsAppSendError("Esta conversación no es de WhatsApp.");
  }

  const { data: integrationRow } = await input.admin
    .from("integrations")
    .select("*")
    .eq("owner_id", input.ownerId)
    .eq("provider", "whatsapp_business")
    .maybeSingle();

  const waConfig = integrationRow
    ? ({
        ...(integrationRow.config as Record<string, unknown>),
        access_token: integrationRow.access_token_encrypted ?? undefined,
      } as WhatsAppIntegrationConfig)
    : null;

  if (!waConfig || !isWhatsAppConfigComplete(waConfig)) {
    throw new WhatsAppSendError(
      "Token de WhatsApp faltante o vencido. Volvé a conectar WhatsApp."
    );
  }

  const integrationId = integrationRow?.id;

  const { data: guest } = await input.admin
    .from("guests")
    .select("phone")
    .eq("id", convRow.guest_id)
    .maybeSingle();

  const rawPhone = guest?.phone?.trim();
  if (!rawPhone) {
    throw new WhatsAppSendError("El huésped no tiene teléfono asociado.");
  }

  const normalizedPhone = normalizeWhatsAppPhone(rawPhone);
  const phoneNumberId = String(waConfig.phone_number_id).trim();

  logOutbound("send_attempt", {
    conversationId: input.conversationId,
    phone_number_id: phoneNumberId,
    owner_id: input.ownerId,
    message_length: messageBody.length,
    sender_type: input.senderType,
    source: "auto_process",
  });

  let meta: WhatsAppSendResult;
  try {
    meta = await sendWhatsAppTextMessage(waConfig, normalizedPhone, messageBody);
    if (integrationId) {
      await appendOutboundDebug(input.admin, integrationId, {
        recipient: normalizedPhone,
        phone_number_id: phoneNumberId,
        status: "success",
        message_length: messageBody.length,
      });
    }
  } catch (e) {
    const err =
      e instanceof WhatsAppSendError
        ? e
        : new WhatsAppSendError(e instanceof Error ? e.message : "Error al enviar por WhatsApp");
    if (integrationId) {
      await appendOutboundDebug(input.admin, integrationId, {
        recipient: normalizedPhone,
        phone_number_id: phoneNumberId,
        status: "error",
        message_length: messageBody.length,
        meta_error: err.message,
        meta_code: err.metaCode,
      });
    }
    throw err;
  }

  const msgRow = await insertMessageForOwner(input.admin, {
    conversationId: input.conversationId,
    senderType: input.senderType,
    body: messageBody,
    senderName: input.senderName ?? "InnIA",
    channel: "whatsapp",
    externalMessageId: meta.messageId,
    aiGenerated: input.aiGenerated ?? input.senderType === "ai",
    aiAutoSent: input.aiAutoSent ?? false,
  });

  await input.admin
    .from("conversations")
    .update({
      last_message_preview: messageBody.slice(0, 120),
      last_message_at: new Date().toISOString(),
      unread: false,
    })
    .eq("id", input.conversationId)
    .eq("owner_id", input.ownerId);

  return { messageId: msgRow.id, metaMessageId: meta.messageId };
}
