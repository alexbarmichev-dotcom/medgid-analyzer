UPDATE articles
SET body = left(body, strpos(body, E'\n\n## Источники') - 1) || $s$

## Источники

ВОЗ, доклад «National Health Workforce Accounts: Health Workforce Levels and Trends 2026» и пресс-релиз «One in four doctors nearing retirement age as WHO warns of global health workforce gap», 18 сентября 2026 года. Прогноз дефицита 11,1 млн работников здравоохранения к 2030 году, 67 стран без достаточного числа медиков, почти каждому четвёртому врачу больше 55 лет, плотность врачей в Европе в 13 раз выше, чем в Африке — https://www.who.int/news/item/18-09-2026-one-in-four-doctors-nearing-retirement-age-as-who-warns-of-global-health-workforce-gap

Интерфакс, «В Минздраве РФ оценили дефицит врачей более чем в 23 тыс. человек», слова министра здравоохранения М. Мурашко. Дефицит врачей почти 23,3 тыс. человек — https://www.interfax.ru/russia/1010663

Olson K. D. и соавторы, «Use of Ambient AI Scribes to Reduce Administrative Burden and Professional Burnout», JAMA Network Open, 2025, 8(10):e2534976. Выгорание снизилось с 51,9 до 38,8 % за 30 дней — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839542

You J. и соавторы, Mass General Brigham и Emory Healthcare, «Ambient Documentation Technology in Clinician Experience of Documentation Burden and Burnout», JAMA Network Open, 2025, 8(8):e2528056. Доля выгоревших в Mass General Brigham снизилась с 52,6 до 30,7 % за 84 дня — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2837847

«Use of an AI Scribe and Electronic Health Record Efficiency», JAMA Network Open, октябрь 2025. Время в электронной карте сократилось на 8,5 %, это около 2,4 минуты на приём — https://pmc.ncbi.nlm.nih.gov/articles/PMC12514625/

«Medical Scribe and Ambient Artificial Intelligence Impact on Emergency Physician Documentation Burden and Clinical Productivity», Annals of Emergency Medicine, 2026. ИИ-писарь сократил время на заметку на 1,6 минуты, человек-помощник на 3,3 минуты, выработка за час смены не отличалась — https://www.annemergmed.com/article/S0196-0644(26)00266-0/abstract

Исследования ИИ-писарей проведены в американских клиниках и не переносятся на российские напрямую.$s$,
updated_at = now()
WHERE slug = 'nehvatka-vrachej-prichiny-prognoz';

UPDATE articles
SET body = replace(replace(body,
  '50 млн вопросов о здоровье в день)',
  '50 млн вопросов о здоровье в день) — https://microsoft.ai/news/health-check-how-people-use-copilot-for-health/'),
  'задают вопросы о здоровье' || E'\n\n',
  'задают вопросы о здоровье — https://openai.com/index/introducing-chatgpt-health/' || E'\n\n')
WHERE slug = 'ai-konsultanty-po-zdorovyu-v-mire';