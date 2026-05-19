import type { IntegrationProvider } from "@/lib/supabase/types";

export type SyncResult = {
  provider: IntegrationProvider;
  reservationsImported: number;
  messagesImported: number;
  errors: string[];
};

export type ConnectionStatus = "connected" | "disconnected" | "error" | "pending";

export interface IntegrationAdapter {
  provider: IntegrationProvider;
  getConnectionStatus(): Promise<ConnectionStatus>;
  syncReservations(): Promise<{ count: number; data: unknown[] }>;
  syncMessages(): Promise<{ count: number; data: unknown[] }>;
  sendMessage(payload: {
    conversationExternalId?: string;
    to: string;
    body: string;
  }): Promise<{ success: boolean; externalId?: string }>;
}
