import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { buildMetaOAuthStartUrl } from "@/lib/integrations/whatsapp/oauth";
import { upsertIntegrationConfig } from "@/lib/db/mutations";

export async function GET() {
  return withAuthApiHandler(async () => {
    const { user } = await requireAuth();
    const result = buildMetaOAuthStartUrl(user.id);

    if (!result.ok) {
      return jsonOk({
        redirect: false,
        reason: result.reason,
        missing: result.missing,
      });
    }

    await upsertIntegrationConfig("whatsapp_business", {
      status: "pending",
      sync_status: "pending_oauth",
      error_message: null,
      config: { connection_method: "meta" },
    });

    return jsonOk({
      redirect: true,
      url: result.url,
    });
  });
}
