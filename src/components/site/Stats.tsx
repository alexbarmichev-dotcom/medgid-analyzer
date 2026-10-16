import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

const HISTORY_URL = 'https://functions.poehali.dev/c6e19e20-72b0-4a41-b317-8eb65ffd4dce';

interface StatsData {
  analyses: number;
  rating: number;
}

const FALLBACK: StatsData = { analyses: 156, rating: 5 };

const Stats = () => {
  const [data, setData] = useState<StatsData>(FALLBACK);

  useEffect(() => {
    fetch(`${HISTORY_URL}?resource=stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.analyses === 'number') {
          setData({ analyses: d.analyses, rating: Number(d.rating) || 5 });
        }
      })
      .catch(() => undefined);
  }, []);

  const items = [
    {
      icon: 'FileText',
      value: data.analyses.toLocaleString('ru-RU'),
      label: 'анализов расшифровано',
    },
    { icon: 'Timer', value: '30–60 сек', label: 'средняя скорость разбора' },
    {
      icon: 'Star',
      value: `${data.rating.toFixed(1).replace('.', ',')} из 5`,
      label: 'оценка пользователей',
    },
  ];

  return (
    <section className="relative bg-background">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {items.map((s) => (
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
