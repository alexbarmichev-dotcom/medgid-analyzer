UPDATE articles
SET body = body || $s$

## Источники

ВОЗ, «Один из четырёх врачей приближается к пенсионному возрасту: ВОЗ предупреждает о глобальном разрыве в кадрах здравоохранения», 18 сентября 2026 года (рост плотности медработников на 52 %, дефицит 11,1 млн к 2030 году, 67 стран, разница в 13 раз между Европой и Африкой) — https://www.who.int/news/item/18-09-2026-one-in-four-doctors-nearing-retirement-age-as-who-warns-of-global-health-workforce-gap

Интерфакс, «В Минздраве РФ оценили дефицит врачей более чем в 23 тыс. человек», слова министра здравоохранения М. Мурашко (23 297 врачей, около 63,5 тыс. среднего персонала, рост числа врачей с 541,5 до почти 558 тыс.) — https://www.interfax.ru/russia/1010663

Olson K. D. и соавторы, Yale School of Medicine, «Use of Ambient AI Scribes to Reduce Administrative Burden and Professional Burnout», JAMA Network Open, 2025 (выгорание снизилось с 51,9 до 38,8 % за 30 дней) — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839542

You J. и соавторы, Mass General Brigham и Emory Healthcare, «Ambient Documentation Technology in Clinician Experience of Documentation Burden and Burnout», JAMA Network Open, 2025 (выгорание снизилось с 52,6 до 30,7 % за 84 дня) — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2837847

Dutta и соавторы, «Medical Scribe and Ambient Artificial Intelligence Impact on Emergency Physician Documentation Burden and Clinical Productivity», Annals of Emergency Medicine, 2026 (1,6 минуты против 3,3 минуты на заметку, выработка не изменилась) — https://www.annemergmed.com/article/S0196-0644(26)00266-0/abstract

Данные Минздрава о возрасте врачей, разнице между регионами и цели закрыть дефицит на 95 % к 2030 году, а также слова вице-премьера Голиковой о приросте врачей приведены по сообщениям ведомств и СМИ. Результаты исследований ИИ-писарей относятся к американским клиникам и не переносятся на российские напрямую.$s$,
updated_at = now()
WHERE slug = 'nehvatka-vrachej-prichiny-prognoz';