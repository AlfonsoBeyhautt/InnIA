import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getPropertyById, getPropertyBySlug } from "@/lib/db/queries";
import { deleteProperty, updatePropertyWithKnowledge } from "@/lib/db/mutations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const property =
      id.length > 20 ? await getPropertyById(id) : await getPropertyBySlug(id);
    if (!property) return jsonError("Propiedad no encontrada", 404);
    return jsonOk(property);
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const body = await req.json();
    const dbId = body.dbId ?? id;
    await updatePropertyWithKnowledge(dbId, body);
    const property = await getPropertyById(dbId);
    return jsonOk(property);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const property =
      id.length > 20 ? await getPropertyById(id) : await getPropertyBySlug(id);
    if (!property?.dbId) return jsonError("Propiedad no encontrada", 404);
    try {
      await deleteProperty(property.dbId);
      return jsonOk({ deleted: true, id: property.dbId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar la propiedad";
      if (msg.includes("no encontrada") || msg.includes("No autorizado")) {
        return jsonError(msg, 404);
      }
      return jsonError(msg, 500);
    }
  });
}
