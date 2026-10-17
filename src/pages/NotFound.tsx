import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import { useNoindex } from '@/hooks/useNoindex';

const NotFound = () => {
  useNoindex();

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header />
      <main className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hand/10 text-hand">
          <Icon name="FileSearch" size={28} />
        </span>
        <h1 className="mt-5 font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          Страница не найдена
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Такой страницы нет, но расшифровать анализ можно прямо сейчас: загрузите фото бланка и
          получите понятный разбор за 30–60 секунд.
        </p>
        <Link
          to="/#try"
          className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius)] bg-hand px-6 py-3.5 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
        >
          Расшифровать анализ
          <Icon name="ArrowRight" size={18} />
        </Link>
        <div className="mt-6">
          <Link to="/faq" className="text-sm font-semibold text-accent hover:underline">
            Частые вопросы
          </Link>
          <span className="mx-3 text-muted-foreground">·</span>
          <Link to="/" className="text-sm font-semibold text-accent hover:underline">
            На главную
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
