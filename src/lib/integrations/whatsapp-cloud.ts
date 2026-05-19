import type { WhatsAppIntegrationConfig } from "@/lib/integrations/config-types";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export async function sendWhatsAppTextMessage(
  config: WhatsAppIntegrationConfig,
  toPhone: string,
  body: string
): Promise<{ messageId: string }> {
  const phone = toPhone.replace(/\D/g, "");
  const res = await fetch(`${GRAPH_API}/${config.phone_number_id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body },
    }),
  });

  const json = (await res.json()) as {
    messages?: { id: string }[];
    error?: { message: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message ?? `WhatsApp API error ${res.status}`);
  }

  const messageId = json.messages?.[0]?.id;
  if (!messageId) throw new Error("WhatsApp no devolvió ID de mensaje");
  return { messageId };
}

export function verifyWhatsAppWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  expectedVerifyToken: string
): string | null {
  if (mode === "subscribe" && token === expectedVerifyToken && challenge) {
    return challenge;
  }
  return null;
}
