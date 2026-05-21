import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { checkMetaEmbeddedSignupEnv } from "@/lib/integrations/whatsapp/meta-env";
import { WHATSAPP_WEBHOOK_PUBLIC_URL } from "@/lib/integrations/whatsapp/constants";

export async function GET() {
  return withAuthApiHandler(async () => {
    const meta = checkMetaEmbeddedSignupEnv();
    return jsonOk({
      metaConfigured: meta.configured,
      missing: meta.missing,
      webhookUrl: WHATSAPP_WEBHOOK_PUBLIC_URL,
    });
  });
}
