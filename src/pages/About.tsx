import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import { ABOUT_LEAD, ABOUT_SECTIONS, ABOUT_TITLE } from '@/data/about';

const About = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${ABOUT_TITLE} — расшифровка анализов онлайн`;
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div
            className="paper-lines pointer-events-none absolute inset-0 opacity-40"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
            <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-accent">Главная</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">О сервисе</span>
            </nav>

            <div className="mb-10 text-center">
              <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="h-[7px] w-[7px] rounded-full bg-accent" />
                О нас
              </span>
              <h1 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                О сервисе <span className="hand-underline text-accent">ЛабГид</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
                {ABOUT_LEAD}
              </p>
            </div>

            <div className="space-y-6">
              {ABOUT_SECTIONS.map((s) => (
                <div key={s.title} className="rounded-3xl border border-border bg-card p-6 md:p-8">
                  <h2 className="mb-3 font-head text-lg font-bold">{s.title}</h2>
                  {s.paragraphs.map((p) => (
                    <p key={p} className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/#feedback"
                className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
              >
                Написать нам
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
