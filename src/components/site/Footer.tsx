import Logo from './Logo';

const LEGAL = [
  'Пользовательское соглашение',
  'Политика конфиденциальности',
  'Согласие на обработку персональных данных',
  'Медицинский дисклеймер',
  'Политика хранения и удаления данных',
  'Правила оплаты и возврата',
  'Соблюдение требований ФЗ-152',
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
              МедГид — это новый уровень диалога между вами и вашим здоровьем. Понимайте своё тело,
              приходите к врачу подготовленными и следите за трендами в динамике, а не только за
              статичными цифрами.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Документы
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {LEGAL.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-ink-soft transition-colors hover:text-accent"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} МедГид. Все права защищены.</span>
          <span>Данные хранятся на серверах в России · 152-ФЗ</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
