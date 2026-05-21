import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { createAdCampaign, listAdCampaigns } from "@/lib/db/ad-campaigns";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await listAdCampaigns()));
}

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    if (!body.name?.trim() || !body.objective?.trim()) {
      return jsonError("Nombre y objetivo son obligatorios.", 400);
    }
    const campaign = await createAdCampaign({
      name: body.name,
      objective: body.objective,
      propertyId: body.propertyId,
      budget: body.budget != null ? Number(body.budget) : undefined,
      startDate: body.startDate,
      endDate: body.endDate,
      channel: body.channel,
      adCopy: body.adCopy,
      cta: body.cta,
      status: body.status,
    });
    return jsonOk(campaign);
  });
}
