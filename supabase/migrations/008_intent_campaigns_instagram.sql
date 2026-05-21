-- Intent-based inbox + ad campaigns + Instagram provider

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS intent_category TEXT NOT NULL DEFAULT 'otro',
  ADD COLUMN IF NOT EXISTS intent_manual_override BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN conversations.intent_category IS
  'nueva_consulta | huesped_activo | comercial | otro';

CREATE INDEX IF NOT EXISTS idx_conversations_intent_category
  ON conversations (owner_id, intent_category);

-- Owner AI / inbox preferences (per owner)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.ai_settings IS
  'ai_auto_classification, ai_auto_reply_enabled, channel_rules, etc.';

-- Simple ad campaigns (draft / ready — no Meta publish yet)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  budget NUMERIC(12, 2),
  start_date DATE,
  end_date DATE,
  channel TEXT NOT NULL DEFAULT 'instagram',
  ad_copy TEXT,
  cta TEXT,
  status TEXT NOT NULL DEFAULT 'borrador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_owner ON ad_campaigns (owner_id);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_campaigns_owner ON ad_campaigns
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Instagram uses integrations.provider = 'instagram' (unique per owner)
