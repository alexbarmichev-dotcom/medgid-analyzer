import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { ARTICLES } from '../src/data/articles';
import { FAQ_GROUPS } from '../src/data/faq';

const SITE = 'https://лаб-гид.рф';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const nav = `<header><a href="/">ЛабГид</a><nav><a href="/#how">Как это работает</a> <a href="/#pricing">Тарифы</a> <a href="/#articles">Статьи</a> <a href="/faq">Частые вопросы</a></nav></header>`;
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
<section id="articles"><h2>Статьи о здоровье и анализах</h2><ul>${ARTICLES.map(
    (a) => `<li><a href="/articles/${a.slug}"><h3>${esc(a.title)}</h3></a><p>${esc(a.excerpt)}</p></li>`
  ).join('')}</ul></section>
${faqHtml(true)}
<p><a href="/faq">Все ответы на вопросы</a></p>
</main>${footer}`;

const faqBody = () =>
  `${nav}<main><h1>Частые вопросы о расшифровке анализов</h1>${faqHtml(false)}</main>${footer}`;

const articleBody = (slug: string) => {
  const a = ARTICLES.find((x) => x.slug === slug)!;
  return `${nav}<main><article><h1>${esc(a.title)}</h1><p>Автор: ${esc(a.author)}</p>${a.paragraphs
    .map((p) => `<p>${esc(p)}</p>`)
    .join('')}</article></main>${footer}`;
};

const withMeta = (html: string, body: string, title: string, description: string, urlPath: string) => {
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
  return out;
};

const write = (dir: string, rel: string, content: string) => {
  const file = path.join(dir, rel, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

export default function prerender(): Plugin {
  let outDir = 'dist';
  let root = process.cwd();
  return {
    name: 'static-prerender',
    apply: 'build',
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
      root = cfg.root;
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const base = fs.readFileSync(indexPath, 'utf-8');
      const homeTitle = (base.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'ЛабГид';
      const homeDesc =
        'ЛабГид объясняет каждый показатель анализов простым языком, оценивает отклонения от нормы и готовит список вопросов для врача.';

      fs.writeFileSync(indexPath, withMeta(base, homeBody(), homeTitle, homeDesc, '/'));

      write(
        outDir,
        'faq',
        withMeta(
          base,
          faqBody(),
          'Частые вопросы о расшифровке анализов — ЛабГид',
          'Ответы на частые вопросы о сервисе ЛабГид: как расшифровать анализы онлайн, сколько это стоит, какие данные учитываются и как обеспечивается безопасность.',
          '/faq'
        )
      );

      ARTICLES.forEach((a) =>
        write(
          outDir,
          `articles/${a.slug}`,
          withMeta(
            base,
            articleBody(a.slug),
            `${a.title} — ЛабГид`,
            a.excerpt.slice(0, 200),
            `/articles/${a.slug}`
          )
        )
      );

      const sitemap = path.join(root, 'public', 'sitemap.xml');
      if (fs.existsSync(sitemap)) fs.copyFileSync(sitemap, path.join(outDir, 'sitemap.xml'));
    },
  };
}
