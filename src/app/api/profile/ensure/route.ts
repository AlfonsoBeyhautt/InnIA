import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { ensureProfileForUser } from "@/lib/db/profile";
import { getAuthUser } from "@/lib/auth/session";

export async function POST() {
  return withAuthApiHandler(async () => {
    const user = await getAuthUser();
    if (!user) throw new Error("No autorizado");
    const profile = await ensureProfileForUser(user);
    return jsonOk(profile);
  });
}
