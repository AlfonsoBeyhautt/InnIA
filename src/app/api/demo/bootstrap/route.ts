import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { bootstrapDemoAccount } from "@/lib/demo/bootstrap-demo-account";
import { requireAuth } from "@/lib/auth/session";

export async function POST() {
  return withAuthApiHandler(async () => {
    const { user } = await requireAuth();
    const result = await bootstrapDemoAccount(user.id, user.email);
    return jsonOk(result);
  });
}
