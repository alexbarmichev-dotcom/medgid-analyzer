import Icon from '@/components/ui/icon';

const scrollTo = (href: string) =>
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* paper grain lines */}
      <div
        className="paper-lines pointer-events-none absolute inset-0 opacity-50"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)',
        }}
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 md:px-8 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
        {/* left column */}
        <div className="animate-fade-in">
          <span className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Расшифровка анализов на понятном языке
          </span>

          <h1 className="font-head text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[3.4rem] lg:text-[4.3rem]">
            <span className="font-normal text-muted-foreground">«Гемоглобин&nbsp;— 168.</span>
            <br />
            И&nbsp;что мне с&nbsp;этим{' '}
            <span className="hand-underline text-accent">делать?»</span>
          </h1>

          <p className="mt-6 max-w-[30ch] text-lg leading-relaxed text-ink-soft sm:text-xl">
            МедГид разбирает каждый показатель отдельно: что означает, почему отклонился
            и&nbsp;о&nbsp;чём спросить врача на&nbsp;приёме.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <button
              onClick={() => scrollTo('#start')}
              className="inline-flex items-center gap-2.5 rounded-[var(--radius)] bg-accent px-7 py-4 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:-translate-y-0.5"
            >
              Войти в личный кабинет
              <Icon name="ArrowRight" size={18} />
            </button>
            <p className="max-w-[16ch] text-sm leading-snug text-muted-foreground">
              Разбор одного анализа&nbsp;— 250&nbsp;₽
            </p>
          </div>
        </div>

        {/* right column — lab card */}
        <div className="relative">
          <span className="absolute -top-2 left-[42%] z-20 -rotate-6 font-caveat text-2xl text-hand">
            вот тут и&nbsp;начинается разговор
          </span>

          <div className="relative rotate-[1.4deg] animate-floaty rounded-[26px] bg-card p-6 shadow-[0_26px_50px_-30px_rgba(28,27,24,0.5)]">
            <div className="mb-4 flex items-center justify-between border-b border-paper-line pb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Биохимия крови · загружено фото
              </span>
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-out-range">
                2 отклонения
              </span>
            </div>

            {/* row 1 — high */}
            <div className="mb-5">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[0.95rem] font-semibold">Гемоглобин</span>
                <span className="font-head text-base font-semibold text-out-range">168 г/л ↑</span>
              </div>
              <div className="relative h-2 rounded-full bg-[hsl(var(--hero-track))]">
                <div className="absolute bottom-0 top-0 left-[16%] right-[8%] rounded-full bg-out-range/30" />
                <span className="absolute -top-1 left-[88%] h-4 w-4 -translate-x-1/2 rounded-full border-[3.4px] border-card bg-out-range" />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>норма 130–160</span>
                <span>ваш результат</span>
              </div>
            </div>

            {/* row 2 — ok */}
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[0.95rem] font-semibold">Витамин&nbsp;D</span>
                <span className="font-head text-base font-semibold text-in-range">41 нг/мл</span>
              </div>
              <div className="relative h-2 rounded-full bg-[hsl(var(--hero-track))]">
                <div className="absolute bottom-0 top-0 left-[16%] right-[38%] rounded-full bg-in-range/30" />
                <span className="absolute -top-1 left-[52%] h-4 w-4 -translate-x-1/2 rounded-full border-[3.4px] border-card bg-in-range" />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>норма 30–100</span>
                <span>в пределах нормы</span>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 border-t border-paper-line pt-4 text-sm leading-snug text-ink-soft">
              <span className="mt-0.5 grid h-[22px] w-[22px] flex-none place-items-center rounded-md bg-hand">
                <Icon name="Check" size={13} className="text-accent-foreground" />
              </span>
              <span>
                <span className="font-semibold text-out-range">Немного выше нормы. </span>
                Часто связано с обезвоживанием или высотой. Стоит пересдать натощак и обсудить
                с&nbsp;терапевтом.
              </span>
            </div>

            <span className="absolute -right-6 bottom-5 rotate-[7deg] font-caveat text-xl leading-none text-hand">
              ← читаемо!
            </span>
          </div>
        </div>
      </div>

      {/* foot strip */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 pb-10 text-sm text-muted-foreground md:px-8">
        {[
          'Данные на серверах в России, 152-ФЗ',
          'Без ФИО и полиса',
          'Не ставит диагноз — готовит к приёму',
        ].map((t) => (
          <span key={t} className="inline-flex items-center gap-2">
            <span className="h-[5px] w-[5px] rounded-full bg-hand" />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
};

export default Hero;
