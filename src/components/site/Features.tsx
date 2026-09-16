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

const WHY_POINTS = [
  { icon: 'TrendingUp', text: 'Замечайте отклонения раньше, чем они станут проблемой' },
  { icon: 'BookOpenCheck', text: 'Понимайте свои показатели без медицинских терминов' },
  { icon: 'MessagesSquare', text: 'Задавайте врачу точные вопросы, а не гадайте' },
  { icon: 'Activity', text: 'Отслеживайте динамику, а не разовый снимок' },
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
              <p className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-soft font-bold">
                {f.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-7 md:p-10">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-hand/10 text-hand">
              <Icon name="HeartPulse" size={24} />
            </span>
            <h3 className="font-head text-xl font-bold leading-snug sm:text-2xl">
              Почему стоит разбирать анализы регулярно
            </h3>
          </div>

          <p className="max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft font-bold mx-0 my-2.5 px-[33px] py-[1px] text-center">
            Одна цифра в бланке — просто число. Ряд цифр во времени — история вашего здоровья.
          </p>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_POINTS.map((p) => (
              <div key={p.text} className="rounded-2xl bg-muted/50 p-5 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-hand/10 text-hand">
                  <Icon name={p.icon} size={20} />
                </span>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft font-bold">{p.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-7 text-[0.95rem] leading-relaxed text-ink-soft font-bold">
            ИИ-разбор — это не замена врачу, а помощник, который всегда рядом: расшифрует анализ за
            секунды, покажет тренды и подскажет, на что обратить внимание.
          </p>
          <p className="mt-3 font-caveat text-2xl text-hand">
            Ваше здоровье — не тайна за семью печатями. Разберитесь в нём.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;