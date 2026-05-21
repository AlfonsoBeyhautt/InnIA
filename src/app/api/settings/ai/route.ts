import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import {
  getOwnerAiSettings,
  updateOwnerAiSettings,
} from "@/lib/ai/owner-settings";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await getOwnerAiSettings()));
}

export async function PATCH(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const updated = await updateOwnerAiSettings(body);
    return jsonOk(updated);
  });
}
