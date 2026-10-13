CREATE TABLE IF NOT EXISTS analysis_jobs (
  job_key VARCHAR(100) PRIMARY KEY,
  login VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  analysis_id INTEGER,
  result TEXT,
  error TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP
);