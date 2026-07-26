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
            <span className="block w-full text-center font-normal text-muted-foreground">Пришли результаты анализов из&nbsp;лаборатории.</span>
            <br />
            <span className="block w-full text-center">
              И&nbsp;что мне с&nbsp;этим{' '}
              <span className="hand-underline text-accent">делать?</span>
            </span>
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
          <span className="absolute -top-2 left-[38%] z-20 -rotate-6 font-caveat text-2xl text-hand font-thin">
            вот тут и&nbsp;начинается разговор
          </span>

          <div className="relative overflow-hidden rotate-[1.4deg] animate-floaty rounded-[22px] shadow-[0_26px_50px_-30px_rgba(28,27,24,0.5)]">
            <img
              src="https://cdn.poehali.dev/projects/a50bf440-39eb-48cd-8c9b-26529e75ba50/bucket/26028d96-5831-4ee2-bdc2-1ed20587a685.jpeg"
              alt="Бланк анализа крови с рукописными результатами"
              className="block w-full h-auto select-none"
              draggable={false}
            />

            {/* handwritten green mark — холестерин */}
            <span className="absolute left-[68%] top-[31.5%] h-[9%] w-[22%] -rotate-3 rounded-[50%] border-[3px] border-[#0FA968] shadow-[0_0_0_1px_rgba(255,255,255,0.35)]" />
            <span className="absolute left-[68%] top-[41%] -rotate-2 font-caveat text-xl font-bold text-[#0FA968] [text-shadow:0_1px_3px_rgba(255,255,255,0.85)]">
              выше нормы!
            </span>

            {/* handwritten green mark — С-реактивный белок */}
            <span className="absolute left-[62%] top-[61.5%] h-[9%] w-[34%] rotate-2 rounded-[50%] border-[3px] border-[#0FA968] shadow-[0_0_0_1px_rgba(255,255,255,0.35)]" />
            <span className="absolute left-[62%] top-[57%] rotate-1 font-caveat text-xl font-bold text-[#0FA968] [text-shadow:0_1px_3px_rgba(255,255,255,0.85)]">
              что это значит?
            </span>

            <span className="absolute right-4 bottom-4 rotate-[7deg] font-caveat text-xl leading-none text-hand">
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