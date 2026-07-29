import Icon from '@/components/ui/icon';

const scrollTo = (href: string) =>
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

const INCLUDED = [
  'Разбор каждого показателя отдельно',
  'Оценка с учётом возраста, пола и профиля',
  'Объяснение возможных причин отклонений',
  'Готовый список вопросов для врача',
  'Сохранение результата в дневник здоровья',
  'Экспорт отчёта в PDF',
];

const Pricing = () => {
  return (
    <section id="pricing" className="relative scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-12 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Стоимость и оплата
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Платите только за то, что нужно
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Никаких подписок и скрытых платежей. Оплачиваете один разбор — получаете полную
            расшифровку. Запрос уходит в нейросеть только после подтверждения оплаты.
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-between rounded-3xl bg-accent p-8 text-accent-foreground md:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
                Один разбор анализа
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-head text-6xl font-extrabold tracking-[-0.03em]">190</span>
                <span className="font-head text-3xl font-bold">₽</span>
              </div>
              <p className="mt-3 text-accent-foreground/85">
                Фиксированная стоимость одного запроса. Оплата картой, безопасно.
              </p>
            </div>
            <button
              onClick={() => scrollTo('#start')}
              className="mt-8 inline-flex items-center justify-center gap-2.5 rounded-[var(--radius)] bg-primary px-7 py-4 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Начать разбор
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>

          <div className="rounded-3xl border border-border bg-background p-8 md:p-10">
            <h3 className="font-head text-xl font-bold">Что входит в разбор</h3>
            <ul className="mt-6 space-y-4">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-hand/12 text-hand">
                    <Icon name="Check" size={15} />
                  </span>
                  <span className="text-[0.98rem] leading-snug text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;