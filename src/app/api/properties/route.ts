import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getProperties } from "@/lib/db/queries";
import { createProperty, createUnit } from "@/lib/db/mutations";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await getProperties()));
}

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const location = String(body.location ?? "").trim();
    if (!name || !location) {
      return jsonError("Nombre y ubicación son obligatorios.", 400);
    }

    const row = await createProperty({
      name,
      location,
      propertyType: body.propertyType,
      description: body.description,
    });

    const unitName = String(body.unitName ?? "Unidad principal").trim();
    const capacity = Math.max(1, Number(body.capacity) || 2);
    await createUnit(row.id, {
      name: unitName,
      capacity,
    });

    const properties = await getProperties();
    const created = properties.find((p) => p.dbId === row.id);
    return jsonOk(created ?? { dbId: row.id, slug: row.slug, name: row.name });
  });
}
