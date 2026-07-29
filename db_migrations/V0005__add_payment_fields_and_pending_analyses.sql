ALTER TABLE analyses
    ADD COLUMN IF NOT EXISTS payment_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
    ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);

CREATE INDEX IF NOT EXISTS idx_analyses_payment_id ON analyses(payment_id);

ALTER TABLE analyses ALTER COLUMN status SET DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS pending_analyses (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(64) UNIQUE NOT NULL,
    login VARCHAR(64) NOT NULL,
    gender VARCHAR(1),
    age INT,
    complaints TEXT,
    conditions TEXT,
    meds TEXT,
    files JSONB NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_analyses_payment_id ON pending_analyses(payment_id);
