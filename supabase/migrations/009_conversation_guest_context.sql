-- Persist extracted guest facts per conversation (dates, party size, etc.)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS guest_context JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN conversations.guest_context IS
  'Facts extracted from chat: check_in, check_out, guests_count, pets, etc.';
