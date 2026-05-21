import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonError } from "@/lib/api/response";

/** Instagram outbound — prepared for Meta Messaging API */
export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    if (!body.conversationId || !body.text?.trim()) {
      return jsonError("conversationId y text son requeridos", 400);
    }
    return jsonError(
      "Envío por Instagram en preparación. Completá la integración con Meta.",
      501
    );
  });
}
