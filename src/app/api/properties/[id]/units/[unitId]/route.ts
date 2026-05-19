import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { deleteUnit, updateUnit } from "@/lib/db/mutations";
import { mapUnit } from "@/lib/db/mappers";

type Params = { params: Promise<{ id: string; unitId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { unitId } = await params;
    const body = await req.json();

    if (body.capacity !== undefined) {
      const capacity = Number(body.capacity);
      if (!Number.isFinite(capacity) || capacity < 1) {
        return jsonError("La capacidad debe ser al menos 1");
      }
    }
    if (body.name !== undefined && !String(body.name).trim()) {
      return jsonError("El nombre es obligatorio");
    }

    try {
      const row = await updateUnit(unitId, body);
      return jsonOk(mapUnit(row));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al actualizar";
      return jsonError(msg, 400);
    }
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { unitId } = await params;
    try {
      await deleteUnit(unitId);
      return jsonOk({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al eliminar";
      return jsonError(msg, 400);
    }
  });
}
