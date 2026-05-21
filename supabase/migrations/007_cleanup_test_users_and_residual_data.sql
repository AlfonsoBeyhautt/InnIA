-- InnIA 007: remove test users, property "AMB", and residual data (idempotent)
-- Run in Supabase SQL Editor (requires privileges on auth.users).
-- Does NOT drop tables or alter RLS/onboarding triggers.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Property "AMB" (any owner) + related data
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _innia_amb_properties (id UUID PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _innia_amb_properties (id)
SELECT p.id
FROM properties p
WHERE trim(upper(p.name)) = 'AMB'
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE _innia_amb_conversations (id UUID PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _innia_amb_conversations (id)
SELECT c.id
FROM conversations c
WHERE c.property_id IN (SELECT id FROM _innia_amb_properties)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_props INT;
BEGIN
  SELECT COUNT(*) INTO v_props FROM _innia_amb_properties;
  IF v_props = 0 THEN
    RAISE NOTICE 'InnIA 007: no property named AMB found.';
  ELSE
    RAISE NOTICE 'InnIA 007: removing AMB and related data (% properties)', v_props;

    DELETE FROM ai_response_logs
    WHERE conversation_id IN (SELECT id FROM _innia_amb_conversations);

    DELETE FROM messages
    WHERE conversation_id IN (SELECT id FROM _innia_amb_conversations);

    DELETE FROM conversations
    WHERE id IN (SELECT id FROM _innia_amb_conversations);

    DELETE FROM reservations
    WHERE property_id IN (SELECT id FROM _innia_amb_properties);

    DELETE FROM operation_tasks
    WHERE property_id IN (SELECT id FROM _innia_amb_properties);

    DELETE FROM notifications
    WHERE related_entity_id IN (
      SELECT id FROM _innia_amb_conversations
      UNION
      SELECT id FROM _innia_amb_properties
    );

    DELETE FROM knowledge_base_items
    WHERE property_id IN (SELECT id FROM _innia_amb_properties);

    DELETE FROM units
    WHERE property_id IN (SELECT id FROM _innia_amb_properties);

    DELETE FROM properties
    WHERE id IN (SELECT id FROM _innia_amb_properties);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Test users — full cleanup so emails can re-register
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_emails text[] := ARRAY['alfobeyhaut@icloud.com', 'alfonsobeyhaut@gmail.com'];
  v_email text;
  v_uid uuid;
  v_props uuid[];
  v_conv_ids uuid[];
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(v_email);
    IF v_uid IS NULL THEN
      RAISE NOTICE 'InnIA 007: user not found — %', v_email;
      CONTINUE;
    END IF;

    RAISE NOTICE 'InnIA 007: cleaning user % (%)', v_email, v_uid;

    SELECT array_agg(id) INTO v_props FROM properties WHERE owner_id = v_uid;
    v_props := COALESCE(v_props, ARRAY[]::uuid[]);

    SELECT array_agg(id) INTO v_conv_ids FROM conversations WHERE owner_id = v_uid;
    v_conv_ids := COALESCE(v_conv_ids, ARRAY[]::uuid[]);

    IF cardinality(v_conv_ids) > 0 THEN
      DELETE FROM ai_response_logs WHERE conversation_id = ANY(v_conv_ids);
      DELETE FROM messages WHERE conversation_id = ANY(v_conv_ids);
    END IF;

    DELETE FROM conversations WHERE owner_id = v_uid;

    IF cardinality(v_props) > 0 THEN
      DELETE FROM reservations WHERE property_id = ANY(v_props);
      DELETE FROM knowledge_base_items WHERE property_id = ANY(v_props);
      DELETE FROM units WHERE property_id = ANY(v_props);
    END IF;

    DELETE FROM operation_tasks WHERE owner_id = v_uid;
    DELETE FROM notifications WHERE owner_id = v_uid;
    DELETE FROM properties WHERE owner_id = v_uid;
    DELETE FROM guests WHERE owner_id = v_uid;
    DELETE FROM integrations WHERE owner_id = v_uid;

    -- profiles CASCADE when auth.users is deleted; explicit delete is safe
    DELETE FROM public.profiles WHERE id = v_uid;

    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;

    RAISE NOTICE 'InnIA 007: deleted auth user %', v_email;
  END LOOP;
END $$;

COMMIT;

-- If auth.* deletes fail in a plain migration run, execute only the DO block
-- (from "2) Test users") in SQL Editor as postgres / service_role.
