import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getIntegrations } from "@/lib/db/queries";
import { upsertIntegrationConfig } from "@/lib/db/mutations";
import { testWhatsAppConnection } from "@/lib/integrations/whatsapp-cloud";
import type { WhatsAppIntegrationConfig } from "@/lib/integrations/config-types";
import { isWhatsAppConfigComplete } from "@/lib/integrations/config-types";

export async function POST() {
  return withAuthApiHandler(async () => {
    const integrations = await getIntegrations();
    const row = integrations.find((i) => i.provider === "whatsapp_business");
    const config = {
      ...(row?.config as Record<string, unknown>),
      access_token: row?.access_token_encrypted,
    } as WhatsAppIntegrationConfig;

    if (!isWhatsAppConfigComplete(config)) {
      return jsonError(
        "WhatsApp no está configurado. Usá «Continuar con Meta» o la configuración avanzada.",
        503
      );
    }

    const result = await testWhatsAppConnection(config);

    if (!result.ok) {
      await upsertIntegrationConfig("whatsapp_business", {
        sync_status: "error",
        error_message: result.error,
      });
      return jsonError(result.error, 502);
    }

    const existingConfig = (row?.config as Record<string, unknown>) ?? {};
    await upsertIntegrationConfig("whatsapp_business", {
      status: "connected",
      sync_status: "ready",
      error_message: null,
      config: {
        ...existingConfig,
        display_phone_number: result.displayPhoneNumber ?? existingConfig.display_phone_number,
        connected_phone: result.displayPhoneNumber ?? existingConfig.connected_phone,
      },
    });

    return jsonOk({
      ok: true,
      displayPhoneNumber: result.displayPhoneNumber,
      verifiedName: result.verifiedName,
    });
  });
}
