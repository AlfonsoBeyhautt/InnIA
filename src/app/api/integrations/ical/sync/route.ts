import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getIntegrations } from "@/lib/db/queries";
import { upsertIntegrationConfig } from "@/lib/db/mutations";
import type { IntegrationProvider } from "@/lib/supabase/types";
import type { ICalIntegrationConfig } from "@/lib/integrations/config-types";

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const provider = body.provider as IntegrationProvider;
    if (provider !== "airbnb" && provider !== "booking") {
      return jsonError("Proveedor iCal no válido", 400);
    }

    const integrations = await getIntegrations();
    const row = integrations.find((i) => i.provider === provider);
    const config = (row?.config ?? {}) as ICalIntegrationConfig;
    if (!config.ical_url?.trim()) {
      return jsonError("Guardá primero el enlace iCal.", 400);
    }

    let importCount = 0;
    try {
      const res = await fetch(config.ical_url, { next: { revalidate: 0 } });
      if (res.ok) {
        const text = await res.text();
        importCount = (text.match(/BEGIN:VEVENT/g) ?? []).length;
      }
    } catch {
      importCount = 0;
    }

    await upsertIntegrationConfig(provider, {
      status: "connected",
      sync_status: importCount > 0 ? "ical_synced" : "ical_configured",
      config: {
        ...config,
        last_import_count: importCount,
      },
      error_message: null,
    });

    return jsonOk({
      provider,
      status: importCount > 0 ? "ical_synced" : "ical_configured",
      eventsFound: importCount,
      message:
        importCount > 0
          ? `Calendario sincronizado (${importCount} eventos detectados). La importación completa a reservas estará disponible pronto.`
          : "Configuración guardada. No se detectaron eventos en el iCal o el enlace no es accesible.",
    });
  });
}
