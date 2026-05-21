import { NextRequest } from "next/server";
import { after } from "next/server";
import { jsonError } from "@/lib/api/response";
import { getWhatsAppVerifyToken } from "@/lib/config/env";
import { verifyWhatsAppWebhook } from "@/lib/integrations/whatsapp-cloud";
import { processWhatsAppWebhookPayload } from "@/lib/integrations/whatsapp/webhook-processor";
import {
  logWebhook,
  safePayloadSummary,
} from "@/lib/integrations/whatsapp/webhook-debug";
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
  let payload: unknown;
  try {
    payload = await req.json();
  } catch (e) {
    logWebhook("error", "invalid_json_body", {
      message: e instanceof Error ? e.message : String(e),
    });
    return new Response(JSON.stringify({ ok: true, error: "invalid_json" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  logWebhook("info", "webhook_post_start", safePayloadSummary(payload));

  const run = async () => {
    try {
      const result = await processWhatsAppWebhookPayload(
        payload as Parameters<typeof processWhatsAppWebhookPayload>[0]
      );
      return result;
    } catch (e) {
      logWebhook("error", "webhook_processor_crashed", {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.slice(0, 500) : undefined,
      });
      return { processed: 0, skipped: 0, errors: 1, summary: { crashed: true } };
    }
  };

  if (typeof after === "function") {
    after(async () => {
      await run();
    });
    return new Response(JSON.stringify({ ok: true, accepted: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await run();
  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
