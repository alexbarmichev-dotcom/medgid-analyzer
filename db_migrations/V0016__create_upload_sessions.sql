CREATE TABLE IF NOT EXISTS upload_sessions (
    id VARCHAR(36) PRIMARY KEY,
    login VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'uploading',
    file_count INT NOT NULL,
    declared_bytes BIGINT NOT NULL,
    uploaded_bytes BIGINT NOT NULL DEFAULT 0,
    files JSONB NOT NULL DEFAULT '[]'::jsonb,
    gender VARCHAR(1),
    age INT,
    complaints TEXT,
    conditions TEXT,
    meds TEXT,
    email VARCHAR(255),
    payment_id VARCHAR(64),
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_login ON upload_sessions(login);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_payment_id ON upload_sessions(payment_id);