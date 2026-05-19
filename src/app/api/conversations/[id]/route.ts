import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getConversationById } from "@/lib/db/queries";
import { updateConversation } from "@/lib/db/mutations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const conv = await getConversationById(id);
    if (!conv) return jsonError("Conversación no encontrada", 404);
    return jsonOk(conv);
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const body = await req.json();
    await updateConversation(id, body);
    const conv = await getConversationById(id);
    return jsonOk(conv);
  });
}
