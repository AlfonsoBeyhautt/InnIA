import { isSupabaseConfigured } from "@/lib/config/env";
import { requireAuth } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/errors";
import { jsonError, serviceUnavailable } from "@/lib/api/response";

export async function withApiHandler<T>(
  handler: () => Promise<T>
): Promise<Response | T> {
  if (!isSupabaseConfigured()) {
    return serviceUnavailable(
      "Supabase no configurado. Definí las variables de entorno."
    );
  }
  try {
    return await handler();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("[API]", message);
    return jsonError(message, 500);
  }
}

/** Requires authenticated Supabase session (uses auth.uid() via RLS). */
export async function withAuthApiHandler<T>(
  handler: () => Promise<T>
): Promise<Response | T> {
  if (!isSupabaseConfigured()) {
    return serviceUnavailable(
      "Supabase no configurado. Definí las variables de entorno."
    );
  }
  try {
    await requireAuth();
    return await handler();
  } catch (err) {
    if (err instanceof AuthError) {
      return jsonError(err.message, 401);
    }
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("[API]", message);
    return jsonError(message, 500);
  }
}
