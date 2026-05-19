import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
  getSupabaseServiceRoleKey,
} from "@/lib/config/env";

/** Server client with user session (anon key + cookies). For future Auth. */
export async function createServerSupabaseClient() {
  const url = getPublicSupabaseUrl();
  const key = getPublicSupabaseAnonKey();
  if (!url || !key) {
    throw new Error("Supabase URL/anon key missing");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll from Server Component — ignore
        }
      },
    },
  });
}

/**
 * Admin client — SERVICE ROLE ONLY.
 * Use in API routes / server actions. Never import in client components.
 */
export function createServiceRoleClient() {
  const url = getPublicSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or URL missing");
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
