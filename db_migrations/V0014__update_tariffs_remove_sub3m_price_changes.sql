UPDATE tariffs SET price = 150.00 WHERE id = 'one_time';
UPDATE tariffs SET is_active = false WHERE id = 'sub_3m';
UPDATE tariffs SET
  description = 'Расшифровка анализов + медицинский дневник + графики динамики + тренды + экспорт в PDF + личный защищённый AI-чат',
  features = '["Расшифровка анализов", "Медицинский дневник", "Графики динамики показателей", "Тренды по анализам", "Экспорт в PDF", "Сравнительный ИИ-разбор анализов", "Личный защищённый AI-чат"]'::jsonb
WHERE id = 'sub_12m';