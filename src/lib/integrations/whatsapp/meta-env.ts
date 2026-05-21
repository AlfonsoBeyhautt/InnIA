import {
  getMetaAppId,
  getMetaAppSecret,
  getMetaConfigId,
  getWhatsAppVerifyToken,
} from "@/lib/config/env";

export type MetaEnvCheck = {
  configured: boolean;
  missing: string[];
};

const META_ENV_LABELS: Record<string, string> = {
  META_APP_ID: "META_APP_ID",
  META_APP_SECRET: "META_APP_SECRET",
  META_CONFIG_ID: "META_CONFIG_ID",
  WHATSAPP_VERIFY_TOKEN: "WHATSAPP_VERIFY_TOKEN",
};

export function checkMetaEmbeddedSignupEnv(): MetaEnvCheck {
  const missing: string[] = [];
  if (!getMetaAppId()) missing.push(META_ENV_LABELS.META_APP_ID);
  if (!getMetaAppSecret()) missing.push(META_ENV_LABELS.META_APP_SECRET);
  if (!getMetaConfigId()) missing.push(META_ENV_LABELS.META_CONFIG_ID);
  if (!getWhatsAppVerifyToken()) missing.push(META_ENV_LABELS.WHATSAPP_VERIFY_TOKEN);
  return { configured: missing.length === 0, missing };
}
