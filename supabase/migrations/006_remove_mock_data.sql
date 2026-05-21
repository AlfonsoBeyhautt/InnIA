-- InnIA: remove demo / seed / mock operational data (idempotent, safe on empty DB)
-- Does NOT touch: auth.users, profiles, real user-owned properties outside demo fingerprints
-- Run once in Supabase SQL Editor after backups.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Identify demo properties (fixed seed UUIDs + known fingerprints)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _innia_demo_properties (id UUID PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _innia_demo_properties (id)
VALUES
  ('10000000-0000-4000-8000-000000000001'::uuid),
  ('10000000-0000-4000-8000-000000000002'::uuid),
  ('10000000-0000-4000-8000-000000000003'::uuid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO _innia_demo_properties (id)
SELECT p.id
FROM properties p
WHERE (
  p.owner_id = '00000000-0000-4000-8000-000000000001'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.owner_id
  )
)
OR (
  p.slug IN ('pdd', 'rocha', 'paloma')
  AND (
    p.name IN (
      'Casa Punta del Diablo',
      'Cabaña Rocha',
      'Apartamento La Paloma'
    )
    OR p.wifi_name IN (
      'CheckInn_PDD', 'InnIA_PDD',
      'Rocha_Cabin',
      'LaPaloma_Apt'
    )
    OR p.image_url LIKE '%unsplash.com%'
  )
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) Demo units (fixed UUIDs + units under demo properties)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _innia_demo_units (id UUID PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _innia_demo_units (id)
VALUES
  ('20000000-0000-4000-8000-000000000001'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid),
  ('20000000-0000-4000-8000-000000000003'::uuid),
  ('20000000-0000-4000-8000-000000000011'::uuid),
  ('20000000-0000-4000-8000-000000000012'::uuid),
  ('20000000-0000-4000-8000-000000000013'::uuid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO _innia_demo_units (id)
SELECT u.id
FROM units u
WHERE u.property_id IN (SELECT id FROM _innia_demo_properties)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Demo guests (legacy owner, mock names, or only tied to demo properties)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _innia_demo_guests (id UUID PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _innia_demo_guests (id)
SELECT g.id
FROM guests g
WHERE g.owner_id = '00000000-0000-4000-8000-000000000001'::uuid
   OR g.preferred_property_slug IN ('pdd', 'rocha', 'paloma')
   OR g.full_name IN (
     'Martín Alejandro García',
     'Lucía María Fernández',
     'Diego Rodríguez / Ana Silva',
     'Carla Pérez',
     'Juan Pablo Pérez',
     'Sofía Martínez López'
   )
   OR g.email IN (
     'martin.garcia@gmail.com',
     'lucia.fernandez@outlook.com',
     'diego.ana@hotmail.com',
     'carla.perez@gmail.com',
     'juan.perez@email.com',
     'sofia.martinez@gmail.com'
   )
ON CONFLICT (id) DO NOTHING;

-- Guests only used on demo properties (no reservation elsewhere)
INSERT INTO _innia_demo_guests (id)
SELECT DISTINCT g.id
FROM guests g
WHERE EXISTS (
  SELECT 1 FROM reservations r
  WHERE r.guest_id = g.id
    AND r.property_id IN (SELECT id FROM _innia_demo_properties)
)
AND NOT EXISTS (
  SELECT 1 FROM reservations r2
  WHERE r2.guest_id = g.id
    AND r2.property_id NOT IN (SELECT id FROM _innia_demo_properties)
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) Demo conversations (by property or legacy owner)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _innia_demo_conversations (id UUID PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _innia_demo_conversations (id)
SELECT c.id
FROM conversations c
WHERE c.property_id IN (SELECT id FROM _innia_demo_properties)
   OR c.guest_id IN (SELECT id FROM _innia_demo_guests)
   OR (
     c.owner_id = '00000000-0000-4000-8000-000000000001'::uuid
     AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.owner_id)
   )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) Delete children first (FK-safe order)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_props INT;
  v_logs INT;
  v_msgs INT;
  v_conv INT;
  v_res INT;
  v_tasks INT;
  v_notif INT;
  v_kb INT;
  v_units INT;
  v_guests INT;
  v_int INT;
  v_int2 INT;
BEGIN
  SELECT COUNT(*) INTO v_props FROM _innia_demo_properties;
  IF v_props = 0 THEN
    RAISE NOTICE 'InnIA 006: no demo properties detected — nothing to remove.';
  ELSE
    RAISE NOTICE 'InnIA 006: removing demo data (% demo properties)', v_props;
  END IF;

  -- AI logs
  DELETE FROM ai_response_logs
  WHERE conversation_id IN (SELECT id FROM _innia_demo_conversations);
  GET DIAGNOSTICS v_logs = ROW_COUNT;

  -- Messages (explicit; also cascades from conversations)
  DELETE FROM messages
  WHERE conversation_id IN (SELECT id FROM _innia_demo_conversations);
  GET DIAGNOSTICS v_msgs = ROW_COUNT;

  -- Conversations
  DELETE FROM conversations
  WHERE id IN (SELECT id FROM _innia_demo_conversations);
  GET DIAGNOSTICS v_conv = ROW_COUNT;

  -- Reservations on demo properties/units
  DELETE FROM reservations
  WHERE property_id IN (SELECT id FROM _innia_demo_properties)
     OR unit_id IN (SELECT id FROM _innia_demo_units);
  GET DIAGNOSTICS v_res = ROW_COUNT;

  -- Operation tasks
  DELETE FROM operation_tasks
  WHERE property_id IN (SELECT id FROM _innia_demo_properties)
     OR unit_id IN (SELECT id FROM _innia_demo_units)
     OR (
       owner_id = '00000000-0000-4000-8000-000000000001'::uuid
       AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = owner_id)
     );
  GET DIAGNOSTICS v_tasks = ROW_COUNT;

  -- Notifications: legacy orphan owner + demo conversation links
  DELETE FROM notifications
  WHERE (
    owner_id = '00000000-0000-4000-8000-000000000001'::uuid
    AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = owner_id)
  )
  OR related_entity_id IN (SELECT id FROM _innia_demo_conversations);
  GET DIAGNOSTICS v_notif = ROW_COUNT;

  -- Knowledge base (also removed via property CASCADE)
  DELETE FROM knowledge_base_items
  WHERE property_id IN (SELECT id FROM _innia_demo_properties);
  GET DIAGNOSTICS v_kb = ROW_COUNT;

  -- Units (also CASCADE from properties)
  DELETE FROM units
  WHERE id IN (SELECT id FROM _innia_demo_units);
  GET DIAGNOSTICS v_units = ROW_COUNT;

  -- Properties
  DELETE FROM properties
  WHERE id IN (SELECT id FROM _innia_demo_properties);
  GET DIAGNOSTICS v_props = ROW_COUNT;

  -- Guests (after reservations/conversations cleared)
  DELETE FROM guests g
  WHERE g.id IN (SELECT id FROM _innia_demo_guests)
    AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.guest_id = g.id)
    AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.guest_id = g.id);
  GET DIAGNOSTICS v_guests = ROW_COUNT;

  -- Integrations: orphan legacy owner
  DELETE FROM integrations
  WHERE owner_id = '00000000-0000-4000-8000-000000000001'::uuid
    AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = owner_id);
  GET DIAGNOSTICS v_int = ROW_COUNT;

  -- Seed placeholders on real users (no credentials, seed sync_status)
  DELETE FROM integrations i
  WHERE i.access_token_encrypted IS NULL
    AND COALESCE(i.config, '{}'::jsonb) = '{}'::jsonb
    AND i.sync_status IN ('ok', 'pending')
    AND i.status IN ('connected', 'disconnected')
    AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.owner_id = i.owner_id);
  GET DIAGNOSTICS v_int2 = ROW_COUNT;
  v_int := v_int + v_int2;

  RAISE NOTICE 'InnIA 006 deleted: properties=%, units=%, guests=%, reservations=%, conversations=%, messages=%, tasks=%, notifications=%, kb=%, ai_logs=%, integrations=%',
    v_props, v_units, v_guests, v_res, v_conv, v_msgs, v_tasks, v_notif, v_kb, v_logs, v_int;
END $$;

COMMIT;

-- Notes:
-- - auth.users and profiles are never modified.
-- - Real properties (custom slug/name) created via onboarding are kept.
-- - Integrations with saved credentials (WhatsApp/Email/iCal) are kept.
-- - Finanzas/reportes/insights mock viven solo en frontend (src/data/mock), no en DB.
