import type { WhatsAppIntegrationConfig } from "@/lib/integrations/config-types";
import { normalizeWhatsAppPhone } from "@/lib/integrations/whatsapp/phone";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export type WhatsAppSendResult = {
  messageId: string;
  httpStatus: number;
};

export class WhatsAppSendError extends Error {
  metaCode?: number | string;
  metaType?: string;
  statusCode?: number;

  constructor(
    message: string,
    meta?: { code?: number | string; type?: string; statusCode?: number }
  ) {
    super(message);
    this.name = "WhatsAppSendError";
    this.metaCode = meta?.code;
    this.metaType = meta?.type;
    this.statusCode = meta?.statusCode;
  }
}

export async function sendWhatsAppTextMessage(
  config: WhatsAppIntegrationConfig,
  toPhone: string,
  body: string
): Promise<WhatsAppSendResult> {
  const phoneNumberId = String(config.phone_number_id ?? "").trim();
  const token = config.access_token?.trim();

  if (!phoneNumberId) {
    throw new WhatsAppSendError("Phone Number ID no configurado en la integración.");
  }
  if (!token) {
    throw new WhatsAppSendError(
      "Token de WhatsApp faltante o vencido. Volvé a conectar WhatsApp."
    );
  }

  const to = normalizeWhatsAppPhone(toPhone);
  if (!to || to.length < 8) {
    throw new WhatsAppSendError(`Número de destinatario inválido: ${toPhone}`);
  }

  const url = `${GRAPH_API}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  const json = (await res.json()) as {
    messages?: { id: string }[];
    error?: {
      message: string;
      type?: string;
      code?: number;
      error_subcode?: number;
    };
  };

  if (!res.ok) {
    const errMsg =
      json.error?.message ?? `WhatsApp API error ${res.status}`;
    throw new WhatsAppSendError(errMsg, {
      code: json.error?.code ?? json.error?.error_subcode,
      type: json.error?.type,
      statusCode: res.status,
    });
  }

  const messageId = json.messages?.[0]?.id;
  if (!messageId) {
    throw new WhatsAppSendError("WhatsApp no devolvió ID de mensaje", {
      statusCode: res.status,
    });
  }

  return { messageId, httpStatus: res.status };
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

export async function testWhatsAppConnection(
  config: WhatsAppIntegrationConfig
): Promise<
  | { ok: true; displayPhoneNumber?: string; verifiedName?: string }
  | { ok: false; error: string }
> {
  if (!config.phone_number_id?.trim() || !config.access_token?.trim()) {
    return {
      ok: false,
      error:
        "Faltan credenciales. Conectá con Meta o completá la configuración avanzada.",
    };
  }

  const res = await fetch(
    `${GRAPH_API}/${config.phone_number_id}?fields=display_phone_number,verified_name,quality_rating`,
    { headers: { Authorization: `Bearer ${config.access_token}` } }
  );

  const json = (await res.json()) as {
    display_phone_number?: string;
    verified_name?: string;
    error?: { message: string };
  };

  if (!res.ok) {
    return { ok: false, error: json.error?.message ?? `Error ${res.status} al contactar Meta` };
  }

  return {
    ok: true,
    displayPhoneNumber: json.display_phone_number,
    verifiedName: json.verified_name,
  };
}
