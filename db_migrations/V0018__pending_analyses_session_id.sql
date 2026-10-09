ALTER TABLE pending_analyses ADD COLUMN IF NOT EXISTS session_id VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_pending_analyses_session_id ON pending_analyses(session_id);