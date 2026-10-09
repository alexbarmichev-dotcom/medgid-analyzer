CREATE TABLE IF NOT EXISTS maintenance_state (
    key VARCHAR(50) PRIMARY KEY,
    last_run TIMESTAMP NOT NULL DEFAULT '2000-01-01'
);
INSERT INTO maintenance_state (key) VALUES ('upload_cleanup') ON CONFLICT (key) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status_updated ON upload_sessions(status, updated_at);