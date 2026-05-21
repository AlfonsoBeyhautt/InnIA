import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import {
  deliverWhatsAppMessage,
  WhatsAppSendError,
} from "@/lib/integrations/whatsapp/send-outbound";

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const {
      conversationId,
      text,
      body: altBody,
      senderType,
      senderName,
      aiGenerated,
      aiAutoSent,
    } = body;
    const messageBody = (text ?? altBody ?? "").trim();
    if (!conversationId || !messageBody) {
      return jsonError("conversationId y text son requeridos", 400);
    }

    const isAi = senderType === "ai";
    try {
      const result = await deliverWhatsAppMessage({
        conversationId,
        text: messageBody,
        senderType: isAi ? "ai" : "owner",
        senderName: senderName ?? (isAi ? "InnIA" : "Anfitrión"),
        aiGenerated: aiGenerated ?? isAi,
        aiAutoSent: aiAutoSent ?? false,
      });
      return jsonOk({
        message: result.message,
        conversation: result.conversation,
        metaMessageId: result.meta.messageId,
      });
    } catch (e) {
      const msg =
        e instanceof WhatsAppSendError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo enviar por WhatsApp";
      const status =
        e instanceof WhatsAppSendError && e.statusCode === 401 ? 401 : 502;
      return jsonError(msg, status);
    }
  });
}
