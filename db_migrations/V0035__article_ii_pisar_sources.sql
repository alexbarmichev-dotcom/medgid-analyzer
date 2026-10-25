UPDATE articles
SET body = body || $s$

## Источники

Исследование Йельской школы медицины, «Use of Ambient AI Scribes to Reduce Administrative Burden and Professional Burnout», JAMA Network Open, 2025. Выгорание снизилось с 51,9 до 38,8 % за 30 дней, исследование охватило 263 врача в шести системах здравоохранения — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839542

Mass General Brigham, «Ambient Documentation Technology in Clinician Experience of Documentation Burden and Burnout», JAMA Network Open, 2025. Доля выгоревших снизилась с 52,6 до 30,7 % — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2837847

Pearlman и соавторы, «Use of an AI Scribe and Electronic Health Record Efficiency», JAMA Network Open, 2025. Время работы с картой сократилось на 8,5 %, это около 2,4 минуты за приём — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839929

«Medical Scribe and Ambient Artificial Intelligence Impact on Emergency Physician Documentation Burden and Clinical Productivity», Annals of Emergency Medicine, июнь 2026. ИИ-писарь сократил время на заметку на 1,6 минуты, человек-помощник на 3,3 минуты, часовая выработка не изменилась — https://www.annemergmed.com/article/S0196-0644(26)00266-0/abstract

Исследования проведены в американских клиниках и не переносятся на российские напрямую. Цифры о времени приёма, доле документации и оценке Счётной палаты приведены по сообщениям Минздрава и СМИ.$s$,
updated_at = now()
WHERE slug = 'ii-pisar-vracha-kak-rabotaet';

UPDATE articles
SET body = replace(replace(replace(replace(replace(body,
  'Olson K. D. и соавторы, «Use of Ambient AI Scribes to Reduce Administrative Burden and Professional Burnout», JAMA Network Open, 2025, 8(10):e2534976.',
  'Исследование Йельской школы медицины, «Use of Ambient AI Scribes to Reduce Administrative Burden and Professional Burnout», JAMA Network Open, 2025.'),
  'You J. и соавторы, Mass General Brigham и Emory Healthcare, «Ambient Documentation Technology in Clinician Experience of Documentation Burden and Burnout», JAMA Network Open, 2025, 8(8):e2528056.',
  'Mass General Brigham, «Ambient Documentation Technology in Clinician Experience of Documentation Burden and Burnout», JAMA Network Open, 2025.'),
  'Pearlman K. и соавторы, «Use of an AI Scribe and Electronic Health Record Efficiency», JAMA Network Open, 2025, 8(10):e2537000.',
  'Pearlman и соавторы, «Use of an AI Scribe and Electronic Health Record Efficiency», JAMA Network Open, 2025.'),
  'Выгорание снизилось с 51,9 до 38,8 % за 30 дней — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839542',
  'Выгорание снизилось с 51,9 до 38,8 % за 30 дней — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839542'),
  'Доля выгоревших в Mass General Brigham снизилась', 'Доля выгоревших снизилась'),
updated_at = now()
WHERE slug = 'nehvatka-vrachej-prichiny-prognoz';