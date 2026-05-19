import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getGuests, getGuestById } from "@/lib/db/queries";
import { createGuest } from "@/lib/db/mutations";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await getGuests()));
}

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const row = await createGuest(body);
    const guest = await getGuestById(row.id);
    return jsonOk(guest);
  });
}
