/** Public env vars safe for browser */
export function getPublicSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getPublicSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/** Server-only — avoid in client bundles */
export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

export function getWhatsAppVerifyToken(): string | undefined {
  return process.env.WHATSAPP_VERIFY_TOKEN;
}

export function getMetaAppId(): string | undefined {
  return process.env.META_APP_ID;
}

export function getMetaAppSecret(): string | undefined {
  return process.env.META_APP_SECRET;
}

export function getMetaConfigId(): string | undefined {
  return process.env.META_CONFIG_ID;
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://innia.vercel.app"
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getPublicSupabaseUrl() && getPublicSupabaseAnonKey());
}
