ALTER TABLE users ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET is_free = true WHERE login = 'алексей-борисович';