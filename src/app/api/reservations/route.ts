import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getReservations } from "@/lib/db/queries";
import { createReservation, assertNoReservationOverlap } from "@/lib/db/mutations";

export async function GET(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const { searchParams } = new URL(req.url);
    const propertySlug = searchParams.get("property") ?? undefined;
    const unitId = searchParams.get("unitId") ?? undefined;
    return jsonOk(
      await getReservations({
        propertySlug: propertySlug ?? undefined,
        unitDbId: unitId ?? undefined,
      })
    );
  });
}

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const overlap = await assertNoReservationOverlap({
      unitId: body.unitDbId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
    });
    if (!overlap.ok) return jsonError(overlap.message, 409);

    const row = await createReservation(body);
    return jsonOk(row);
  });
}
