import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getKnowledgeBase } from "@/lib/db/queries";
import { upsertKnowledgeItem } from "@/lib/db/mutations";
import type { KnowledgeCategory, KnowledgeStatus } from "@/lib/supabase/types";

export async function GET(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const propertyDbId = new URL(req.url).searchParams.get("propertyId");
    if (!propertyDbId) return jsonError("propertyId requerido");
    return jsonOk(await getKnowledgeBase(propertyDbId));
  });
}

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const row = await upsertKnowledgeItem({
      propertyDbId: body.propertyDbId,
      category: body.category as KnowledgeCategory,
      title: body.title,
      content: body.content,
      status: body.status as KnowledgeStatus,
    });
    return jsonOk(row);
  });
}
