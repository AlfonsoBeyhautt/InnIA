import type { IntegrationAdapter } from "@/lib/integrations/types";

/** Prepared for Meta Instagram Messaging API */
export const instagramAdapter: IntegrationAdapter = {
  provider: "instagram",
  async getConnectionStatus() {
    return "pending";
  },
  async syncReservations() {
    return { count: 0, data: [] };
  },
  async syncMessages() {
    return { count: 0, data: [] };
  },
  async sendMessage() {
    return {
      success: false,
      error: "Envío por Instagram en preparación.",
    };
  },
};
