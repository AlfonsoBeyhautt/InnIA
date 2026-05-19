import type { IntegrationAdapter } from "@/lib/integrations/types";
import { getMockReservationsForProvider, getMockMessagesForProvider } from "@/lib/integrations/mock-sync";

/** Future: Booking.com Connectivity API */
export const bookingAdapter: IntegrationAdapter = {
  provider: "booking",
  async getConnectionStatus() {
    return "connected";
  },
  async syncReservations() {
    const data = getMockReservationsForProvider("booking");
    return { count: data.length, data };
  },
  async syncMessages() {
    const data = getMockMessagesForProvider("booking");
    return { count: data.length, data };
  },
  async sendMessage() {
    return { success: true, externalId: `booking-mock-${Date.now()}` };
  },
};
