export type InstagramIntegrationConfig = {
  instagram_business_account_id?: string;
  page_id?: string;
  access_token?: string;
  connection_method?: "meta" | "manual";
  ai_auto_reply_enabled?: boolean;
};

export function isInstagramConfigComplete(
  config: Partial<InstagramIntegrationConfig> | null | undefined,
  hasToken: boolean
): boolean {
  return Boolean(
    hasToken &&
      config?.instagram_business_account_id?.trim() &&
      config?.page_id?.trim()
  );
}
