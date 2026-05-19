-- Fix "Database error saving new user" on signup
-- Cause: handle_new_user (003) runs claim_checkinn_demo; any failure aborts auth signup.

-- Ensure profile columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Safer demo claim (never block signup)
CREATE OR REPLACE FUNCTION public.claim_checkinn_demo(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_demo_owner UUID := '00000000-0000-4000-8000-000000000001';
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN FALSE;
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) LIKE '%' || lower(split_part(p_email, '@', 1)) || '%'
     OR lower(email) LIKE '%alfonsobeyhaut%'
     OR lower(email) LIKE '%beyhaut%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE properties SET owner_id = v_user_id WHERE owner_id = v_demo_owner;
  UPDATE guests SET owner_id = v_user_id WHERE owner_id = v_demo_owner;
  UPDATE conversations SET owner_id = v_user_id WHERE owner_id = v_demo_owner;
  UPDATE integrations SET owner_id = v_user_id WHERE owner_id = v_demo_owner;
  UPDATE operation_tasks SET owner_id = v_user_id WHERE owner_id = v_demo_owner;
  UPDATE notifications SET owner_id = v_user_id WHERE owner_id = v_demo_owner;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'claim_checkinn_demo: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Signup trigger: profile insert must succeed; demo claim is best-effort only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'Usuario'
  );

  INSERT INTO public.profiles (id, email, full_name, plan, onboarding_completed)
  VALUES (NEW.id, NEW.email, v_name, 'pro', false)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);

  BEGIN
    PERFORM public.claim_checkinn_demo(NEW.email);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user claim_checkinn_demo: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Auth hook role must be able to run trigger and write profiles
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT, UPDATE ON public.profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.claim_checkinn_demo(TEXT) TO supabase_auth_admin;

-- RLS: allow users to create their own profile (app fallback if trigger missed)
DROP POLICY IF EXISTS profiles_self ON profiles;
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
