import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getPropertyFull } from "@/lib/db/queries";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const full = await getPropertyFull(id);
    if (!full) return jsonError("Propiedad no encontrada", 404);
    return jsonOk(full);
  });
}
