import type { IntegrationAdapter } from "@/lib/integrations/types";
import { getMockReservationsForProvider, getMockMessagesForProvider } from "@/lib/integrations/mock-sync";

/** Future: IMAP / Gmail / SMTP */
export const emailAdapter: IntegrationAdapter = {
  provider: "email",
  async getConnectionStatus() {
    return "pending";
  },
  async syncReservations() {
    const data = getMockReservationsForProvider("email");
    return { count: data.length, data };
  },
  async syncMessages() {
    const data = getMockMessagesForProvider("email");
    return { count: data.length, data };
  },
  async sendMessage() {
    return { success: true, externalId: `email-mock-${Date.now()}` };
  },
};
