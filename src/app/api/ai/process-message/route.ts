import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { processMessageWithAi } from "@/lib/ai/process-message";
import { getOpenAiApiKey, isSupabaseConfigured } from "@/lib/config/env";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return jsonError("Supabase no configurado", 503);
  }
  if (!getOpenAiApiKey()) {
    return jsonError(
      "OPENAI_API_KEY no configurada en el servidor. Agregala en .env.local y reiniciá el servidor.",
      503
    );
  }

  return withAuthApiHandler(async () => {
    const body = await req.json();
    const { conversationId, messageId } = body;
    if (!conversationId || !messageId) {
      return jsonError("conversationId y messageId son requeridos", 400);
    }

    try {
      const result = await processMessageWithAi({ conversationId, messageId });
      return jsonOk(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al procesar con IA";
      const status = message.includes("OPENAI") ? 503 : 500;
      return jsonError(message, status);
    }
  });
}
