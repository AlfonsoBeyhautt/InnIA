import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { syncProviderToDatabase } from "@/lib/integrations/sync-to-db";
import type { IntegrationProvider } from "@/lib/supabase/types";

const valid: IntegrationProvider[] = [
  "airbnb",
  "booking",
  "whatsapp_business",
  "email",
];

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const provider = body.provider as IntegrationProvider;
    if (!valid.includes(provider)) {
      return jsonError("Provider inválido");
    }
    const result = await syncProviderToDatabase(provider);
    return jsonOk(result);
  });
}
