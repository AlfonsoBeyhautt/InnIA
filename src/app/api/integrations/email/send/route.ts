import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getIntegrations, getConversationById } from "@/lib/db/queries";
import { sendMessage } from "@/lib/db/mutations";
import { mapMessage } from "@/lib/db/mappers";
import { sendEmailMessage } from "@/lib/integrations/email-send";
import type { EmailIntegrationConfig } from "@/lib/integrations/config-types";
import { isEmailConfigComplete } from "@/lib/integrations/config-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const { conversationId, text, subject } = body;
    const messageBody = (text ?? "").trim();
    if (!conversationId || !messageBody) {
      return jsonError("conversationId y text son requeridos", 400);
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) return jsonError("Conversación no encontrada", 404);

    const integrations = await getIntegrations();
    const row = integrations.find((i) => i.provider === "email");
    const config = {
      ...(row?.config as Record<string, unknown>),
      api_key: row?.access_token_encrypted,
    } as EmailIntegrationConfig;

    if (!isEmailConfigComplete(config)) {
      return jsonError(
        "Email no está configurado. Completá las credenciales en Configuración.",
        503
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: guest } = await supabase
      .from("guests")
      .select("email, full_name")
      .eq("id", conversation.guestId)
      .maybeSingle();

    if (!guest?.email) {
      return jsonError("El huésped no tiene email asociado.", 400);
    }

    await sendEmailMessage(
      config,
      guest.email,
      subject ?? `Mensaje desde ${config.from_name ?? "InnIA"}`,
      messageBody
    );

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
