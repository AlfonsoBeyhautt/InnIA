import {
  createProperty,
  createUnit,
  upsertIntegrationConfig,
} from "@/lib/db/mutations";
import { updateProfile } from "@/lib/db/profile";
import { syncPropertyKnowledgeFromProperty } from "@/lib/property-knowledge-sync";
import { mapProperty } from "@/lib/db/mappers";
import {
  isEmailConfigComplete,
  isWhatsAppConfigComplete,
} from "@/lib/integrations/config-types";
import type { IntegrationProvider } from "@/lib/supabase/types";
import type { Platform } from "@/types";

export type OnboardingPayload = {
  profile: {
    full_name: string;
    phone?: string;
    company_name?: string;
  };
  property: {
    name: string;
    location: string;
    property_type?: string;
    unit_count: number;
    check_in_time?: string;
    check_out_time?: string;
    house_rules?: string;
    wifi_name?: string;
    wifi_password?: string;
    parking_info?: string;
    pet_policy?: string;
    internal_notes?: string;
  };
  units?: { name: string; capacity: number; notes?: string }[];
  integrations?: {
    whatsapp?: Record<string, unknown>;
    email?: Record<string, unknown>;
    airbnb?: { ical_url?: string };
    booking?: { ical_url?: string };
  };
};

export async function completeOnboarding(payload: OnboardingPayload) {
  if (!payload.profile.full_name?.trim()) {
    throw new Error("El nombre completo es obligatorio");
  }
  if (!payload.property.name?.trim()) {
    throw new Error("Debés crear al menos una propiedad");
  }

  await updateProfile({
    full_name: payload.profile.full_name.trim(),
    company_name: payload.profile.company_name?.trim(),
    phone: payload.profile.phone?.trim(),
  });

  const platforms: Platform[] = [];
  if (payload.integrations?.whatsapp) platforms.push("WhatsApp");
  if (payload.integrations?.email) platforms.push("Email");
  if (payload.integrations?.airbnb?.ical_url) platforms.push("Airbnb");
  if (payload.integrations?.booking?.ical_url) platforms.push("Booking");

  const propertyRow = await createProperty({
    name: payload.property.name,
    location: payload.property.location,
    propertyType: payload.property.property_type,
    checkInTime: payload.property.check_in_time,
    checkOutTime: payload.property.check_out_time,
    houseRules: payload.property.house_rules,
    wifiName: payload.property.wifi_name,
    wifiPassword: payload.property.wifi_password,
    parkingInfo: payload.property.parking_info,
    petPolicy: payload.property.pet_policy,
    internalNotes: payload.property.internal_notes,
    platforms,
  });

  const property = mapProperty(propertyRow);
  const propertyDbId = propertyRow.id;

  const unitCount = Math.max(1, payload.property.unit_count || 1);
  const unitsInput = payload.units ?? [];

  if (unitCount === 1 && unitsInput.length === 0) {
    await createUnit(propertyDbId, {
      name: "Unidad principal",
      capacity: 2,
    });
  } else {
    for (const u of unitsInput) {
      if (!u.name?.trim()) continue;
      await createUnit(propertyDbId, {
        name: u.name.trim(),
        capacity: u.capacity || 2,
        notes: u.notes,
      });
    }
  }

  await syncPropertyKnowledgeFromProperty(propertyDbId, property);

  const integrations = payload.integrations ?? {};

  if (integrations.whatsapp) {
    const cfg = integrations.whatsapp;
    const complete = isWhatsAppConfigComplete(
      cfg as Parameters<typeof isWhatsAppConfigComplete>[0]
    );
    await upsertIntegrationConfig("whatsapp_business", {
      status: complete ? "connected" : "pending",
      sync_status: complete ? "ready" : "pending_credentials",
      config: {
        ...cfg,
        default_property_id: propertyDbId,
      },
      accessToken:
        typeof cfg.access_token === "string" ? cfg.access_token : undefined,
    });
  }

  if (integrations.email) {
    const cfg = integrations.email;
    const complete = isEmailConfigComplete(
      cfg as Parameters<typeof isEmailConfigComplete>[0]
    );
    await upsertIntegrationConfig("email", {
      status: complete ? "connected" : "pending",
      sync_status: complete ? "ready" : "pending_credentials",
      config: cfg,
      accessToken: typeof cfg.api_key === "string" ? cfg.api_key : undefined,
    });
  }

  for (const provider of ["airbnb", "booking"] as IntegrationProvider[]) {
    const block = integrations[provider as keyof typeof integrations] as
      | { ical_url?: string }
      | undefined;
    if (!block?.ical_url?.trim()) continue;
    await upsertIntegrationConfig(provider, {
      status: "connected",
      sync_status: "ical_configured",
      config: {
        ical_url: block.ical_url.trim(),
        property_id: propertyDbId,
      },
    });
  }

  await updateProfile({ onboarding_completed: true });

  return { property, propertyDbId };
}
