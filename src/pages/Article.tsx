import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import { ARTICLES } from '@/data/articles';

const Article = () => {
  const { slug } = useParams();
  const article = ARTICLES.find((a) => a.slug === slug);
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
            <Link to="/#articles" className="hover:text-accent">Статьи</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{article.title}</span>
          </nav>

          <h1 className="font-head text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
            {article.title}
          </h1>

          {article.cover && (
            <img
              src={article.cover}
              alt={article.title}
              className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover"
            />
          )}

          <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed text-ink-soft">
            {article.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <p className="mt-10 font-caveat text-2xl text-hand">{article.author}</p>

          <div className="mt-12 rounded-3xl border-2 border-accent/25 bg-card p-7 text-center md:p-10">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-hand/10 text-hand">
              <Icon name="FileSearch" size={24} />
            </span>
            <h2 className="mt-4 font-head text-xl font-bold sm:text-2xl">
              Придите к врачу подготовленным
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
              Загрузите фото анализа — получите понятный разбор показателей и список вопросов для
              врача за пару минут.
            </p>
            <Link
              to="/#start"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius)] bg-hand px-6 py-3.5 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              Расшифровать свой анализ
              <Icon name="ArrowRight" size={18} />
            </Link>
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
                          src={a.cover}
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