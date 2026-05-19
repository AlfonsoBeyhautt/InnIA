import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getProperties } from "@/lib/db/queries";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await getProperties()));
}
