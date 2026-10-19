import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Logo from './Logo';
import InstallAppButton from './InstallAppButton';
import { emitStartIntent } from '@/lib/startFlowBus';

const NAV = [
  { label: 'Как это работает', href: '#how' },
  { label: 'Что вы получаете', href: '#features' },
  { label: 'Отзывы', href: '#reviews' },
  { label: 'Статьи', href: '/blog' },
  { label: 'Стоимость', href: '#pricing' },
  { label: 'Вопросы', href: '#feedback' },
  { label: 'FAQ', href: '/faq' },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (href: string) => {
    setOpen(false);

    if (href.startsWith('/')) {
      navigate(href);
      return;
    }

    if (location.pathname !== '/') {
      navigate(`/${href}`);
      return;
    }

    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const startFree = () => {
    setOpen(false);
    if (location.pathname !== '/') {
      navigate('/#try');
      return;
    }
    emitStartIntent('anonymous');
    document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled ? 'bg-background/85 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <button onClick={() => (location.pathname !== '/' ? navigate('/') : go('#top'))} aria-label="На главную">
          <Logo />
        </button>

        <nav className="hidden items-center gap-5 pl-6 xl:gap-7 lg:flex">
          {NAV.map((n) => (
            <button
              key={n.href}
              onClick={() => go(n.href)}
              className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </button>
          ))}
          <InstallAppButton className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted" />
          <button
            onClick={startFree}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius)] bg-hand px-5 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            Расшифровать анализ
            <Icon name="ArrowRight" size={16} />
          </button>
        </nav>

        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-border text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          <Icon name={open ? 'X' : 'Menu'} size={22} />
        </button>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-border bg-card px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <button
                key={n.href}
                onClick={() => go(n.href)}
                className="rounded-lg px-3 py-3 text-left text-base font-medium text-foreground hover:bg-muted"
              >
                {n.label}
              </button>
            ))}
            <InstallAppButton
              onDone={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border px-5 py-3 text-base font-semibold text-foreground"
            />
            <button
              onClick={startFree}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-5 py-3 text-base font-semibold text-accent-foreground"
            >
              Расшифровать анализ — 150 ₽
              <Icon name="ArrowRight" size={18} />
            </button>
            <button
              onClick={() => {
                if (location.pathname === '/') emitStartIntent('subscribe');
                go('#start');
              }}
              className="mt-1 px-3 py-3 text-center text-base font-medium text-muted-foreground"
            >
              Личный кабинет
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;