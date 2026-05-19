import type { IntegrationAdapter } from "@/lib/integrations/types";
import { getMockReservationsForProvider, getMockMessagesForProvider } from "@/lib/integrations/mock-sync";

/** Future: WhatsApp Business Cloud API */
export const whatsappAdapter: IntegrationAdapter = {
  provider: "whatsapp_business",
  async getConnectionStatus() {
    return "connected";
  },
  async syncReservations() {
    const data = getMockReservationsForProvider("whatsapp_business");
    return { count: data.length, data };
  },
  async syncMessages() {
    const data = getMockMessagesForProvider("whatsapp_business");
    return { count: data.length, data };
  },
  async sendMessage() {
    return { success: true, externalId: `wa-mock-${Date.now()}` };
  },
};
