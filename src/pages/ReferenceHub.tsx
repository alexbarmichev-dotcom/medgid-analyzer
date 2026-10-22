import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import {
  REF_DISCLAIMER,
  REF_HUB_DESC,
  REF_HUB_H1,
  REF_HUB_LEAD,
  REF_HUB_TITLE,
  REF_PAGES,
  refPath,
} from '@/data/reference';
import { CALC_PATH } from '@/data/unitCalc';

const cardCls =
  'group flex flex-col rounded-3xl border border-border bg-card p-6 transition-transform hover:-translate-y-1';

const ReferenceHub = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${REF_HUB_TITLE} — ЛабГид`;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.content ?? '';
    if (meta) meta.content = REF_HUB_DESC;
    window.scrollTo({ top: 0 });
    return () => {
      document.title = prevTitle;
      if (meta) meta.content = prevDesc;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
          <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Главная</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Справочник</span>
          </nav>
          <h1 className="font-head text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
            {REF_HUB_H1}
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">{REF_HUB_LEAD}</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {REF_PAGES.map((p) => (
              <Link key={p.slug} to={refPath(p.slug)} className={cardCls}>
                <h2 className="font-head text-lg font-bold">{p.short}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{p.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-accent">
                  Смотреть нормы
                  <Icon name="ArrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
            <Link to={CALC_PATH} className={cardCls}>
              <h2 className="font-head text-lg font-bold">Калькулятор единиц</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Перевод ммоль/л в мг/дл и обратно для глюкозы, холестерина, креатинина и других показателей.
              </p>
              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-accent">
                Открыть
                <Icon name="ArrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          <p className="mt-10 text-sm text-muted-foreground">{REF_DISCLAIMER}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReferenceHub;
