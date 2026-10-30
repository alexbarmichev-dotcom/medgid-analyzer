import { useEffect, useState } from 'react';
import { ARTICLE_TOPICS, topicsOf, type TopicId } from '@/data/articleTopics';
import { Link } from "@/lib/router-compat";
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import ArticleCard from '@/components/site/ArticleCard';
import { useArticles } from '@/hooks/useArticles';
import type { Article } from '@/data/articles';

const Blog = ({ initialArticles }: { initialArticles?: Article[] }) => {
  const { data: articles = [], isLoading } = useArticles(initialArticles);
  const [topic, setTopic] = useState<'all' | TopicId>('all');
  const visible = topic === 'all' ? articles : articles.filter((a) => topicsOf(a.slug).includes(topic));
  useEffect(() => {
    window.scrollTo({ top: 0 });
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
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Фильтр по темам">
            {[{ id: 'all' as const, label: 'Все статьи' }, ...ARTICLE_TOPICS].map((t) => {
              const active = topic === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTopic(t.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-card text-foreground hover:border-accent hover:text-accent'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              [0, 1, 2].map((n) => <div key={n} className="h-80 animate-pulse rounded-3xl bg-card" />)}
            {visible.map((a) => (
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