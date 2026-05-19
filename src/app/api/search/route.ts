import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { globalSearch } from "@/lib/db/search";

export async function GET(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const groups = await globalSearch(q);
    return jsonOk({ query: q, groups });
  });
}
