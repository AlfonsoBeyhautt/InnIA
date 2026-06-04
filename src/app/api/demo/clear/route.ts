import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { clearOwnerOperationalData } from "@/lib/demo/clear-owner-data";

export async function DELETE() {
  return withAuthApiHandler(async () => {
    const { user } = await requireAuth();
    const result = await clearOwnerOperationalData(user.id);
    return jsonOk(result);
  });
}
