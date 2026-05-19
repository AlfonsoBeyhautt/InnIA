import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthError } from "@/lib/auth/errors";
import type { User } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  plan: string;
  onboarding_completed: boolean;
};

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new AuthError();
  return session;
}

export async function getProfile(userId?: string): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;
  const id = userId ?? session.user.id;

  const { data, error } = await session.supabase
    .from("profiles")
    .select("id, email, full_name, company_name, phone, plan, onboarding_completed")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function getAuthUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}
