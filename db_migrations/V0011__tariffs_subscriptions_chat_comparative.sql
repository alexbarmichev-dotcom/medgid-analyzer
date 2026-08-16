-- Тарифы
CREATE TABLE tariffs (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    duration_days INTEGER NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    chat_question_limit INTEGER NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO tariffs (id, name, description, price, duration_days, features, chat_question_limit, sort_order) VALUES
('one_time', 'Разовая оплата', '1 полный разбор анализов в личном кабинете, простым языком', 299.00, NULL,
  '["1 полный разбор анализов", "Простым языком, без диагнозов", "Список вопросов для врача"]'::jsonb, NULL, 1),
('sub_3m', 'Подписка. 3 месяца', 'Расшифровка анализов + медицинский дневник + графики динамики + тренды + экспорт в PDF', 1490.00, 90,
  '["Расшифровка анализов", "Медицинский дневник", "Графики динамики показателей", "Тренды по анализам", "Экспорт в PDF", "Сравнительный ИИ-разбор анализов"]'::jsonb, NULL, 2),
('sub_12m', 'Подписка. 12 месяцев', 'Всё из тарифа "3 месяца" + личный защищённый AI-чат по своим анализам', 4990.00, 365,
  '["Всё из тарифа \"3 месяца\"", "Личный защищённый AI-чат", "AI-чат: до 15 вопросов в месяц"]'::jsonb, 15, 3);

-- Привязка тарифа к пользователю
ALTER TABLE users ADD COLUMN current_tariff_id VARCHAR(32) NULL REFERENCES tariffs(id);
ALTER TABLE users ADD COLUMN tariff_started_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN tariff_expires_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN tariff_status VARCHAR(20) NULL;

-- Учёт лимита AI-чата (тариф 12 месяцев)
CREATE TABLE chat_usage (
    id SERIAL PRIMARY KEY,
    user_login VARCHAR(255) NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    questions_used INTEGER NOT NULL DEFAULT 0,
    questions_limit INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_usage_login_period ON chat_usage (user_login, period_start, period_end);

-- Сообщения AI-чата
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_login VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_login ON chat_messages (user_login, created_at);

-- Сравнительные разборы анализов
CREATE TABLE comparative_reports (
    id SERIAL PRIMARY KEY,
    user_login VARCHAR(255) NOT NULL,
    new_analysis_id INTEGER NOT NULL REFERENCES analyses(id),
    compared_analysis_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT NULL,
    trends JSONB NULL,
    charts JSONB NULL,
    discuss_with_doctor JSONB NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'done',
    raw_response TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_comparative_reports_login ON comparative_reports (user_login, new_analysis_id);

-- Заявки на оплату подписок (аналог pending_analyses, но для тарифов)
CREATE TABLE pending_subscriptions (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL UNIQUE,
    login VARCHAR(255) NOT NULL,
    tariff_id VARCHAR(32) NOT NULL REFERENCES tariffs(id),
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
