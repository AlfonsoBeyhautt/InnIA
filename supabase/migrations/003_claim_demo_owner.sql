-- Reassign legacy seed rows (owner_id = demo UUID) to a real auth user by email pattern.

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
  IF p_email IS NULL OR p_email = '' THEN
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
END;
$$;

-- Claim demo data when profile is created for matching emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.claim_checkinn_demo(NEW.email);

  RETURN NEW;
END;
$$;
