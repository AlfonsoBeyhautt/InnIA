import type { IntegrationProvider } from "@/lib/supabase/types";
import type { IntegrationAdapter } from "@/lib/integrations/types";
import { airbnbAdapter } from "@/lib/integrations/airbnb-adapter";
import { bookingAdapter } from "@/lib/integrations/booking-adapter";
import { whatsappAdapter } from "@/lib/integrations/whatsapp-adapter";
import { emailAdapter } from "@/lib/integrations/email-adapter";

const adapters: Record<IntegrationProvider, IntegrationAdapter> = {
  airbnb: airbnbAdapter,
  booking: bookingAdapter,
  whatsapp_business: whatsappAdapter,
  email: emailAdapter,
};

export function getAdapter(provider: IntegrationProvider): IntegrationAdapter {
  return adapters[provider];
}

export { airbnbAdapter, bookingAdapter, whatsappAdapter, emailAdapter };
