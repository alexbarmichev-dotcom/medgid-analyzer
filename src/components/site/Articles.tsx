import { Link } from "@/lib/router-compat";
import Icon from '@/components/ui/icon';
import { useArticles } from '@/hooks/useArticles';
import ArticleCard from '@/components/site/ArticleCard';
import type { Article } from '@/data/articles';

const Articles = ({ initialArticles }: { initialArticles?: Article[] }) => {
  const { data: articles = [] } = useArticles(initialArticles);
  return (
    <section id="articles" className="relative scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-12 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Статьи
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            <Link to="/blog" className="group inline-flex flex-wrap items-center gap-x-4 gap-y-4">
              <span className="pb-1">
                Читайте о <span className="hand-underline text-accent">здоровье и анализах</span>
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 transition-transform group-hover:translate-x-1">
                <Icon name="ArrowRight" size={26} strokeWidth={3} />
              </span>
            </Link>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.filter((a) => !a.hideOnHome).slice(0, 3).map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            Все статьи
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Articles;