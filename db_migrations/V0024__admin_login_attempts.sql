CREATE TABLE IF NOT EXISTS admin_login_attempts (
    ip VARCHAR(64) PRIMARY KEY,
    failed_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);