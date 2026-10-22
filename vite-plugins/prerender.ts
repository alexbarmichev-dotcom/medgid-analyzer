import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { ARTICLES } from '../src/data/articles';
import { FAQ_GROUPS } from '../src/data/faq';
import { CALC_DESC, CALC_FAQ, CALC_H1, CALC_LEAD, CALC_PATH, CALC_TITLE, COEF_ROWS, EXAMPLE_ROWS } from '../src/data/unitCalc';
import { REF_BASE, REF_DISCLAIMER, REF_HUB_DESC, REF_HUB_H1, REF_HUB_LEAD, REF_HUB_TITLE, REF_PAGES, refPath } from '../src/data/reference';
import { BRAND_ALIASES, BRAND_TEXT, BRAND_TITLE } from '../src/data/brand';
import { ABOUT_LEAD, ABOUT_SECTIONS } from '../src/data/about';

const SITE = 'https://лаб-гид.рф';

const LOGO =
  'https://cdn.poehali.dev/projects/a50bf440-39eb-48cd-8c9b-26529e75ba50/bucket/4f83188a-9df1-4eba-ac26-2ef05362e375.jpg';

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'ЛабГид',
  alternateName: BRAND_ALIASES,
  url: `${SITE}/`,
  logo: LOGO,
  description:
    'Сервис расшифровки анализов онлайн простым языком: объясняет показатели, оценивает отклонения от нормы и готовит вопросы для врача.',
  areaServed: 'RU',
  availableLanguage: 'ru',
};

const breadcrumbs = (items: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: `${SITE}${it.path}`,
  })),
});

const ldScripts = (items: object[]) =>
  items
    .map(
      (o) =>
        `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...o }).replace(/</g, '\\u003c')}</script>`
    )
    .join('\n');

const LD_BLOCK = /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const nav = `<header><a href="/">ЛабГид</a><nav><a href="/#how">Как это работает</a> <a href="/#pricing">Тарифы</a> <a href="/blog">Статьи</a> <a href="/spravochnik">Справочник</a> <a href="/about">О сервисе</a> <a href="/faq">Частые вопросы</a></nav></header>`;
const footer = `<footer><p>ЛабГид — информационный сервис. Не ставит диагноз и не заменяет консультацию врача.</p></footer>`;

const faqHtml = (withTitle: boolean) =>
  `<section id="faq">${withTitle ? '<h2>Частые вопросы</h2>' : ''}${FAQ_GROUPS.map(
    (g) =>
      `<h${withTitle ? 3 : 2}>${esc(g.title)}</h${withTitle ? 3 : 2}>${g.items
        .map((i) => `<h${withTitle ? 4 : 3}>${esc(i.q)}</h${withTitle ? 4 : 3}><p>${esc(i.a)}</p>`)
        .join('')}`
  ).join('')}</section>`;

const homeBody = () =>
  `${nav}<main>
<h1>ЛабГид — расшифровка анализов онлайн простым языком</h1>
<p>Пришли результаты анализов из лаборатории — и что с этим делать? ЛабГид — сервис расшифровки анализов онлайн: разбирает каждый показатель отдельно, что означает, почему отклонился и о чём спросить врача на приёме.</p>
<ul><li>Данные на серверах в России, 152-ФЗ</li><li>Без ФИО и полиса</li><li>Не ставит диагноз — готовит к приёму</li></ul>
<section id="how"><h2>Как это работает: три шага от фото до ясности</h2>
<h3>Загружаете анализы</h3><p>Отправьте скан или фото результатов: общий и биохимический анализ крови, гормоны щитовидной железы, витамины, анализ мочи, копрограмму и другие. Укажите возраст, пол и текущие жалобы.</p>
<h3>Искусственный интеллект анализирует данные</h3><p>Запрос обрабатывается нейросетью, обученной на медицинских данных. Анализ занимает считанные секунды.</p>
<h3>Получаете понятное резюме</h3><p>Каждый показатель разбирается отдельно: что означает, почему важен, в какую сторону отклоняется. Плюс рекомендации по дополнительным исследованиям и готовый список вопросов для врача.</p></section>
<section id="features"><h2>Что вы получаете</h2><ul>
<li>Понимание каждого показателя</li><li>Оценка с учётом возраста, пола и индивидуальных факторов</li><li>Доступное объяснение отклонений без постановки диагноза</li><li>Готовые вопросы для врача</li><li>Личный дневник здоровья с графиками динамики</li></ul></section>
<section id="pricing"><h2>Тарифы</h2><p>Разбор одного анализа — 150 рублей, без подписок и скрытых платежей. Также доступна подписка на 12 месяцев с медицинским дневником, графиками динамики и AI-чатом.</p></section>
<section id="security"><h2>Безопасность данных</h2><p>Файлы передаются по защищённому соединению. Вся база хранится на серверах на территории РФ в соответствии с 152-ФЗ. Мы не запрашиваем ФИО, адрес и номер полиса. Историю исследований можно удалить в любой момент.</p></section>
<section id="articles"><h2>Статьи о здоровье и анализах</h2><ul>${ARTICLES.filter((a) => !a.hideOnHome).map(
    (a) => `<li><a href="/articles/${a.slug}"><h3>${esc(a.title)}</h3></a><p>${esc(a.excerpt)}</p></li>`
  ).join('')}</ul></section>
${faqHtml(true)}
<p><a href="/faq">Все ответы на вопросы</a></p>
<section id="brand-name"><h2>${esc(BRAND_TITLE)}</h2>${BRAND_TEXT.map((t) => `<p>${esc(t)}</p>`).join('')}</section>
</main>${footer}`;

const blogBody = () =>
  `${nav}<main><h1>Блог о здоровье и анализах</h1><ul>${ARTICLES.map(
    (a) => `<li><a href="/articles/${a.slug}"><h2>${esc(a.title)}</h2></a><p>${esc(a.excerpt)}</p></li>`
  ).join('')}</ul></main>${footer}`;

const faqBody = () =>
  `${nav}<main><h1>Частые вопросы о расшифровке анализов</h1>${faqHtml(false)}</main>${footer}`;

const aboutBody = () =>
  `${nav}<main><h1>О сервисе ЛабГид</h1><p>${esc(ABOUT_LEAD)}</p>${ABOUT_SECTIONS.map(
    (x) => `<section><h2>${esc(x.title)}</h2>${x.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}</section>`
  ).join('')}</main>${footer}`;

const articleBody = (slug: string) => {
  const a = ARTICLES.find((x) => x.slug === slug)!;
  return `${nav}<main><article><h1>${esc(a.title)}</h1>${a.subtitle ? `<p><em>${esc(a.subtitle)}</em></p>` : ''}<p>Автор: ${esc(a.author)}</p>${a.paragraphs
    .map((p) =>
      p.startsWith('| ')
        ? `<table>${p
            .split('\n')
            .map((r) => `<tr>${r.replace(/^\|\s*/, '').split(' | ').map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
            .join('')}</table>`
        : p.startsWith('### ')
        ? `<h3>${esc(p.slice(4))}</h3>`
        : p.startsWith('## ')
          ? `<h2>${esc(p.slice(3))}</h2>`
          : `<p>${esc(p)}</p>`
    )
    .join('')}<p><a href="/#try">Расшифровать свой анализ — 150 ₽</a></p>${
    a.refSlugs?.length
      ? `<section><h2>Нормы показателей из этой статьи</h2><ul>${a.refSlugs
          .map((x) => REF_PAGES.find((r) => r.slug === x))
          .filter(Boolean)
          .map((r) => `<li><a href="${refPath(r!.slug)}">${esc(r!.seoTitle)}</a></li>`)
          .join('')}</ul></section>`
      : ''
  }<section><h2>Читайте также</h2><ul>${[1, 2, 3]
    .map((n) => ARTICLES[(ARTICLES.indexOf(a) + n) % ARTICLES.length])
    .filter((r) => r.slug !== a.slug)
    .map((r) => `<li><a href="/articles/${r.slug}">${esc(r.title)}</a></li>`)
    .join('')}</ul></section></article></main>${footer}`;
};

const withMeta = (
  html: string,
  body: string,
  title: string,
  description: string,
  urlPath: string,
  ld?: object[],
  image?: string
) => {
  const url = `${SITE}${urlPath}`;
  let out = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  out = out.replace(
    /(<meta name="description" content=")[\s\S]*?(")/,
    `$1${esc(description)}$2`
  );
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  out = out.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  out = out.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  out = out.replace(
    /(<meta property="og:description" content=")[\s\S]*?(")/,
    `$1${esc(description)}$2`
  );
  if (image) {
    out = out.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`);
    out = out.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`);
  }
  if (ld) {
    out = out.replace(LD_BLOCK, '');
    out = out.replace('</head>', `${ldScripts(ld)}\n</head>`);
  }
  return out;
};

const write = (dir: string, rel: string, content: string) => {
  const file = path.join(dir, rel, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const calcBody = () => {
  const tbl = (head: string[], rows: string[][]) =>
    `<table><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
      .join('')}</table>`;
  return `${nav}<main><h1>${esc(CALC_H1)}</h1><p>${esc(CALC_LEAD)}</p><h2>Коэффициенты перевода</h2>${tbl(
    ['Показатель', 'ммоль/л → мг/дл', 'мг/дл → ммоль/л'],
    COEF_ROWS
  )}<h2>Примеры</h2>${tbl(['Показатель', 'ммоль/л', 'мг/дл'], EXAMPLE_ROWS)}<h2>Частые вопросы</h2>${CALC_FAQ.map(
    ([q, a]) => `<p><b>${esc(q)}</b> ${esc(a)}</p>`
  ).join('')}<p><a href="/#try">Загрузить бланк</a></p></main>${footer}`;
};

const refTbl = (head: string[], rows: string[][]) =>
  `<table><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</table>`;
const refList = (title: string, items: string[]) =>
  `<h2>${esc(title)}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

const refHubBody = () =>
  `${nav}<main><h1>${esc(REF_HUB_H1)}</h1><p>${esc(REF_HUB_LEAD)}</p><ul>${REF_PAGES.map(
    (p) => `<li><a href="${refPath(p.slug)}">${esc(p.seoTitle)}</a></li>`
  ).join('')}<li><a href="${CALC_PATH}">Калькулятор единиц анализов</a></li></ul><p>${esc(REF_DISCLAIMER)}</p></main>${footer}`;

const refPageBody = (p: (typeof REF_PAGES)[number]) =>
  `${nav}<main><h1>${esc(p.h1)}</h1><p>${esc(p.lead)}</p>${p.tables
    .map((t) => `<h2>${esc(t.title)}</h2>${refTbl(t.head, t.rows)}`)
    .join('')}${p.calc ? `<p><a href="${CALC_PATH}">Перевести единицы в калькуляторе</a></p>` : ''}${
    p.low ? refList(p.low.title, p.low.items) : ''
  }${refList(p.high.title, p.high.items)}<h2>Как подготовиться к анализу</h2><p>${esc(p.prep)}</p><h2>Частые вопросы</h2>${p.faq
    .map(([q, a]) => `<p><b>${esc(q)}</b> ${esc(a)}</p>`)
    .join('')}<p><a href="/#try">Расшифровать свой анализ — 150 ₽</a></p><p>${REF_PAGES.filter((x) => x.slug !== p.slug)
    .map((x) => `<a href="${refPath(x.slug)}">${esc(x.short)}</a>`)
    .join(' ')}</p><p>${esc(REF_DISCLAIMER)}</p></main>${footer}`;

const faqEntities = () =>
  FAQ_GROUPS.flatMap((g) =>
    g.items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    }))
  );

const homeLd = (base: string) => {
  const blocks = [...base.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    const o = JSON.parse(m[1]);
    delete o['@context'];
    return o;
  });
  const keep = blocks.filter((b) => b['@type'] === 'MedicalWebPage' || b['@type'] === 'FAQPage');
  return [
    ORG,
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'ЛабГид',
      inLanguage: 'ru-RU',
      publisher: { '@id': `${SITE}/#organization` },
    },
    ...keep,
  ];
};

export default function prerender(): Plugin {
  let outDir = 'dist';
  return {
    name: 'static-prerender',
    apply: 'build',
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const base = fs.readFileSync(indexPath, 'utf-8');
      const homeTitle = (base.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'ЛабГид';
      const homeDesc =
        'ЛабГид объясняет каждый показатель анализов простым языком, оценивает отклонения от нормы и готовит список вопросов для врача.';

      fs.writeFileSync(indexPath, withMeta(base, homeBody(), homeTitle, homeDesc, '/', homeLd(base)));

      write(
        outDir,
        'faq',
        withMeta(
          base,
          faqBody(),
          'Частые вопросы о расшифровке анализов — ЛабГид',
          'Ответы на частые вопросы о сервисе ЛабГид: как расшифровать анализы онлайн, сколько это стоит, какие данные учитываются и как обеспечивается безопасность.',
          '/faq',
          [
            ORG,
            breadcrumbs([
              { name: 'Главная', path: '/' },
              { name: 'Частые вопросы', path: '/faq' },
            ]),
            { '@type': 'FAQPage', mainEntity: faqEntities() },
          ]
        )
      );

      write(
        outDir,
        REF_BASE.slice(1),
        withMeta(base, refHubBody(), `${REF_HUB_TITLE} — ЛабГид`, REF_HUB_DESC, REF_BASE, [
          ORG,
          breadcrumbs([
            { name: 'Главная', path: '/' },
            { name: 'Справочник', path: REF_BASE },
          ]),
        ])
      );

      REF_PAGES.forEach((p) =>
        write(
          outDir,
          refPath(p.slug).slice(1),
          withMeta(base, refPageBody(p), `${p.seoTitle} — ЛабГид`, p.description, refPath(p.slug), [
            ORG,
            breadcrumbs([
              { name: 'Главная', path: '/' },
              { name: 'Справочник', path: REF_BASE },
              { name: p.short, path: refPath(p.slug) },
            ]),
            {
              '@type': 'FAQPage',
              mainEntity: p.faq.map(([q, a]) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
          ])
        )
      );

      write(
        outDir,
        CALC_PATH.slice(1),
        withMeta(base, calcBody(), `${CALC_TITLE} — ЛабГид`, CALC_DESC, CALC_PATH, [
          ORG,
          breadcrumbs([
            { name: 'Главная', path: '/' },
            { name: 'Калькулятор единиц', path: CALC_PATH },
          ]),
          {
            '@type': 'WebApplication',
            name: 'Калькулятор единиц анализов',
            url: `${SITE}${CALC_PATH}`,
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Web',
            inLanguage: 'ru',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: CALC_FAQ.map(([q, a]) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          },
        ])
      );

      write(
        outDir,
        'blog',
        withMeta(
          base,
          blogBody(),
          'Блог о здоровье и анализах — ЛабГид',
          'Статьи о здоровье, лабораторных анализах и разговоре с врачом: простым языком о том, как понимать свои результаты.',
          '/blog',
          [
            ORG,
            breadcrumbs([
              { name: 'Главная', path: '/' },
              { name: 'Блог', path: '/blog' },
            ]),
          ]
        )
      );

      write(
        outDir,
        'about',
        withMeta(
          base,
          aboutBody(),
          'О сервисе ЛабГид — расшифровка анализов онлайн',
          'ЛабГид — сервис расшифровки анализов простым языком: что умеет, для кого, сколько стоит, как защищены данные и чего сервис не делает.',
          '/about',
          [
            ORG,
            breadcrumbs([
              { name: 'Главная', path: '/' },
              { name: 'О сервисе', path: '/about' },
            ]),
            {
              '@type': 'AboutPage',
              name: 'О сервисе ЛабГид',
              url: `${SITE}/about`,
              inLanguage: 'ru-RU',
              description: ABOUT_LEAD,
              about: { '@id': `${SITE}/#organization` },
            },
          ]
        )
      );

      ARTICLES.forEach((a) =>
        (a.oldSlugs ?? []).forEach((old) => {
          const to = `${SITE}/articles/${a.slug}`;
          write(
            outDir,
            `articles/${old}`,
            `<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><title>${esc(a.title)} — ЛабГид</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=/articles/${a.slug}"><script>location.replace('/articles/${a.slug}'+location.search+location.hash)</script></head><body><p>Статья переехала: <a href="/articles/${a.slug}">${esc(a.title)}</a></p></body></html>\n`
          );
        })
      );

      ARTICLES.forEach((a) =>
        write(
          outDir,
          `articles/${a.slug}`,
          withMeta(
            base,
            articleBody(a.slug),
            `${a.seoTitle ?? a.title} — ЛабГид`,
            a.seoDescription ?? a.excerpt.slice(0, 160),
            `/articles/${a.slug}`,
            [
              ORG,
              breadcrumbs([
                { name: 'Главная', path: '/' },
                { name: 'Статьи', path: '/blog' },
                { name: a.title, path: `/articles/${a.slug}` },
              ]),
              {
                '@type': 'Article',
                headline: a.title,
                ...(a.subtitle ? { alternativeHeadline: a.subtitle } : {}),
                description: a.seoDescription ?? a.excerpt.slice(0, 160),
                inLanguage: 'ru-RU',
                url: `${SITE}/articles/${a.slug}`,
                mainEntityOfPage: `${SITE}/articles/${a.slug}`,
                image: a.cover ? [a.cover] : [LOGO],
                author: { '@type': 'Person', name: a.author },
                publisher: { '@id': `${SITE}/#organization` },
                ...(a.datePublished ? { datePublished: a.datePublished } : {}),
                dateModified: a.datePublished ?? '2026-10-08',
              },
            ],
            a.cover
          )
        )
      );

      const today = new Date().toISOString().slice(0, 10);
      const latest = ARTICLES.map((a) => a.datePublished ?? '').sort().pop() || today;
      const urls = [
        { loc: '/', freq: 'weekly', prio: '1.0', mod: latest },
        { loc: '/faq', freq: 'monthly', prio: '0.8', mod: today },
        { loc: '/about', freq: 'monthly', prio: '0.7', mod: today },
        { loc: '/blog', freq: 'weekly', prio: '0.8', mod: latest },
        { loc: REF_BASE, freq: 'monthly', prio: '0.8', mod: today },
        ...REF_PAGES.map((p) => ({ loc: refPath(p.slug), freq: 'monthly', prio: '0.7', mod: today })),
        { loc: CALC_PATH, freq: 'monthly', prio: '0.7', mod: today },
        ...ARTICLES.map((a) => ({ loc: `/articles/${a.slug}`, freq: 'monthly', prio: '0.6', mod: a.datePublished ?? today })),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map(
          (u) =>
            `  <url>\n    <loc>${SITE}${u.loc}</loc>\n    <lastmod>${u.mod}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.prio}</priority>\n  </url>`
        )
        .join('\n')}\n</urlset>\n`;
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
    },
  };
}
