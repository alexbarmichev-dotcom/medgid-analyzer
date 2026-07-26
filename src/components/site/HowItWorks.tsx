import Icon from '@/components/ui/icon';

const STEPS = [
  {
    icon: 'Upload',
    title: 'Загружаете анализы',
    text: 'Отправьте скан или фото результатов: общий и биохимический анализ крови, гормоны щитовидной железы, витамины, анализ мочи, копрограмму и другие. Укажите возраст, пол и текущие жалобы.',
  },
  {
    icon: 'BrainCircuit',
    title: 'Искусственный интеллект анализирует данные',
    text: 'Запрос обрабатывается нейросетью, обученной на медицинских данных. Анализ занимает считанные секунды.',
  },
  {
    icon: 'FileText',
    title: 'Получаете понятное резюме',
    text: 'Каждый показатель разбирается отдельно: что означает, почему важен, в какую сторону отклоняется. Плюс рекомендации по дополнительным исследованиям и готовый список вопросов для врача.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="relative scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-14 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Как это работает
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Три шага — <span className="hand-underline text-accent">от фото до ясности</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-3xl border border-border bg-background p-7 transition-transform hover:-translate-y-1"
            >
              <span className="font-head text-5xl font-extrabold text-accent/15">
                0{i + 1}
              </span>
              <span className="mt-4 grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Icon name={s.icon} size={24} />
              </span>
              <h3 className="mt-5 font-head text-lg font-bold leading-snug">{s.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
