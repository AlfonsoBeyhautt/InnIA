import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getConversationById } from "@/lib/db/queries";
import { sendMessage } from "@/lib/db/mutations";
import { mapMessage } from "@/lib/db/mappers";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const body = await req.json();
    const senderType = body.senderType ?? "owner";
    const msg = await sendMessage({
      conversationId: id,
      senderType,
      body: body.body,
      senderName: body.senderName,
      aiGenerated: body.aiGenerated ?? senderType === "ai",
      aiAutoSent: body.aiAutoSent ?? false,
    });
    const conv = await getConversationById(id);
    return jsonOk({ message: mapMessage(msg), conversation: conv });
  });
}
