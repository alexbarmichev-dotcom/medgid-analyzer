import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import RefTableView from '@/components/site/RefTableView';
import { REF_BASE, REF_DISCLAIMER, REF_PAGES, getRefPage, refPath } from '@/data/reference';
import { REF_MORE } from '@/data/referenceMore';
import { CALC_PATH } from '@/data/unitCalc';
import { useNoindex } from '@/hooks/useNoindex';
import NotFound from './NotFound';

const List = ({ title, items }: { title: string; items: string[] }) => (
  <>
    <h2 className="mt-10 font-head text-2xl font-extrabold">{title}</h2>
    <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-ink-soft">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  </>
);

const ReferencePage = () => {
  const { slug } = useParams();
  const page = getRefPage(slug);
  useNoindex(!page);

  useEffect(() => {
    if (!page) return;
    const prevTitle = document.title;
    document.title = `${page.seoTitle} — ЛабГид`;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.content ?? '';
    if (meta) meta.content = page.description;
    window.scrollTo({ top: 0 });
    return () => {
      document.title = prevTitle;
      if (meta) meta.content = prevDesc;
    };
  }, [page]);

  if (!page) return <NotFound />;
  const others = REF_PAGES.filter((p) => p.slug !== page.slug);
  const more = REF_MORE[page.slug];

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
          <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Главная</Link>
            <span className="mx-2">/</span>
            <Link to={REF_BASE} className="hover:text-accent">Справочник</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{page.short}</span>
          </nav>
          <h1 className="font-head text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
            {page.h1}
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">{page.lead}</p>

          {more && (
            <section>
              <h2 className="mt-10 font-head text-2xl font-extrabold">Что показывает анализ</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
                {more.about.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
            </section>
          )}

          {page.tables.map((t) => (
            <section key={t.title}>
              <h2 className="mt-10 font-head text-2xl font-extrabold">{t.title}</h2>
              <div className="mt-4">
                <RefTableView head={t.head} rows={t.rows} />
              </div>
            </section>
          ))}

          {page.calc && (
            <p className="mt-4 text-sm text-ink-soft">
              Бланк в мг/дл?{' '}
              <Link to={CALC_PATH} className="font-semibold text-accent hover:underline">
                Переведите единицы в калькуляторе
              </Link>
              .
            </p>
          )}

          {page.low && <List title={page.low.title} items={page.low.items} />}
          <List title={page.high.title} items={page.high.items} />

          {more && (
            <>
              <h2 className="mt-10 font-head text-2xl font-extrabold">Почему показатель повышен</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
                {more.highWhy.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              <h2 className="mt-10 font-head text-2xl font-extrabold">Почему показатель понижен</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
                {more.lowWhy.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              <List title="Что делать при отклонении от нормы" items={more.actions} />
              <h2 className="mt-10 font-head text-2xl font-extrabold">Что влияет на результат</h2>
              <p className="mt-4 leading-relaxed text-ink-soft">{more.factors}</p>
              <h2 className="mt-10 font-head text-2xl font-extrabold">Когда обратиться к врачу</h2>
              <p className="mt-4 leading-relaxed text-ink-soft">{more.doctor}</p>
            </>
          )}

          <h2 className="mt-10 font-head text-2xl font-extrabold">Как подготовиться к анализу</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">{page.prep}</p>

          <h2 className="mt-10 font-head text-2xl font-extrabold">Частые вопросы</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
            {page.faq.map(([q, a]) => (
              <p key={q}>
                <strong className="text-foreground">{q}</strong> {a}
              </p>
            ))}
          </div>

          <aside className="mt-10 flex flex-col items-start gap-4 rounded-3xl border border-accent/25 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.95rem] leading-snug text-foreground">
              <strong>Есть бланк на руках?</strong> Загрузите фото — разбор каждого показателя и вопросы для врача за 30–60 секунд.
            </p>
            <Link
              to="/#try"
              className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius)] bg-hand px-5 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              Расшифровать анализ
              <Icon name="ArrowRight" size={16} />
            </Link>
          </aside>

          <h2 className="mt-10 font-head text-xl font-bold">Другие нормы</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  to={refPath(p.slug)}
                  className="inline-block rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10"
                >
                  {p.short}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-muted-foreground">{REF_DISCLAIMER}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReferencePage;
