import type { IntegrationAdapter } from "@/lib/integrations/types";
import { getMockReservationsForProvider, getMockMessagesForProvider } from "@/lib/integrations/mock-sync";

/** Future: Airbnb Partner API / iCal */
export const airbnbAdapter: IntegrationAdapter = {
  provider: "airbnb",
  async getConnectionStatus() {
    return "connected";
  },
  async syncReservations() {
    const data = getMockReservationsForProvider("airbnb");
    return { count: data.length, data };
  },
  async syncMessages() {
    const data = getMockMessagesForProvider("airbnb");
    return { count: data.length, data };
  },
  async sendMessage() {
    return { success: true, externalId: `airbnb-mock-${Date.now()}` };
  },
};
