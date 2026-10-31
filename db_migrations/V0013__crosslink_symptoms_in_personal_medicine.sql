UPDATE articles SET body = regexp_replace(body, E'(Читайте также: [^\n]*?) и (\\[[^\n]*)\\.\n', E'\\1, \\2 и [Какие анализы сдать, если что-то не так](/articles/kakie-analizy-sdat-po-simptomam).\n')
WHERE slug = 'personalnaya-medicina-i-ii-nablyudenie-za-zdorovem'
AND body NOT LIKE '%/articles/kakie-analizy-sdat-po-simptomam%';