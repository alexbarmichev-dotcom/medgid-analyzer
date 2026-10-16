import Icon from '@/components/ui/icon';

const STATS = [
  {
    icon: 'FileText',
    value: '12',
    label: 'анализов расшифровано',
  },
  {
    icon: 'Timer',
    value: '30–60 сек',
    label: 'средняя скорость разбора',
  },
  {
    icon: 'Star',
    value: '5,0 из 5',
    label: 'оценка пользователей',
  },
];

const Stats = () => {
  return (
    <section className="relative bg-background">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-3xl border border-border bg-card p-7 text-center transition-transform hover:-translate-y-1"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Icon name={s.icon} size={24} />
              </span>
              <span className="mt-4 font-head text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl">
                {s.value}
              </span>
              <span className="mt-2 font-caveat text-xl font-bold text-hand">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
