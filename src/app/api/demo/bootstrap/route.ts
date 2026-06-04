import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { bootstrapDemoAccount } from "@/lib/demo/bootstrap-demo-account";

export async function POST(request: Request) {
  return withAuthApiHandler(async () => {
    const { user } = await requireAuth();
    const body = (await request.json().catch(() => ({}))) as { force?: boolean };
    const result = await bootstrapDemoAccount(user.id, user.email, {
      force: body.force === true,
    });
    return jsonOk(result);
  });
}
