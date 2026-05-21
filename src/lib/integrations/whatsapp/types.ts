import type { IntegrationProvider } from "@/lib/supabase/types";

export type IntegrationRow = {
  id: string;
  provider: IntegrationProvider;
  status: string;
  last_sync_at: string | null;
  sync_status: string | null;
  error_message: string | null;
  config: Record<string, unknown>;
};
