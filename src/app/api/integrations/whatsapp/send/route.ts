import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getIntegrations, getConversationById } from "@/lib/db/queries";
import { sendMessage } from "@/lib/db/mutations";
import { mapMessage } from "@/lib/db/mappers";
import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp-cloud";
import type { WhatsAppIntegrationConfig } from "@/lib/integrations/config-types";
import { isWhatsAppConfigComplete } from "@/lib/integrations/config-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const { conversationId, text, body: altBody } = body;
    const messageBody = (text ?? altBody ?? "").trim();
    if (!conversationId || !messageBody) {
      return jsonError("conversationId y text son requeridos", 400);
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) return jsonError("Conversación no encontrada", 404);

    const integrations = await getIntegrations();
    const row = integrations.find((i) => i.provider === "whatsapp_business");
    const config = {
      ...(row?.config as Record<string, unknown>),
      access_token: row?.access_token_encrypted,
    } as WhatsAppIntegrationConfig;

    if (!isWhatsAppConfigComplete(config)) {
      return jsonError(
        "WhatsApp Business no está configurado. Completá las credenciales en Configuración.",
        503
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: guest } = await supabase
      .from("guests")
      .select("phone")
      .eq("id", conversation.guestId)
      .maybeSingle();

    const guestPhone = guest?.phone;
    if (!guestPhone) {
      return jsonError("El huésped no tiene teléfono asociado para WhatsApp.", 400);
    }

    await sendWhatsAppTextMessage(config, guestPhone, messageBody);

    const msg = await sendMessage({
      conversationId,
      senderType: "owner",
      body: messageBody,
      senderName: "Anfitrión",
    });

    const conv = await getConversationById(conversationId);
    return jsonOk({ message: mapMessage(msg), conversation: conv });
  });
}
