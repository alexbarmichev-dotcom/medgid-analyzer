CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(160) NOT NULL UNIQUE,
    title VARCHAR(300) NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    author VARCHAR(120) NOT NULL DEFAULT 'Команда ЛабГид',
    cover_url TEXT,
    seo_title VARCHAR(300),
    seo_description VARCHAR(400),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles (status, published_at DESC);