import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { ARTICLES } from '@/data/articles';

const Articles = () => {
  return (
    <section id="articles" className="relative scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-12 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Статьи
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Читайте о{' '}
            <span className="hand-underline text-accent">здоровье и анализах</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              to={`/articles/${a.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-background transition-transform hover:-translate-y-1"
            >
              {a.cover ? (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={a.cover}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-7">
              {!a.cover && (
                <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-hand/10 text-hand">
                  <Icon name="BookOpen" size={24} />
                </span>
              )}
              <h3 className="font-head text-lg font-bold leading-snug">{a.title}</h3>
              <p className="mt-3 line-clamp-4 text-[0.95rem] leading-relaxed text-ink-soft">
                {a.excerpt}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-accent">
                Читать статью
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
      </div>
    </section>
  );
};

export default Articles;