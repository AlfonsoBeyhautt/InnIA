import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getIntegrations } from "@/lib/db/queries";
import { upsertIntegration } from "@/lib/db/mutations";
import type { IntegrationProvider } from "@/lib/supabase/types";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await getIntegrations()));
}

export async function PATCH(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const provider = body.provider as IntegrationProvider;
    const row = await upsertIntegration(provider, {
      status: body.status,
      sync_status: body.sync_status,
      error_message: body.error_message,
    });
    return jsonOk(row);
  });
}
