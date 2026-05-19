import { NextRequest } from "next/server";
import { withAuthApiHandler } from "@/lib/api/handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import {
  completeOnboarding,
  type OnboardingPayload,
} from "@/lib/onboarding/complete-onboarding";

export async function POST(req: NextRequest) {
  return withAuthApiHandler(async () => {
    const body = (await req.json()) as OnboardingPayload;
    try {
      const result = await completeOnboarding(body);
      return jsonOk(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error en onboarding";
      return jsonError(msg, 400);
    }
  });
}
