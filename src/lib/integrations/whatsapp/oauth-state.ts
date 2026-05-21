import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getMetaAppSecret } from "@/lib/config/env";

function signingSecret(): string {
  return getMetaAppSecret() ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "innia-oauth-dev";
}

export function createOAuthState(userId: string): string {
  const nonce = randomBytes(12).toString("hex");
  const payload = `${userId}.${Date.now()}.${nonce}`;
  const sig = createHmac("sha256", signingSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 24);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyOAuthState(state: string, maxAgeMs = 15 * 60 * 1000): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot < 0) return null;
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = createHmac("sha256", signingSecret())
      .update(payload)
      .digest("hex")
      .slice(0, 24);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const [userId, ts] = payload.split(".");
    if (!userId || !ts) return null;
    if (Date.now() - Number(ts) > maxAgeMs) return null;
    return userId;
  } catch {
    return null;
  }
}
