import { conversations as mockConversations, guests as mockGuests, reservations as mockReservations } from "@/data/mock";
import type { IntegrationProvider } from "@/lib/supabase/types";
import type { SyncResult } from "@/lib/integrations/types";

/** Mock payloads returned by adapters until real APIs are connected */
export function getMockReservationsForProvider(provider: IntegrationProvider) {
  const platformMap: Record<IntegrationProvider, string[]> = {
    airbnb: ["Airbnb"],
    booking: ["Booking"],
    whatsapp_business: ["WhatsApp"],
    instagram: ["Instagram"],
    email: ["Email"],
  };
  const platforms = platformMap[provider] ?? [];
  return mockReservations.filter((r) => platforms.includes(r.platform));
}

export function getMockMessagesForProvider(provider: IntegrationProvider) {
  const channelMap: Record<IntegrationProvider, string[]> = {
    airbnb: ["Airbnb"],
    booking: ["Booking"],
    whatsapp_business: ["WhatsApp"],
    instagram: ["Instagram"],
    email: ["Email"],
  };
  const channels = channelMap[provider] ?? [];
  return mockConversations.filter((c) => channels.includes(c.platform));
}

export function getMockGuestsSlice() {
  return mockGuests.slice(0, 2);
}

export function emptySyncResult(provider: IntegrationProvider): SyncResult {
  return {
    provider,
    reservationsImported: 0,
    messagesImported: 0,
    errors: [],
  };
}
