import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getCurrentProfile, updateProfile } from "@/lib/db/profile";
import { getAuthUser } from "@/lib/auth/session";

export async function GET() {
  return withAuthApiHandler(async () => {
    const user = await getAuthUser();
    const profile = await getCurrentProfile();
    return jsonOk({ user: user ? { id: user.id, email: user.email } : null, profile });
  });
}

export async function PATCH(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = await req.json();
    const profile = await updateProfile(body);
    return jsonOk(profile);
  });
}
