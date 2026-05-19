import { requireAuth } from "@/lib/auth/session";
import type { UserProfile } from "@/lib/auth/session";
import type { User } from "@supabase/supabase-js";

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { supabase, user } = await requireAuth();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, company_name, phone, plan, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function updateProfile(input: {
  full_name?: string;
  company_name?: string;
  phone?: string;
  onboarding_completed?: boolean;
}) {
  const { supabase, user } = await requireAuth();
  const patch: {
    full_name?: string;
    company_name?: string;
    phone?: string;
    onboarding_completed?: boolean;
  } = {};
  if (input.full_name !== undefined) patch.full_name = input.full_name;
  if (input.company_name !== undefined) patch.company_name = input.company_name;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.onboarding_completed !== undefined)
    patch.onboarding_completed = input.onboarding_completed;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("id, email, full_name, company_name, phone, plan, onboarding_completed")
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/** Creates profile row if trigger failed (signup fallback). */
export async function ensureProfileForUser(user: User): Promise<UserProfile> {
  const { supabase } = await requireAuth();
  const existing = await getCurrentProfile();
  if (existing) return existing;

  const fullName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "Usuario";

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      plan: "pro",
      onboarding_completed: false,
    })
    .select("id, email, full_name, company_name, phone, plan, onboarding_completed")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("profiles")
      .select("id, email, full_name, company_name, phone, plan, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    if (retry) return retry as UserProfile;
    throw error;
  }
  return data as UserProfile;
}
