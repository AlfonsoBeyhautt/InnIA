import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getReportsMetrics } from "@/lib/db/reports-metrics";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await getReportsMetrics()));
}
