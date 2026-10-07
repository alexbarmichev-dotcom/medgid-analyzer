import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import { ARTICLES } from '@/data/articles';

const Article = () => {
  const { slug } = useParams();
  const article = ARTICLES.find((a) => a.slug === slug);

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