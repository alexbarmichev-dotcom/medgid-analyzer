CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    author VARCHAR(120) NOT NULL,
    role VARCHAR(180),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
