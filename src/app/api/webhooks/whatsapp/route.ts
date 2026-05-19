import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/response";
import { getWhatsAppVerifyToken } from "@/lib/config/env";
import { verifyWhatsAppWebhook } from "@/lib/integrations/whatsapp-cloud";
import { processWhatsAppWebhookPayload } from "@/lib/integrations/inbound-whatsapp";
import { getWhatsAppVerifyTokensFromDb } from "@/lib/db/integrations-webhook";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = [getWhatsAppVerifyToken(), ...(await getWhatsAppVerifyTokensFromDb())].filter(
    Boolean
  ) as string[];

  for (const verifyToken of expected) {
    const result = verifyWhatsAppWebhook(mode, token, challenge, verifyToken);
    if (result) return new Response(result, { status: 200 });
  }

  return jsonError("Verificación fallida", 403);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { processed } = await processWhatsAppWebhookPayload(payload);
    return new Response(JSON.stringify({ ok: true, processed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[whatsapp webhook]", e);
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
}
