import { NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/config/env";
import { verifyOAuthState } from "@/lib/integrations/whatsapp/oauth-state";
import { exchangeMetaOAuthCode } from "@/lib/integrations/whatsapp/oauth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

function settingsRedirect(params: Record<string, string>) {
  const base = `${getAppBaseUrl()}/app/configuracion`;
  const q = new URLSearchParams({ section: "integraciones", ...params });
  return new Response(null, {
    status: 302,
    headers: { Location: `${base}?${q.toString()}` },
  });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const error = params.get("error");
  const errorDescription = params.get("error_description");
  const code = params.get("code");
  const state = params.get("state");

  if (error) {
    return settingsRedirect({
      whatsapp: "error",
      whatsapp_error: errorDescription ?? error,
    });
  }

  if (!code || !state) {
    return settingsRedirect({ whatsapp: "error", whatsapp_error: "Respuesta incompleta de Meta" });
  }

  const userId = verifyOAuthState(state);
  if (!userId) {
    return settingsRedirect({ whatsapp: "error", whatsapp_error: "Sesión OAuth inválida o expirada" });
  }

  const exchange = await exchangeMetaOAuthCode(code);
  const admin = createServiceRoleClient();

  if (!exchange.ok) {
    await admin.from("integrations").upsert(
      {
        owner_id: userId,
        provider: "whatsapp_business",
        status: "pending",
        sync_status: exchange.pending ? "meta_pending" : "error",
        error_message: exchange.error,
        config: { connection_method: "meta" },
      },
      { onConflict: "owner_id,provider" }
    );
    return settingsRedirect({
      whatsapp: exchange.pending ? "pending" : "error",
      whatsapp_error: exchange.error,
    });
  }

  const config: Record<string, unknown> = {
    connection_method: "meta",
    phone_number_id: exchange.phoneNumberId ?? "",
    business_account_id: exchange.businessAccountId ?? undefined,
    display_phone_number: exchange.displayPhoneNumber,
    connected_phone: exchange.displayPhoneNumber,
  };

  const complete = Boolean(exchange.phoneNumberId && exchange.accessToken);

  await admin.from("integrations").upsert(
    {
      owner_id: userId,
      provider: "whatsapp_business",
      status: complete ? "connected" : "pending",
      sync_status: complete ? "ready" : "meta_pending",
      error_message: null,
      access_token_encrypted: exchange.accessToken,
      config: config as Json,
      last_sync_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,provider" }
  );

  return settingsRedirect({ whatsapp: complete ? "connected" : "pending" });
}
