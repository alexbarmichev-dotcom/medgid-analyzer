UPDATE articles
SET body = replace(
  body,
  '«Use of an AI Scribe and Electronic Health Record Efficiency», JAMA Network Open, октябрь 2025. Время в электронной карте сократилось на 8,5 %, это около 2,4 минуты на приём — https://pmc.ncbi.nlm.nih.gov/articles/PMC12514625/',
  'Pearlman K. и соавторы, «Use of an AI Scribe and Electronic Health Record Efficiency», JAMA Network Open, 2025, 8(10):e2537000. Время в электронной карте сократилось на 8,5 %, это 2,4 минуты на приём — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839929'
),
updated_at = now()
WHERE slug = 'nehvatka-vrachej-prichiny-prognoz';