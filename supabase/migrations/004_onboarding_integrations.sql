-- Onboarding & integration config extensions

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS property_type TEXT;

ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_integrations_whatsapp_phone
  ON integrations ((config->>'phone_number_id'))
  WHERE provider = 'whatsapp_business';
