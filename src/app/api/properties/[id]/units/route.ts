import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { createUnit } from "@/lib/db/mutations";
import { getPropertyById, getPropertyBySlug, getUnits } from "@/lib/db/queries";
import { mapUnit } from "@/lib/db/mappers";

type Params = { params: Promise<{ id: string }> };

async function resolvePropertyDbId(id: string) {
  const property =
    id.length > 20 ? await getPropertyById(id) : await getPropertyBySlug(id);
  return property?.dbId ?? null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const dbId = await resolvePropertyDbId(id);
    if (!dbId) return jsonError("Propiedad no encontrada", 404);
    return jsonOk(await getUnits(dbId));
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const dbId = await resolvePropertyDbId(id);
    if (!dbId) return jsonError("Propiedad no encontrada", 404);

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const capacity = Number(body.capacity);
    if (!name) return jsonError("El nombre de la unidad es obligatorio");
    if (!Number.isFinite(capacity) || capacity < 1) {
      return jsonError("La capacidad debe ser al menos 1");
    }

    const row = await createUnit(dbId, {
      name,
      capacity,
      status: body.status,
      notes: body.notes,
    });
    return jsonOk(mapUnit(row));
  });
}
