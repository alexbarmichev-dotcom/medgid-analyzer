UPDATE articles SET body = replace(body, E'## Что делать с результатами', E'Читайте также: [Общие вопросы про анализы: 10 ответов простым языком](/articles/obshchie-voprosy-pro-analizy), [Расшифровка общего анализа крови](/articles/rasshifrovka-obshchego-analiza-krovi) и [Биохимический анализ крови: расшифровка показателей](/articles/biokhimicheskiy-analiz-krovi-rasshifrovka).\n\n## Что делать с результатами')
WHERE slug = 'kakie-analizy-sdat-po-simptomam' AND body NOT LIKE '%Читайте также:%';

UPDATE articles SET body = regexp_replace(body, E'(Читайте также: [^\n]*?) и (\\[[^\n]*)\\.\n', E'\\1, \\2 и [Какие анализы сдать, если что-то не так](/articles/kakie-analizy-sdat-po-simptomam).\n')
WHERE slug IN ('rasshifrovka-obshchego-analiza-krovi', 'biokhimicheskiy-analiz-krovi-rasshifrovka', 'preddiabet-kak-uznat-po-analizam', 'podgotovka-k-priemu-vracha', 'obshchie-voprosy-pro-analizy')
AND body NOT LIKE '%/articles/kakie-analizy-sdat-po-simptomam%';