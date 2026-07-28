CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback (type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback (status);
