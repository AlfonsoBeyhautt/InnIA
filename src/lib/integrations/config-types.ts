import type { IntegrationProvider } from "@/lib/supabase/types";

export type WhatsAppIntegrationConfig = {
  phone_number_id: string;
  business_account_id?: string;
  access_token: string;
  verify_token?: string;
  default_property_id?: string;
  guest_phone?: string;
};

export type EmailIntegrationConfig = {
  provider: "resend" | "smtp";
  from_email: string;
  from_name?: string;
  api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
};

export type ICalIntegrationConfig = {
  ical_url: string;
  property_id?: string;
  last_import_count?: number;
};

export type IntegrationConfigMap = {
  whatsapp_business: WhatsAppIntegrationConfig;
  email: EmailIntegrationConfig;
  airbnb: ICalIntegrationConfig;
  booking: ICalIntegrationConfig;
};

export type IntegrationPublicConfig = Record<string, unknown>;

const SECRET_KEYS = new Set([
  "access_token",
  "api_key",
  "smtp_password",
  "verify_token",
]);

export function sanitizeIntegrationForClient(
  provider: IntegrationProvider,
  config: Record<string, unknown> | null,
  hasToken: boolean
): IntegrationPublicConfig {
  const base = { ...(config ?? {}) };
  for (const key of SECRET_KEYS) {
    if (key in base) delete base[key];
  }
  if (hasToken) base.credentials_configured = true;
  return base;
}

export function isWhatsAppConfigComplete(
  config: Partial<WhatsAppIntegrationConfig> | null | undefined
): boolean {
  return Boolean(config?.phone_number_id?.trim() && config?.access_token?.trim());
}

export function isEmailConfigComplete(
  config: Partial<EmailIntegrationConfig> | null | undefined
): boolean {
  if (!config?.from_email?.trim()) return false;
  if (config.provider === "resend") return Boolean(config.api_key?.trim());
  if (config.provider === "smtp") {
    return Boolean(
      config.smtp_host?.trim() &&
        config.smtp_user?.trim() &&
        config.smtp_password?.trim()
    );
  }
  return Boolean(config.api_key?.trim());
}
