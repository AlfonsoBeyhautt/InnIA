import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getOperationTasks } from "@/lib/db/queries";
import { createOperationTask } from "@/lib/db/mutations";

export async function GET(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const property = new URL(req.url).searchParams.get("property") ?? undefined;
    return jsonOk(await getOperationTasks(property ?? undefined));
  });
}

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const task = await createOperationTask(body);
    return jsonOk(task);
  });
}
