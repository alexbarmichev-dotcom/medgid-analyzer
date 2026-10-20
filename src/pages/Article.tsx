import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import { ARTICLES } from '@/data/articles';
import { useNoindex } from '@/hooks/useNoindex';

const URL_RE = /(https?:\/\/[^\s,]+)/g;

const renderWithLinks = (text: string) =>
  text.split(URL_RE).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-accent underline underline-offset-2 hover:text-hand"
      >
        {part.replace(/^https?:\/\//, '').replace(/\/$/, '')}
      </a>
    ) : (
      part
    ),
  );

const renderTable = (p: string, i: number) => {
  const rows = p.split('\n').map((r) => r.replace(/^\|\s*/, '').split(' | '));
  const [head, ...body] = rows;
  return (
    <div key={i} className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-left text-[0.95rem]">
        <thead className="bg-hand/10 text-foreground">
          <tr>
            {head.map((c, j) => (
              <th key={j} className="px-4 py-3 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, k) => (
            <tr key={k} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-foreground' : ''}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderParagraph = (p: string, i: number) => {
  if (p.startsWith('| ')) return renderTable(p, i);
  if (p.startsWith('### ')) {
    return (
      <h3 key={i} className="pt-2 font-head text-lg font-bold text-foreground">
        {p.slice(4)}
      </h3>
    );
  }
  if (p.startsWith('## ')) {
    return (
      <h2 key={i} className="pt-4 font-head text-2xl font-extrabold leading-tight text-foreground">
        {p.slice(3)}
      </h2>
    );
  }
  return <p key={i}>{renderWithLinks(p)}</p>;
};

const Article = () => {
  const { slug } = useParams();
  const article = ARTICLES.find((a) => a.slug === slug);
  useNoindex(!article);
  const related = ARTICLES.filter((a) => a.slug !== slug).slice(0, 4);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    const prevTitle = document.title;
    document.title = `${article.title} — ЛабГид`;
    return () => {
      document.title = prevTitle;
    };
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background font-body text-foreground">
        <Header />
        <main className="mx-auto max-w-3xl px-5 py-24 text-center md:px-8">
          <h1 className="font-head text-2xl font-extrabold">Статья не найдена</h1>
          <p className="mt-4 text-ink-soft">
            Возможно, она была перемещена или удалена.
          </p>
          <Link to="/" className="mt-6 inline-block text-accent hover:underline">
            Вернуться на главную
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <article className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
          <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Главная</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-accent">Статьи</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{article.title}</span>
          </nav>

          <h1 className="font-head text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
            {article.title}
          </h1>

          {article.cover && (
            <img
              src={article.coverWeb ?? article.cover}
              alt={article.title}
              width={900}
              height={508}
              fetchPriority="high"
              className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover"
            />
          )}

          <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed text-ink-soft">
            {article.paragraphs.map((p, i) => {
              if (i === Math.floor(article.paragraphs.length / 2)) {
                return (
                  <div key={i} className="space-y-5">
                    <aside className="flex flex-col items-start gap-4 rounded-3xl border border-accent/25 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[0.95rem] leading-snug text-foreground">
                        <strong>Есть бланк анализа на руках?</strong> Загрузите фото — разбор и вопросы для врача за 30–60 секунд, 150 ₽.
                      </p>
                      <Link
                        to="/#try"
                        className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius)] bg-hand px-5 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
                      >
                        Расшифровать анализ
                        <Icon name="ArrowRight" size={16} />
                      </Link>
                    </aside>
                    {renderParagraph(p, i)}
                  </div>
                );
              }
              return renderParagraph(p, i);
            })}
          </div>
          <p className="mt-10 font-caveat text-2xl text-hand">
            {article.author}
            {article.datePublished && (
              <span className="ml-3 font-body text-base text-muted-foreground">
                {article.datePublished.split('-').reverse().map((v, i) => (i === 2 ? v.slice(2) : v)).join('.')}
              </span>
            )}
          </p>

          <div className="mt-12 overflow-hidden rounded-3xl bg-hand p-7 text-center text-accent-foreground shadow-lg md:p-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
              <Icon name="FileSearch" size={28} />
            </span>
            <h2 className="mt-4 font-head text-2xl font-extrabold leading-tight sm:text-3xl">
              Придите к врачу подготовленным
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[1rem] leading-relaxed opacity-90">
              Сфотографируйте бланк — получите понятный разбор каждого показателя и список вопросов
              для врача за 30–60 секунд.
            </p>
            <Link
              to="/#try"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius)] bg-foreground px-7 py-4 text-base font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              Расшифровать свой анализ — 150&nbsp;₽
              <Icon name="ArrowRight" size={18} />
            </Link>
            <p className="mt-3 text-sm opacity-80">Без регистрации и подписки</p>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-5 font-head text-xl font-bold sm:text-2xl">Читайте также</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {related.map((a) => (
                  <Link
                    key={a.slug}
                    to={`/articles/${a.slug}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform hover:-translate-y-1"
                  >
                    {a.cover && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={a.coverWeb ?? a.cover}
                          alt={a.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-head text-base font-bold leading-snug">{a.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                      {a.excerpt}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-accent">
                      Читать
                      <Icon
                        name="ArrowRight"
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Link
            to="/"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
          >
            ← Вернуться на главную
          </Link>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Article;