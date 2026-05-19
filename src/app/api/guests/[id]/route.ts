import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getGuestById } from "@/lib/db/queries";
import { updateGuest } from "@/lib/db/mutations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const guest = await getGuestById(id);
    if (!guest) return jsonError("Huésped no encontrado", 404);
    return jsonOk(guest);
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const body = await req.json();
    await updateGuest(id, body);
    const guest = await getGuestById(id);
    return jsonOk(guest);
  });
}
