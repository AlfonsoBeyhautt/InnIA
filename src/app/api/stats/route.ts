import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getAppStats } from "@/lib/db/app-stats";

export async function GET() {
  return withAuthApiHandler(async () => {
    const stats = await getAppStats();
    return jsonOk(stats);
  });
}
