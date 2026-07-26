import Icon from '@/components/ui/icon';

const FEATURES = [
  {
    icon: 'Microscope',
    title: 'Понимание каждого показателя',
    text: 'Что именно измеряется, какую функцию это отражает в организме и почему это важно для вашего здоровья.',
  },
  {
    icon: 'BarChart3',
    title: 'Оценка с учётом вашего профиля',
    text: 'Норма или отклонение — с поправкой на референтный диапазон, возраст, пол и индивидуальные факторы: беременность, приём лекарств и другое.',
  },
  {
    icon: 'ClipboardList',
    title: 'Доступное объяснение отклонений',
    text: 'Возможные причины и их клиническая значимость — без постановки диагноза, но с полным пониманием ситуации.',
  },
  {
    icon: 'MessageSquare',
    title: 'Готовые вопросы для врача',
    text: 'Список тем и вопросов, которые важно обсудить на приёме. Вы приходите к специалисту подготовленным.',
  },
  {
    icon: 'LineChart',
    title: 'Личный дневник здоровья',
    text: 'Сервис хранит историю исследований, строит графики динамики и поддерживает умный поиск: «Как менялся холестерин, с тех пор как я начал бегать?». Отчёты можно экспортировать в PDF.',
    wide: true,
  },
];

const Features = () => {
  return (
    <section id="features" className="relative scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-14 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Что вы получаете
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Не просто цифры, а{' '}
            <span className="hand-underline text-accent">разговор о здоровье</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`rounded-3xl border border-border bg-card p-7 transition-transform hover:-translate-y-1 ${
                f.wide ? 'lg:col-span-1 md:col-span-2 lg:row-span-1' : ''
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-hand/10 text-hand">
                <Icon name={f.icon} size={24} />
              </span>
              <h3 className="mt-5 font-head text-lg font-bold leading-snug">{f.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
