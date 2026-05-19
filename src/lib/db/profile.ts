import { requireAuth } from "@/lib/auth/session";
import type { UserProfile } from "@/lib/auth/session";

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
