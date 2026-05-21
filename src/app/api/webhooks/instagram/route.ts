import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/response";

/** Instagram Messaging webhook — prepared for Meta integration */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const expected = process.env.INSTAGRAM_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  console.info("[instagram:webhook]", {
    event: "received",
    object: (payload as { object?: string }).object,
  });
  return jsonOk({ received: true });
}
