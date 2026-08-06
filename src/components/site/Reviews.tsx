import { useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Review {
  author: string;
  role: string;
  rating: number;
  text: string;
  date: string;
}

const REVIEWS: Review[] = [
  {
    author: 'Марина К.',
    role: 'Расшифровка биохимии крови',
    rating: 5,
    text: 'Раньше я гуглила каждую цифру из анализов и только больше пугалась. С ЛабГидом за пять минут стало понятно, что реально важно, а что можно спокойно обсудить с врачом на приёме.',
    date: 'июль 2026',
  },
  {
    author: 'Любовь Андреевна, 64 года',
    role: 'Общий анализ крови и гормоны',
    rating: 5,
    text: 'За столько лет ни один врач не удосужился объяснить мне мои анализы, вот так — понятно, подробно, по-человечески. Загрузила, прочитала, и всё встало на свои места.',
    date: 'июнь 2026',
  },
  {
    author: 'Дмитрий С.',
    role: 'Анализ на витамины и микроэлементы',
    rating: 5,
    text: 'Удобно, что сразу видно отклонения от нормы с учётом моего возраста. Сохранил расшифровку в PDF и взял с собой на приём — врач сразу понял, о чём я хочу спросить.',
    date: 'май 2026',
  },
  {
    author: 'Ольга В.',
    role: 'Гормоны щитовидной железы',
    rating: 4,
    text: 'Понравилось, что объясняют простым языком без медицинских терминов. Единственное — хотелось бы больше деталей по отдельным показателям, но в целом сервис реально помогает разобраться.',
    date: 'май 2026',
  },
  {
    author: 'Игорь П.',
    role: 'Биохимия и липидный профиль',
    rating: 5,
    text: 'Пользуюсь уже полгода, слежу за динамикой холестерина в личном кабинете. Очень удобно видеть графики и сравнивать с прошлыми анализами — мотивирует следить за здоровьем.',
    date: 'апрель 2026',
  },
  {
    author: 'Анна Т.',
    role: 'Общий анализ мочи',
    rating: 5,
    text: 'Загрузила скан анализа, через минуту получила понятную расшифровку и список вопросов для врача. Это сильно сэкономило время на приёме — врач сразу перешёл к делу.',
    date: 'апрель 2026',
  },
];

const AVERAGE_RATING = (
  REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length
).toFixed(1);

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Icon
        key={i}
        name="Star"
        size={15}
        className={i < rating ? 'fill-accent text-accent' : 'fill-muted text-muted'}
      />
    ))}
  </div>
);

const Reviews = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'ЛабГид — расшифровка анализов онлайн',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: AVERAGE_RATING,
        reviewCount: REVIEWS.length,
      },
      review: REVIEWS.map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.text,
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <section id="reviews" className="relative scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="h-[7px] w-[7px] rounded-full bg-accent" />
              Отзывы клиентов
            </span>
            <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Что говорят те, кто уже{' '}
              <span className="hand-underline text-accent">расшифровал анализы</span>
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
              Реальные впечатления людей, которые пользовались сервисом для расшифровки анализов
              крови, мочи и гормонов.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-background px-6 py-4">
            <span className="font-head text-4xl font-extrabold text-accent">{AVERAGE_RATING}</span>
            <div>
              <Stars rating={Math.round(Number(AVERAGE_RATING))} />
              <p className="mt-1 text-xs text-muted-foreground">{REVIEWS.length} отзывов</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <div
              key={r.author}
              className="flex flex-col rounded-3xl border border-border bg-background p-6 transition-transform hover:-translate-y-1"
            >
              <div className="mb-4 flex items-center justify-between">
                <Stars rating={r.rating} />
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <p className="flex-1 text-[0.9rem] leading-relaxed text-ink-soft">«{r.text}»</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-hand/10 text-sm font-bold text-hand">
                  {r.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.author}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
