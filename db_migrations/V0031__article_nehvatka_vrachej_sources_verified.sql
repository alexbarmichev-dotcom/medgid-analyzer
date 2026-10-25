UPDATE articles
SET body = left(body, strpos(body, E'\n\n## Источники') - 1) || $s$

## Источники

ВОЗ, доклад «National Health Workforce Accounts: Health Workforce Levels and Trends 2026» и пресс-релиз «One in four doctors nearing retirement age as WHO warns of global health workforce gap», 18 сентября 2026 года. Рост плотности медработников на 52 % (с 44,8 до 67,9 на 10 тыс. человек), прогноз дефицита 11,1 млн к 2030 году, 67 стран, разница в 13 раз между Европой и Африкой, почти каждому четвёртому врачу больше 55 лет — https://www.who.int/news/item/18-09-2026-one-in-four-doctors-nearing-retirement-age-as-who-warns-of-global-health-workforce-gap

Интерфакс, «В Минздраве РФ оценили дефицит врачей более чем в 23 тыс. человек», слова министра здравоохранения М. Мурашко. Дефицит врачей почти 23,3 тыс. человек, среднего медицинского персонала 63,5 тыс. человек — https://www.interfax.ru/russia/1010663

Olson K. D. и соавторы, Yale School of Medicine, «Use of Ambient AI Scribes to Reduce Administrative Burden and Professional Burnout», JAMA Network Open, 2025, 8(10):e2534976. Выгорание снизилось с 51,9 до 38,8 % за 30 дней — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839542

You J. G. и соавторы, Mass General Brigham и Emory Healthcare, «Ambient Documentation Technology in Clinician Experience of Documentation Burden and Burnout», JAMA Network Open, 2025, 8(8):e2528056. Доля выгоревших в Mass General Brigham снизилась с 52,6 до 30,7 % за 84 дня — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2837847

Dutta S. и соавторы, «Medical Scribe and Ambient Artificial Intelligence Impact on Emergency Physician Documentation Burden and Clinical Productivity», Annals of Emergency Medicine, июнь 2026. ИИ сократил время на заметку на 1,6 минуты, человек-помощник на 3,3 минуты, выработка за час смены не отличалась — https://www.annemergmed.com/article/S0196-0644(26)00266-0/abstract

Результаты исследований ИИ-писарей получены в американских клиниках и не переносятся на российские напрямую.$s$,
updated_at = now()
WHERE slug = 'nehvatka-vrachej-prichiny-prognoz';

UPDATE articles
SET body = replace(replace(body,
  ' — https://microsoft.ai/news/health-check-how-people-use-copilot-for-health/', ''),
  ' — https://openai.com/index/introducing-chatgpt-health/', '')
WHERE slug = 'ai-konsultanty-po-zdorovyu-v-mire';