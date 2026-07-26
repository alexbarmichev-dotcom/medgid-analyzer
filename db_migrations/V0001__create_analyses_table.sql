CREATE TABLE analyses (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    gender VARCHAR(1),
    age INT,
    complaints TEXT,
    conditions TEXT,
    meds TEXT,
    file_urls JSONB DEFAULT '[]'::jsonb,
    ai_result TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_analyses_phone ON analyses(phone);