UPDATE articles SET body = regexp_replace(body, E'(Читайте также: [^\n]*?) и (\\[[^\n]*)\\.\n', E'\\1, \\2 и [Какие анализы сдать, если что-то не так](/articles/kakie-analizy-sdat-po-simptomam).\n')
WHERE slug = 'skolko-parametrov-v-krovi-pochemu-issleduyut-ne-vse'
AND body NOT LIKE '%/articles/kakie-analizy-sdat-po-simptomam%';