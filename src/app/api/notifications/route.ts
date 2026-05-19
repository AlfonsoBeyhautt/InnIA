import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getNotifications } from "@/lib/db/queries";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/db/mutations";

export async function GET() {
  return withAuthApiHandler(async () => jsonOk(await getNotifications()));
}

export async function PATCH(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    if (body.all) {
      await markAllNotificationsRead();
      return jsonOk({ success: true });
    }
    if (body.id) {
      await markNotificationRead(body.id);
      return jsonOk({ success: true });
    }
    return jsonOk({ success: false });
  });
}
