import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";

/** Demo bootstrap disabled — app uses real data only. */
export async function POST() {
  return withAuthApiHandler(async () =>
    jsonOk({
      seeded: false,
      message: "Demo bootstrap deshabilitado. Creá propiedades desde onboarding o Propiedades.",
      properties: 0,
      guests: 0,
      reservations: 0,
      conversations: 0,
      tasks: 0,
      notifications: 0,
    })
  );
}
