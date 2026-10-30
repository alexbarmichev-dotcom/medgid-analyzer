UPDATE articles SET body =
  substring(body from 1 for position(E'## Данные о здоровье' in body) - 1)
  || E'Подробнее о самих показателях: как читать бланк общего анализа, смотрите в статье [Расшифровка общего анализа крови](/articles/rasshifrovka-obshchego-analiza-krovi), а печёночные, почечные и другие показатели разобраны в статье [Биохимический анализ крови: расшифровка показателей](/articles/biokhimicheskiy-analiz-krovi-rasshifrovka).\n\n'
  || substring(body from position(E'## Данные о здоровье' in body))
WHERE slug = 'personalnaya-medicina-i-ii-nablyudenie-za-zdorovem' AND body NOT LIKE '%](/articles/rasshifrovka-obshchego%';

UPDATE articles SET body =
  substring(body from 1 for position(E'## Частые вопросы' in body) - 1)
  || E'Как следить за этими показателями во времени и зачем сравнивать их с прошлыми результатами, читайте в статье [Персональная медицина и ИИ: как меняется подход к наблюдению за здоровьем](/articles/personalnaya-medicina-i-ii-nablyudenie-za-zdorovem).\n\n'
  || substring(body from position(E'## Частые вопросы' in body))
WHERE slug IN ('biokhimicheskiy-analiz-krovi-rasshifrovka', 'rasshifrovka-obshchego-analiza-krovi') AND body NOT LIKE '%](/articles/personalnaya-medicina%';