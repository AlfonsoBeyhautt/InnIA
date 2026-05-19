import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { updateOperationTask } from "@/lib/db/mutations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuthApiHandler(async () => {
    const { id } = await params;
    const body = await req.json();
    const task = await updateOperationTask(id, body);
    return jsonOk(task);
  });
}
