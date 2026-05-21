import {
  getAppBaseUrl,
  getMetaAppId,
  getMetaAppSecret,
  getMetaConfigId,
} from "@/lib/config/env";
import { META_OAUTH_SCOPES } from "@/lib/integrations/whatsapp/constants";
import { checkMetaEmbeddedSignupEnv } from "@/lib/integrations/whatsapp/meta-env";
import { createOAuthState } from "@/lib/integrations/whatsapp/oauth-state";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export type MetaOAuthStartResult =
  | { ok: true; url: string; state: string }
  | { ok: false; reason: "meta_not_configured"; missing: string[] };

export function getWhatsAppOAuthCallbackUrl(): string {
  return `${getAppBaseUrl()}/api/integrations/whatsapp/oauth/callback`;
}

export function buildMetaOAuthStartUrl(userId: string): MetaOAuthStartResult {
  const env = checkMetaEmbeddedSignupEnv();
  if (!env.configured) {
    return { ok: false, reason: "meta_not_configured", missing: env.missing };
  }

  const appId = getMetaAppId()!;
  const configId = getMetaConfigId()!;
  const redirectUri = getWhatsAppOAuthCallbackUrl();
  const state = createOAuthState(userId);

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: META_OAUTH_SCOPES,
    config_id: configId,
  });

  return {
    ok: true,
    url: `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`,
    state,
  };
}

export type MetaTokenExchangeResult =
  | {
      ok: true;
      accessToken: string;
      phoneNumberId?: string;
      businessAccountId?: string;
      displayPhoneNumber?: string;
    }
  | { ok: false; error: string; pending?: boolean };

/**
 * Exchanges OAuth code for tokens and resolves WhatsApp phone number metadata.
 * When Meta app is not fully provisioned, returns pending so the UI can continue setup.
 */
export async function exchangeMetaOAuthCode(
  code: string
): Promise<MetaTokenExchangeResult> {
  const appId = getMetaAppId();
  const appSecret = getMetaAppSecret();
  if (!appId || !appSecret) {
    return { ok: false, error: "Faltan credenciales de Meta en el servidor.", pending: true };
  }

  const redirectUri = getWhatsAppOAuthCallbackUrl();
  const tokenUrl = new URL(`${GRAPH_API}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    error?: { message: string };
  };

  if (!tokenRes.ok || !tokenJson.access_token) {
    return {
      ok: false,
      error: tokenJson.error?.message ?? "No se pudo obtener el token de Meta.",
      pending: true,
    };
  }

  const accessToken = tokenJson.access_token;

  try {
    const phonesRes = await fetch(
      `${GRAPH_API}/me/phone_numbers?fields=id,display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const phonesJson = (await phonesRes.json()) as {
      data?: { id: string; display_phone_number?: string }[];
      error?: { message: string };
    };

    const phone = phonesJson.data?.[0];
    if (phone?.id) {
      return {
        ok: true,
        accessToken,
        phoneNumberId: phone.id,
        displayPhoneNumber: phone.display_phone_number,
      };
    }
  } catch {
    /* Embedded Signup may return WABA details via a different path later */
  }

  return { ok: true, accessToken };
}
