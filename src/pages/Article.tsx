import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
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
