import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import ArticleCard from '@/components/site/ArticleCard';
import { ARTICLES } from '@/data/articles';

const Blog = () => {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const prevTitle = document.title;
    document.title = 'Блог о здоровье и анализах — ЛабГид';
    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute('content') || '';
    meta?.setAttribute(
      'content',
      'Статьи о здоровье, лабораторных анализах и разговоре с врачом: простым языком о том, как понимать свои результаты.'
    );
    return () => {
      document.title = prevTitle;
      meta?.setAttribute('content', prevDescription);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Главная</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Блог</span>
          </nav>
          <h1 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Читайте о <span className="hand-underline text-accent">здоровье и анализах</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Статьи о том, как понимать свои анализы и приходить к врачу подготовленным.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
