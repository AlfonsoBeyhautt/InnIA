import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "@/lib/config/env";

export function createClient() {
  const url = getPublicSupabaseUrl();
  const key = getPublicSupabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Supabase no configurado. Definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient<Database>(url, key);
}
