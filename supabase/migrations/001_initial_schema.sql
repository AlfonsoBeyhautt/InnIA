-- CheckInn initial schema
-- Run in Supabase SQL Editor or via CLI

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ---------------------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  description TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'disponible',
  occupancy INTEGER NOT NULL DEFAULT 0,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  smart_lock_online BOOLEAN NOT NULL DEFAULT false,
  check_in_time TEXT DEFAULT '15:00',
  check_out_time TEXT DEFAULT '10:00',
  wifi_name TEXT,
  wifi_password TEXT,
  parking_info TEXT,
  pet_policy TEXT,
  house_rules TEXT,
  lock_instructions TEXT,
  arrival_instructions TEXT,
  emergency_contact TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, slug)
);

-- ---------------------------------------------------------------------------
-- Units
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'disponible',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, slug)
);

-- ---------------------------------------------------------------------------
-- Guests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  document_type TEXT,
  document_number TEXT,
  passport_number TEXT,
  nationality TEXT,
  phone TEXT,
  email TEXT,
  origin_platform TEXT,
  validation_status TEXT NOT NULL DEFAULT 'pendiente',
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB NOT NULL DEFAULT '[]',
  internal_notes TEXT,
  observations TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  preferred_property_slug TEXT,
  rental_data JSONB,
  incidents JSONB NOT NULL DEFAULT '[]',
  reviews JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Reservations (overlap prevention per unit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  platform TEXT NOT NULL,
  platform_reservation_id TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmada',
  payment_status TEXT NOT NULL DEFAULT 'pendiente',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  guests_count INTEGER NOT NULL DEFAULT 1,
  lock_code_status TEXT DEFAULT 'pendiente',
  blocked BOOLEAN NOT NULL DEFAULT false,
  maintenance BOOLEAN NOT NULL DEFAULT false,
  source_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reservations_dates_valid CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_reservations_unit_dates
  ON reservations (unit_id, check_in, check_out);

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_no_overlap;
ALTER TABLE reservations ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    unit_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelada'));

-- ---------------------------------------------------------------------------
-- Conversations & messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'abierta',
  priority TEXT NOT NULL DEFAULT 'normal',
  ai_status TEXT,
  labels TEXT[] NOT NULL DEFAULT '{}',
  sentiment TEXT,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  unread BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_name TEXT,
  body TEXT NOT NULL,
  channel TEXT,
  external_message_id TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_auto_sent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Integrations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, provider)
);

-- ---------------------------------------------------------------------------
-- Knowledge base (IA)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_base_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'faltante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, category)
);

-- ---------------------------------------------------------------------------
-- Operation tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  priority TEXT,
  due_date DATE,
  checklist JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications (owner_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- AI response logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_response_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  generated_response TEXT NOT NULL,
  used_knowledge JSONB NOT NULL DEFAULT '[]',
  missing_information JSONB NOT NULL DEFAULT '[]',
  ai_decision TEXT NOT NULL,
  auto_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'properties','units','guests','reservations','conversations',
    'integrations','knowledge_base_items','operation_tasks'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated ON %I;
      CREATE TRIGGER trg_%s_updated
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- RLS (prepared for Supabase Auth — owner_id = auth.uid())
-- Until Auth: policies use a session variable or service role bypass.
-- ---------------------------------------------------------------------------
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_logs ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies (auth.uid() when Auth is enabled)
CREATE POLICY properties_owner ON properties
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY guests_owner ON guests
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY conversations_owner ON conversations
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY integrations_owner ON integrations
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY tasks_owner ON operation_tasks
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY notifications_owner ON notifications
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Child tables via property ownership
CREATE POLICY units_via_property ON units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY reservations_via_property ON reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY kb_via_property ON knowledge_base_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE POLICY messages_via_conversation ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY ai_logs_via_conversation ON ai_response_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.owner_id = auth.uid()
    )
  );
