import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Logo from './Logo';

const NAV = [
  { label: 'Как это работает', href: '#how' },
  { label: 'Что вы получаете', href: '#features' },
  { label: 'Защита данных', href: '#security' },
  { label: 'Стоимость', href: '#pricing' },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled ? 'bg-background/85 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <button onClick={() => go('#top')} aria-label="На главную">
          <Logo />
        </button>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <button
              key={n.href}
              onClick={() => go(n.href)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </button>
          ))}
          <button
            onClick={() => go('#start')}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Личный кабинет
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
            <button
              onClick={() => go('#start')}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-5 py-3 text-base font-semibold text-accent-foreground"
            >
              Личный кабинет
              <Icon name="ArrowRight" size={18} />
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
